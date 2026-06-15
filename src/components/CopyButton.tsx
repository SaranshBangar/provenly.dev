"use client";
import { useState } from "react";
import { Icon } from "./Icon";

export function CopyButton({
  text,
  label = "Copy link",
  className = "btn btn-ghost btn-sm",
  style,
  block,
}: {
  text: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  block?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className={className + (block ? " btn-block" : "")} style={style} onClick={copy} type="button">
      <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied" : label}
    </button>
  );
}
