"use client";

import { useEffect } from "react";
import { useStudyStore } from "@/lib/store";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 检查并重置今日统计
    useStudyStore.getState().checkAndResetToday();
  }, []);

  return <>{children}</>;
}
