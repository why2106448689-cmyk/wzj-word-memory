"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, addDays, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useStudyStore } from "@/lib/store";
import { calculateEndDate, getDayTask, TOTAL_LISTS } from "@/types";

export default function SchedulePage() {
  const router = useRouter();
  const { startDate } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 如果没有设置开始日期，默认使用今天
  const effectiveStartDate = startDate || format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Loading />;

  const studyStartDate = new Date(effectiveStartDate);
  const studyEndDate = calculateEndDate(studyStartDate);
  const totalDays = differenceInDays(studyEndDate, studyStartDate) + 1;
  const today = new Date();
  const allDates = Array.from({ length: totalDays }).map((_, i) => {
    const date = addDays(studyStartDate, i);
    return { date, day: i + 1, task: getDayTask(date, studyStartDate) };
  });
  const selectedTask = getDayTask(selectedDate, studyStartDate);

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href="/" style={backBtnStyle}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 style={titleStyle}>学习计划</h1>
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
            {(["calendar", "table"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? '#0f172a' : '#64748b',
                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>
                {mode === "calendar" ? "日历" : "表格"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        {viewMode === "calendar" ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {["日", "一", "二", "三", "四", "五", "六"].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '8px 0', fontWeight: 500 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {allDates.slice(0, 42).map(({ date, day, task }) => {
                  const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                  const hasTask = task.newLists.length > 0 || task.reviewLists.length > 0;
                  const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  return (
                    <button key={day} onClick={() => setSelectedDate(date)} style={{
                      aspectRatio: '1', borderRadius: 12, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', border: isSelected ? '2px solid #0ea5e9' : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: isToday ? '#0ea5e9' : isSelected ? '#eff6ff' : hasTask ? '#f0fdf4' : '#f8fafc',
                      color: isToday ? 'white' : '#0f172a',
                      fontWeight: isToday || isSelected ? 600 : 400,
                    }}>
                      <span style={{ fontSize: 15 }}>{date.getDate()}</span>
                      {hasTask && !isToday && <span style={{ fontSize: 9, color: '#0ea5e9', marginTop: 1 }}>{task.newLists.length + task.reviewLists.length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>
                {format(selectedDate, "MM月dd日 EEEE", { locale: zhCN })}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#64748b' }}>新学</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selectedTask.newLists.length > 0 ? selectedTask.newLists.map(l => (
                      <span key={l} style={{ padding: '5px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>L{l}</span>
                    )) : <span style={{ fontSize: 13, color: '#cbd5e1' }}>无</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#64748b' }}>复习</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selectedTask.reviewLists.length > 0 ? selectedTask.reviewLists.slice(0, 4).map(l => (
                      <span key={l} style={{ padding: '5px 12px', background: '#fff7ed', color: '#ea580c', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>L{l}</span>
                    )) : <span style={{ fontSize: 13, color: '#cbd5e1' }}>无</span>}
                    {selectedTask.reviewLists.length > 4 && <span style={{ fontSize: 12, color: '#94a3b8' }}>+{selectedTask.reviewLists.length - 4}</span>}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>预计</span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>{selectedTask.totalWords} 词 · {selectedTask.estimatedMinutes} 分钟</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { name: "阶段一", date: "6.14-6.20", color: "#0ea5e9", bg: "#eff6ff" },
                { name: "阶段二", date: "6.21-7.04", color: "#2563eb", bg: "#eff6ff" },
                { name: "阶段三", date: "7.05-7.11", color: "#ea580c", bg: "#fff7ed" },
                { name: "阶段四", date: "7.12-8.05", color: "#16a34a", bg: "#f0fdf4" },
              ].map(p => (
                <div key={p.name} style={{ background: p.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: p.color, margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '3px 0 0' }}>{p.date}</p>
                </div>
              ))}
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#64748b' }}>日期</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#64748b' }}>新学</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#64748b' }}>复习</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#64748b' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {allDates.slice(0, 30).map(({ date, day, task }) => {
                    const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                    const isPast = date < today && !isToday;
                    return (
                      <tr key={day} style={{ borderTop: '1px solid #f1f5f9', background: isToday ? '#eff6ff' : 'transparent' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{format(date, "MM/dd")}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{format(date, "EEE", { locale: zhCN })}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {task.newLists.length > 0 ? task.newLists.map(l => (
                              <span key={l} style={{ padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>L{l}</span>
                            )) : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {task.reviewLists.length > 0 ? task.reviewLists.slice(0, 3).map(l => (
                              <span key={l} style={{ padding: '3px 8px', background: '#fff7ed', color: '#ea580c', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>L{l}</span>
                            )) : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                            {task.reviewLists.length > 3 && <span style={{ fontSize: 11, color: '#94a3b8' }}>+{task.reviewLists.length - 3}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {isPast ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: '#f0fdf4', color: '#16a34a', borderRadius: '50%', fontSize: 12 }}>✓</span>
                          ) : isToday ? (
                            <span style={{ padding: '4px 12px', background: '#0ea5e9', color: 'white', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>今天</span>
                          ) : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <BottomNav active="schedule" />
    </div>
  );
}

function Loading() {
  return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { href: '/', label: '首页', key: 'home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
    { href: '/schedule', label: '计划表', key: 'schedule', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
    { href: '/lists', label: 'List', key: 'lists', icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
    { href: '/stats', label: '统计', key: 'stats', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  ];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {items.map(item => (
          <Link key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 16px', textDecoration: 'none', color: item.key === active ? '#0ea5e9' : '#94a3b8', minWidth: 64 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.key === active ? 2 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span style={{ fontSize: 10, marginTop: 3, fontWeight: item.key === active ? 600 : 400 }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' };
const headerInnerStyle: React.CSSProperties = { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const backBtnStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 };
const mainStyle: React.CSSProperties = { padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 };
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' };
