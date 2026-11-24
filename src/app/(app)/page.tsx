"use client";

import { Suspense } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { AdminInicioDashboard } from "@/features/inicio/AdminInicioDashboard";
import { InicioDashboard } from "@/features/inicio/InicioDashboard";

function InicioByRole() {
  const { session } = useAuth();
  if (session?.role === "admin") return <AdminInicioDashboard />;
  return <InicioDashboard />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <InicioByRole />
    </Suspense>
  );
}
