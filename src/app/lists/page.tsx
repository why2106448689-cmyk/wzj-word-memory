"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { TOTAL_LISTS, ESTIMATED_WORDS_PER_LIST } from "@/types";
import { differenceInDays, format } from "date-fns";

type ListStatus = "pending" | "learning" | "completed";

export default function ListsPage() {
  const { startDate, listProgress, wordProgress } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<{ num: number; status: ListStatus }[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "learning" | "completed" | "pending">("all");

  const effectiveStartDate = startDate || format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setMounted(true);

    setLists(Array.from({ length: TOTAL_LISTS }).map((_, i) => {
      const num = i + 1;
      const progress = listProgress[num];
      if (progress?.status === "completed") return { num, status: "completed" as ListStatus };
      if (progress?.status === "learning") return { num, status: "learning" as ListStatus };
      return { num, status: "pending" as ListStatus };
    }));
  }, [effectiveStartDate, listProgress]);

  if (!mounted) return <Loading />;

  const completed = lists.filter(l => l.status === "completed").length;
  const learning = lists.filter(l => l.status === "learning").length;
  const pending = TOTAL_LISTS - completed - learning;
  const progressPercent = Math.round((completed / TOTAL_LISTS) * 100);

  // 有已学单词的 List（用于判断 learning 状态是否显示复习按钮）
  const listsWithLearnedWords = new Set(
    Object.keys(wordProgress).map(id => {
      const match = id.match(/^(\d+)-/);
      return match ? parseInt(match[1]) : -1;
    }).filter(n => n > 0)
  );

  const filteredLists = activeTab === "all" ? lists : lists.filter(l => l.status === activeTab);

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
          <h1 style={titleStyle}>全部 List</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main style={mainStyle}>
        {/* 总进度卡片 */}
        <div style={progressCardStyle}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>学习进度</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>{progressPercent}%</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{completed}/{TOTAL_LISTS} List</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{completed * ESTIMATED_WORDS_PER_LIST} 词已学</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{ background: 'white', height: '100%', borderRadius: 8, width: `${progressPercent}%`, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>{completed}</span> 已完成
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{learning}</span> 进行中
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{pending}</span> 未开始
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div style={tabsContainerStyle}>
          {[
            { id: "all" as const, label: "全部", count: TOTAL_LISTS },
            { id: "learning" as const, label: "进行中", count: learning },
            { id: "completed" as const, label: "已完成", count: completed },
            { id: "pending" as const, label: "未开始", count: pending },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabStyle,
                background: activeTab === tab.id ? '#0ea5e9' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 10,
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                padding: '1px 6px',
                borderRadius: 10,
                marginLeft: 4,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* List 列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLists.map(list => {
            const isDone = list.status === "completed";
            const isLearning = list.status === "learning";
            const statusColor = isDone ? '#16a34a' : isLearning ? '#0ea5e9' : '#94a3b8';
            const statusBg = isDone ? '#f0fdf4' : isLearning ? '#eff6ff' : '#f8fafc';
            const statusText = isDone ? '已完成' : isLearning ? '学习中' : '未开始';

            return (
              <div key={list.num} style={listCardStyle}>
                <Link
                  href={isDone ? `/review/${list.num}` : `/learn/${list.num}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit', flex: 1 }}
                >
                  {/* 序号 */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: isDone ? 'linear-gradient(135deg, #4ade80, #16a34a)' : isLearning ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isDone ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: isLearning ? 'white' : '#64748b' }}>{list.num}</span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
                      List {list.num}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>
                      {ESTIMATED_WORDS_PER_LIST} 个单词
                    </p>
                  </div>

                  {/* 状态标签 */}
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: statusColor,
                    background: statusBg,
                    padding: '4px 10px',
                    borderRadius: 8,
                  }}>
                    {statusText}
                  </span>
                </Link>

                {/* 复习按钮 */}
                {(isDone || (isLearning && listsWithLearnedWords.has(list.num))) && (
                  <Link
                    href={`/review/${list.num}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 10,
                      background: '#fff7ed',
                      textDecoration: 'none',
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#f97316',
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    复习
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav active="lists" />
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

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  background: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
};

const headerStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};

const headerInnerStyle: React.CSSProperties = {
  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none', color: '#374151',
};

const titleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0,
};

const mainStyle: React.CSSProperties = {
  padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16,
};

const progressCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  borderRadius: 20, padding: '20px 20px',
  color: 'white', position: 'relative', overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(14, 165, 233, 0.25)',
};

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  background: 'white',
  borderRadius: 14,
  padding: 4,
  gap: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  borderRadius: 10,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
};

const listCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'white',
  borderRadius: 16,
  padding: '14px 16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  gap: 12,
};
