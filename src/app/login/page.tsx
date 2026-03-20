"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Login is no longer needed - redirect to dashboard
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
