"use client";

import { useState } from "react";

export function LeadCoverImage({
  url,
  variant = "chip",
  className,
}: {
  url: string | null | undefined;
  variant?: "chip" | "card";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !url || failed;

  if (variant === "card") {
    if (showPlaceholder) {
      return (
        <div className="relative mb-3.5 h-[150px] overflow-hidden rounded-xl">
          <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)]">
            <span className="font-mono text-[11px] text-[#8B98A5]">Sin foto</span>
          </div>
        </div>
      );
    }
    return (
      <div className="relative mb-3.5 h-[150px] overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  if (showPlaceholder) {
    return (
      <div
        className={
          className ??
          "mb-2 flex h-20 items-center justify-center rounded-lg bg-[var(--pa-bg-alt)] text-[11px] text-[var(--pa-faint)]"
        }
      >
        Sin foto
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={className ?? "mb-2 h-20 w-full rounded-lg object-cover"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
