"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { TOTAL_LISTS, TOTAL_DAYS, calculateEndDate } from "@/types";
import wordsData from "@/data/toefl_words.json";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const { userStats, wordProgress, listProgress, startDate } = useStudyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 计算实际学习数据
  const totalWords = (wordsData as { listNumber: number }[]).length;
  const learnedWords = Object.keys(wordProgress).length;
  const masteredWords = Object.values(wordProgress).filter((w) => w.familiarity === 2).length;
  const completedLists = Object.values(listProgress).filter((l) => l.status === "completed").length;

  const stats = {
    totalWords,
    learnedWords,
    masteredWords,
    reviewWords: learnedWords - masteredWords,
    todayLearned: userStats.todayLearned || 0,
    todayReviewed: userStats.todayReviewed || 0,
    streakDays: userStats.streakDays || 0,
    totalMinutes: userStats.totalMinutes || 0,
  };

  if (!mounted) return <Loading />;

  const completionRate = stats.totalWords > 0 ? Math.round((stats.learnedWords / stats.totalWords) * 100) : 0;
  const masteryRate = stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0;

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
          <h1 style={titleStyle}>学习统计</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main style={mainStyle}>
        {/* 计划信息 */}
        {startDate && (
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>📅 学习计划</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px' }}>
                <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 500 }}>开始日期</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                  {format(new Date(startDate), "MM月dd日", { locale: zhCN })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#eff6ff', borderRadius: '12px' }}>
                <span style={{ fontSize: 14, color: '#2563eb', fontWeight: 500 }}>结束日期</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>
                  {format(calculateEndDate(new Date(startDate)), "MM月dd日", { locale: zhCN })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fefce8', borderRadius: '12px' }}>
                <span style={{ fontSize: 14, color: '#ca8a04', fontWeight: 500 }}>当前进度</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#ca8a04' }}>
                  第 {Math.max(1, differenceInDays(new Date(), new Date(startDate)) + 1)} 天 / {TOTAL_DAYS} 天
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 今日进度 */}
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
          borderRadius: 24, padding: '24px 20px', color: 'white',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(14, 165, 233, 0.25)',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16, fontWeight: 500 }}>今日进度</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>{stats.todayLearned}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>新学单词</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>{stats.todayReviewed}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>复习单词</p>
              </div>
            </div>
          </div>
        </div>

        {/* 总体进度 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>总体进度</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={labelStyle}>学习进度</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0ea5e9' }}>{completionRate}%</span>
            </div>
            <div style={progressBg}>
              <div style={{ ...progressFill, background: 'linear-gradient(90deg, #38bdf8, #2563eb)', width: `${completionRate}%` }} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={labelStyle}>掌握进度</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{masteryRate}%</span>
            </div>
            <div style={progressBg}>
              <div style={{ ...progressFill, background: 'linear-gradient(90deg, #4ade80, #16a34a)', width: `${masteryRate}%` }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
            {[
              { value: stats.totalWords, label: '总词数', color: '#0f172a' },
              { value: stats.masteredWords, label: '已掌握', color: '#16a34a' },
              { value: stats.reviewWords, label: '待复习', color: '#ea580c' },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ fontSize: 24, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 学习数据 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>学习数据</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { value: stats.streakDays, label: '连续学习', bg: '#eff6ff', color: '#2563eb' },
              { value: stats.totalMinutes, label: '学习分钟', bg: '#faf5ff', color: '#7c3aed' },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 14, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* List 进度 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>List 进度</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: TOTAL_LISTS }).map((_, i) => {
              const listId = i + 1;
              const progress = listProgress[listId];
              const isDone = progress?.status === "completed";
              const isCurrent = progress?.status === "learning";
              const wordsInList = (wordsData as { listNumber: number }[]).filter((w) => w.listNumber === listId).length;
              const learnedInList = Object.values(wordProgress).filter((w) => w.wordId.startsWith(`${listId}-`)).length;
              const progressPercent = wordsInList > 0 ? (learnedInList / wordsInList) * 100 : 0;

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 28, textAlign: 'right' }}>L{listId}</span>
                  <div style={progressBg}>
                    <div style={{
                      ...progressFill,
                      background: isDone ? 'linear-gradient(90deg, #4ade80, #16a34a)' : isCurrent ? 'linear-gradient(90deg, #38bdf8, #2563eb)' : '#e2e8f0',
                      width: isDone ? '100%' : `${progressPercent}%`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
            {completedLists > 0 ? `已完成 ${completedLists} / ${TOTAL_LISTS} 个 List` : '学习尚未开始'}
          </p>
        </div>
      </main>

      <BottomNav active="stats" />
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
        {items.map(item => {
          const isActive = item.key === active;
          return (
            <Link key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 16px', textDecoration: 'none', color: isActive ? '#0ea5e9' : '#94a3b8', minWidth: 64 }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span style={{ fontSize: 10, marginTop: 3, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  background: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 16px',
};
const labelStyle: React.CSSProperties = {
  fontSize: 13, color: '#64748b',
};
const progressBg: React.CSSProperties = {
  flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden',
};
const progressFill: React.CSSProperties = {
  height: '100%', borderRadius: 4, transition: 'width 0.5s ease',
};
