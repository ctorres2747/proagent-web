"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CONFIG_ERROR } from "@/config/env";
import { AgentViewProvider } from "@/features/agentView/AgentViewProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  if (CONFIG_ERROR) {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center p-6 text-center"
      >
        <div className="max-w-md">
          <div className="text-2xl font-bold text-[var(--pa-navy)]">ProAgent</div>
          <p className="mt-3 text-sm text-[var(--pa-muted)]">{CONFIG_ERROR}</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgentViewProvider>{children}</AgentViewProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
