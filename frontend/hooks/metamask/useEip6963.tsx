"use client";

import { useEffect, useState } from "react";

export type Eip6963ProviderDetail = {
  info: { name: string; rdns?: string; uuid?: string };
  provider: any;
};

export function useEip6963(): { providers: Eip6963ProviderDetail[]; error?: Error } {
  const [providers, setProviders] = useState<Eip6963ProviderDetail[]>([]);
  useEffect(() => {
    function onAnnounce(e: any) {
      setProviders((prev) => {
        const exists = prev.some((p) => p.info?.uuid === e.detail?.info?.uuid);
        return exists ? prev : [...prev, e.detail];
      });
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);
  return { providers };
}


