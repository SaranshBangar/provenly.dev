-- 0001 — Organizations, events, templates; shared per-user credit wallet.
-- Data-preserving: existing single company per user keeps its certs/credits.

-- Shared credit / plan pool, one per user. Seed from existing company rows.
CREATE TABLE `wallet` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`credits` integer DEFAULT 5 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_user_id_unique` ON `wallet` (`user_id`);
--> statement-breakpoint
INSERT INTO `wallet` (`id`, `user_id`, `plan`, `credits`, `created_at`)
	SELECT lower(hex(randomblob(16))), `user_id`, `plan`, `credits`, `created_at` FROM `company`;
--> statement-breakpoint

-- Events within an organization.
CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`date` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Reusable certificate templates / "types".
CREATE TABLE `template` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'participation' NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Certificates can reference an event and the template they were issued from.
ALTER TABLE `certificate` ADD `event_id` text;
--> statement-breakpoint
ALTER TABLE `certificate` ADD `template_id` text;
--> statement-breakpoint

-- Repoint payment from company -> wallet (recreate to preserve rows + FK).
CREATE TABLE `payment_new` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_id` text NOT NULL,
	`cf_order_id` text NOT NULL,
	`amount_inr` integer NOT NULL,
	`credits` integer NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `payment_new` (`id`, `wallet_id`, `cf_order_id`, `amount_inr`, `credits`, `status`, `created_at`)
	SELECT p.`id`,
	       (SELECT w.`id` FROM `wallet` w JOIN `company` c ON c.`user_id` = w.`user_id` WHERE c.`id` = p.`company_id`),
	       p.`cf_order_id`, p.`amount_inr`, p.`credits`, p.`status`, p.`created_at`
	FROM `payment` p;
--> statement-breakpoint
DROP TABLE `payment`;
--> statement-breakpoint
ALTER TABLE `payment_new` RENAME TO `payment`;
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_cf_order_id_unique` ON `payment` (`cf_order_id`);
--> statement-breakpoint

-- Company is now many-per-user; credits/plan moved to wallet.
DROP INDEX `company_user_id_unique`;
--> statement-breakpoint
ALTER TABLE `company` DROP COLUMN `plan`;
--> statement-breakpoint
ALTER TABLE `company` DROP COLUMN `credits`;
