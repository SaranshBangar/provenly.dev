import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MIN_TOPUP_INR = 50;

type Env = {
  CASHFREE_ENV?: string;
  CASHFREE_APP_ID?: string;
  CASHFREE_SECRET_KEY?: string;
  CASHFREE_WEBHOOK_SECRET?: string;
};

export function cashfreeEnv() {
  const { env } = getCloudflareContext();
  return env as unknown as Env;
}

export function isCashfreeConfigured(): boolean {
  const env = cashfreeEnv();
  return !!(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
}

export function cashfreeBaseUrl(): string {
  const env = cashfreeEnv();
  return env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

export type CreateOrderInput = {
  orderId: string;
  amountInr: number;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  notifyUrl: string;
};

export async function createCashfreeOrder(input: CreateOrderInput): Promise<{ paymentSessionId: string; orderId: string }> {
  const env = cashfreeEnv();
  const res = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": env.CASHFREE_APP_ID!,
      "x-client-secret": env.CASHFREE_SECRET_KEY!,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amountInr,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || "9999999999",
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
      order_note: "Provenly certificate credits",
    }),
  });

  const json = (await res.json()) as { payment_session_id?: string; message?: string };
  if (!res.ok || !json.payment_session_id) {
    throw new Error(json.message || "Cashfree order creation failed");
  }
  return { paymentSessionId: json.payment_session_id, orderId: input.orderId };
}

/**
 * Verify a Cashfree webhook signature.
 * Signature = base64( HMAC-SHA256( timestamp + rawBody, secretKey ) ).
 */
export async function verifyCashfreeSignature(rawBody: string, signature: string, timestamp: string): Promise<boolean> {
  const env = cashfreeEnv();
  const secret = env.CASHFREE_WEBHOOK_SECRET || env.CASHFREE_SECRET_KEY;
  if (!secret || !signature || !timestamp) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(timestamp + rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}
