"use client";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CERT } from "./cert";
import type { CertData } from "@/db/schema";

const STORE_KEY = "provenly_cert_v1";

export function useCertDraft() {
  const [cert, setCert] = useState<CertData>(DEFAULT_CERT);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (s) setCert({ ...DEFAULT_CERT, ...JSON.parse(s) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cert));
    } catch {
      /* ignore */
    }
  }, [cert, loaded]);

  const update = useCallback(
    (patch: Partial<CertData> | ((c: CertData) => Partial<CertData>)) =>
      setCert((c) => ({ ...c, ...(typeof patch === "function" ? patch(c) : patch) })),
    [],
  );

  return { cert, setCert, update, loaded };
}
