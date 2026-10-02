"use client";

import { Suspense } from "react";
import { InicioDashboard } from "@/features/inicio/InicioDashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <InicioDashboard />
    </Suspense>
  );
}
