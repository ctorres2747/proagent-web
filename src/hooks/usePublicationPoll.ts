"use client";

import { useEffect, useRef, useState } from "react";

import {
  PUBLICATION_POLL_INTERVAL_MS,
  PUBLICATION_POLL_TIMEOUT_MS,
  publicationHasInFlightChannels,
} from "@/lib/publicationPoll";
import { publicationsService } from "@/services";
import type { Publication } from "@/services/interfaces/publications";

export function usePublicationPoll(
  publicationId: string | null | undefined,
  publication: Publication | null,
  onUpdate: (publication: Publication) => void,
  token?: string,
) {
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const polling = Boolean(
    publicationId && publication && publicationHasInFlightChannels(publication),
  );

  useEffect(() => {
    if (!polling || !publicationId) {
      setPollTimedOut(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > PUBLICATION_POLL_TIMEOUT_MS) {
        setPollTimedOut(true);
        return;
      }
      try {
        const fresh = await publicationsService.get(publicationId, token);
        if (cancelled) return;
        onUpdateRef.current(fresh);
        if (!publicationHasInFlightChannels(fresh)) return;
      } catch {
        // Reintenta en el siguiente intervalo.
      }
      if (!cancelled) {
        timer = setTimeout(() => {
          void tick();
        }, PUBLICATION_POLL_INTERVAL_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [polling, publicationId, token]);

  return { polling, pollTimedOut };
}
