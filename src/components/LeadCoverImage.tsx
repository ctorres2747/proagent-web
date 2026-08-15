"use client";

import { useState } from "react";

export function LeadCoverImage({
  url,
  className = "mb-2 h-20 w-full rounded-lg object-cover",
}: {
  url: string | null | undefined;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !url || failed;

  if (showPlaceholder) {
    return (
      <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-[var(--pa-bg-alt)] text-[11px] text-[var(--pa-faint)]">
        Sin foto
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
