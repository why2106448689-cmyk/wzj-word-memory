"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudyStore } from "@/lib/store";
import {
  getDayTask,
  getDaysUntilEnd,
  getStudyPhase,
  calculateEndDate,
  TOTAL_LISTS,
} from "@/types";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function HomePage() {
  const router = useRouter();
  const { startDate, listProgress } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [todayTasks, setTodayTasks] = useState({
    newLists: [] as number[],
    reviewLists: [] as number[],
    totalWords: 0,
    estimatedMinutes: 0,
  });

  // 如果没有设置开始日期，默认使用今天
  const effectiveStartDate = startDate || format(new Date(), "yyyy-MM-dd");

  // 检查是否有任何List已经开始学习（不是pending状态）
  const hasStartedLearning = Object.values(listProgress).some(
    (lp) => lp.status !== "pending"
  );

  useEffect(() => {
    setMounted(true);
    const start = new Date(effectiveStartDate);
    setTodayTasks(getDayTask(new Date(), start));
  }, [effectiveStartDate]);

  if (!mounted) return <Loading />;

  const today = new Date();
  const studyStartDate = new Date(effectiveStartDate);
  const studyEndDate = calculateEndDate(studyStartDate);
  const daysSinceStart = differenceInDays(today, studyStartDate);
  // 只有真正开始学习了才算天数
  const isStarted = daysSinceStart >= 0 && hasStartedLearning;
  const currentDay = isStarted ? daysSinceStart + 1 : 0;
  const daysUntilStart = isStarted ? 0 : Math.abs(daysSinceStart);
  const daysLeft = getDaysUntilEnd(today, studyEndDate);
  const progressPercent = isStarted ? Math.min(100, Math.round((currentDay / 54) * 100)) : 0;

  // 计算今天要学的List（如果还没到开始日期，默认显示 L1, L2）
  const todayNewLists = todayTasks.newLists.length > 0 ? todayTasks.newLists : isStarted ? [] : [1, 2];
  const todayReviewLists = todayTasks.reviewLists;
  const hasNewTask = todayNewLists.length > 0;
  const hasReviewTask = todayReviewLists.length > 0;

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
              wzj单词记忆
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              {format(today, "MM月dd日 EEEE", { locale: zhCN })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/settings" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 12,
              background: '#f1f5f9', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                {startDate ? '调整计划' : '设置计划'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        {/* 倒计时 / 进度卡片 */}
        {!isStarted ? (
          <div style={countdownCardStyle}>
            <div style={{ position: 'absolute', top: -60, right: -30, width: 160, height: 160, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 500 }}>距离开始还有</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>{daysUntilStart}</span>
                <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>天</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>计划周期</p>
                <p style={{ fontSize: 16, fontWeight: 600 }}>{format(studyStartDate, "MM月dd日")} — {format(studyEndDate, "MM月dd日")}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>共 {TOTAL_LISTS} 个 List · 每天新学 2 个</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={progressCardStyle}>
            <div style={{ position: 'absolute', top: -50, right: -20, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>今日任务</p>
                  <p style={{ fontSize: 24, fontWeight: 700 }}>第 {currentDay} 天</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>剩余</p>
                  <p style={{ fontSize: 24, fontWeight: 700 }}>{daysLeft} 天</p>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                <div style={{ background: 'white', height: '100%', borderRadius: 8, width: `${progressPercent}%`, transition: 'width 0.5s' }} />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 6 }}>{progressPercent}% 完成</p>
            </div>
          </div>
        )}

        {/* 今日任务详情 - 先复习再新学 */}
        {(hasNewTask || hasReviewTask) && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>📋 今日任务</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 复习任务 - 放在前面 */}
              {hasReviewTask && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: '#fff7ed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#ea580c'
                    }}>1</div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>复习</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{todayReviewLists.length} 个 List</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {todayReviewLists.slice(0, 4).map(l => (
                      <span key={l} style={{ padding: '6px 14px', background: '#fff7ed', color: '#ea580c', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>L{l}</span>
                    ))}
                    {todayReviewLists.length > 4 && <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>+{todayReviewLists.length - 4}</span>}
                  </div>
                </div>
              )}
              {/* 新学任务 - 放在后面 */}
              {hasNewTask && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#16a34a'
                    }}>2</div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>新学</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{todayNewLists.length} 个 List</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {todayNewLists.map(l => (
                      <span key={l} style={{ padding: '6px 16px', background: '#f0fdf4', color: '#16a34a', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>L{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 学习流程提示 */}
        {(hasReviewTask || hasNewTask) && (
          <div style={{
            ...cardStyle,
            background: '#fefce8',
            border: '1px solid #fde68a',
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
              💡 今日学习流程：先复习旧词 → 再学新词
            </p>
          </div>
        )}

        {/* 开始学习按钮 - 先复习再新学！ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 复习按钮 - 优先显示 */}
          {hasReviewTask && (
            <Link href={`/review/${todayReviewLists[0]}`} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              borderRadius: 20,
              textDecoration: 'none',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              先复习 L{todayReviewLists[0]}{todayReviewLists.length > 1 ? ` 等 ${todayReviewLists.length} 个 List` : ""}
            </Link>
          )}

          {/* 新学按钮 */}
          {hasNewTask && (
            <Link href={`/learn/${todayNewLists[0]}`} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: 20,
              textDecoration: 'none',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
              opacity: hasReviewTask ? 0.7 : 1,
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              再学新词 L{todayNewLists[0]}{todayNewLists[1] ? ` · L${todayNewLists[1]}` : ""}
            </Link>
          )}

          {/* 如果没有任务，显示预习入口 */}
          {!hasNewTask && !hasReviewTask && (
            <Link href="/learn/1" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              borderRadius: 20,
              textDecoration: 'none',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              开始预习 L1 · L2
            </Link>
          )}
        </div>

        {/* 快捷入口 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Link href="/lists?mode=review" style={quickLinkStyle}>
            <div style={{ ...quickIconStyle, background: '#fff7ed' }}>🔄</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>复习单词</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>选择 List 复习</span>
          </Link>
          <Link href="/vocabulary" style={quickLinkStyle}>
            <div style={{ ...quickIconStyle, background: '#fef3c7' }}>📖</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>全部词汇</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>浏览词书</span>
          </Link>
          <Link href="/schedule" style={quickLinkStyle}>
            <div style={{ ...quickIconStyle, background: '#eff6ff' }}>📅</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>学习计划</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>艾宾浩斯</span>
          </Link>
          <Link href="/lists" style={quickLinkStyle}>
            <div style={{ ...quickIconStyle, background: '#faf5ff' }}>📚</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>全部 List</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{TOTAL_LISTS} 个词表</span>
          </Link>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { value: isStarted ? currentDay : 0, label: '学习天数', color: '#0f172a' },
            { value: daysLeft, label: '剩余天数', color: '#0f172a' },
            { value: `${progressPercent}%`, label: '完成率', color: '#0ea5e9' },
          ].map((item, i) => (
            <div key={i} style={{ ...cardStyle, textAlign: 'center', padding: '16px 12px' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>{item.value}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </main>

      <BottomNav active="home" />
    </div>
  );
}

function Loading() {
  return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
    <nav style={navStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {items.map(item => (
          <Link key={item.key} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 16px', textDecoration: 'none',
            color: item.key === active ? '#0ea5e9' : '#94a3b8', minWidth: 64,
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.key === active ? 2.2 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span style={{ fontSize: 10, marginTop: 3, fontWeight: item.key === active ? 600 : 400 }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Styles
const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
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
  padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 14, background: '#f1f5f9',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
};
const mainStyle: React.CSSProperties = {
  padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16,
};
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
};
const countdownCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
  borderRadius: 24, padding: '28px 24px', color: 'white',
  position: 'relative', overflow: 'hidden',
  boxShadow: '0 12px 40px rgba(14, 165, 233, 0.3)',
};
const progressCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  borderRadius: 24, padding: '24px 20px', color: 'white',
  position: 'relative', overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(14, 165, 233, 0.25)',
};
const quickLinkStyle: React.CSSProperties = {
  ...cardStyle,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '20px 16px', textDecoration: 'none',
};
const quickIconStyle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, marginBottom: 12,
};
const navStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(0,0,0,0.06)',
  paddingBottom: 'env(safe-area-inset-bottom, 8px)',
};
