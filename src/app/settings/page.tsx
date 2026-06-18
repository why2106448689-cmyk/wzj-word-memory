"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudyStore } from "@/lib/store";
import { calculateEndDate, getDefaultStartDate, TOTAL_LISTS, TOTAL_DAYS } from "@/types";
import wordsData from "@/data/toefl_words.json";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function SettingsPage() {
  const router = useRouter();
  const { startDate, setStartDate, resetAllProgress, setListProgress, listProgress } = useStudyStore();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCustomProgress, setShowCustomProgress] = useState(false);
  const [customListId, setCustomListId] = useState<number>(1);
  const [customStatus, setCustomStatus] = useState<"pending" | "learning" | "completed">("pending");

  useEffect(() => {
    setMounted(true);
    // 如果已有开始日期，使用它；否则使用默认日期
    if (startDate) {
      setSelectedDate(startDate);
    } else {
      setSelectedDate(format(getDefaultStartDate(), "yyyy-MM-dd"));
    }
  }, [startDate]);

  const handleSave = () => {
    if (selectedDate) {
      setStartDate(selectedDate);
      router.push("/");
    }
  };

  const handleResetProgress = () => {
    resetAllProgress();
    setShowResetConfirm(false);
    // 强制刷新页面以确保所有状态重置
    router.push("/");
    window.location.reload();
  };

  const handleSetCustomProgress = () => {
    const wordCount = (wordsData as { listNumber: number }[]).filter(w => w.listNumber === customListId).length;
    setListProgress(customListId, customStatus, wordCount);
    setShowCustomProgress(false);
  };

  if (!mounted) return <Loading />;

  const start = selectedDate ? new Date(selectedDate) : getDefaultStartDate();
  const end = calculateEndDate(start);

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
          <h1 style={titleStyle}>学习计划设置</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main style={mainStyle}>
        {/* 开始日期选择 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>📅 开始日期</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            选择你开始背单词的日期，系统会自动计算完整的学习计划
          </p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f8fafc',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0ea5e9';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          />
        </div>

        {/* 计划预览 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>📋 计划预览</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px' }}>
              <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 500 }}>开始日期</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                {format(start, "MM月dd日 EEEE", { locale: zhCN })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#eff6ff', borderRadius: '12px' }}>
              <span style={{ fontSize: 14, color: '#2563eb', fontWeight: 500 }}>结束日期</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>
                {format(end, "MM月dd日 EEEE", { locale: zhCN })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fefce8', borderRadius: '12px' }}>
              <span style={{ fontSize: 14, color: '#ca8a04', fontWeight: 500 }}>总天数</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#ca8a04' }}>{TOTAL_DAYS} 天</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#faf5ff', borderRadius: '12px' }}>
              <span style={{ fontSize: 14, color: '#9333ea', fontWeight: 500 }}>总词数</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#9333ea' }}>{(wordsData as unknown[]).length} 词</span>
            </div>
          </div>
        </div>

        {/* 学习安排说明 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>📖 学习安排</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>1</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>每天新学 2 个 List</p>
                <p style={{ fontSize: 13, color: '#64748b' }}>约 180 个单词，用时 45-60 分钟</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>2</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>艾宾浩斯复习</p>
                <p style={{ fontSize: 13, color: '#64748b' }}>第 1、2、4、7、15、30 天复习</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>3</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>24 天完成新学</p>
                <p style={{ fontSize: 13, color: '#64748b' }}>之后进入纯复习阶段</p>
              </div>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {startDate ? '更新计划' : '开始学习'}
        </button>

        {/* 学习进度管理 */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>⚙️ 学习进度管理</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setShowCustomProgress(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#f0fdf4',
                color: '#16a34a',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 600,
                border: '1px solid #bbf7d0',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              自定义学习进度
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 600,
                border: '1px solid #fecaca',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              重置所有进度
            </button>
          </div>
        </div>

        {/* 自定义进度弹窗 */}
        {showCustomProgress && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>自定义学习进度</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>List 编号</label>
                  <select
                    value={customListId}
                    onChange={(e) => setCustomListId(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '2px solid #e2e8f0', fontSize: 16, background: '#f8fafc',
                    }}
                  >
                    {Array.from({ length: TOTAL_LISTS }, (_, i) => i + 1).map(id => (
                      <option key={id} value={id}>List {id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>状态</label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value as any)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '2px solid #e2e8f0', fontSize: 16, background: '#f8fafc',
                    }}
                  >
                    <option value="pending">未开始</option>
                    <option value="learning">学习中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => setShowCustomProgress(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                    background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSetCustomProgress}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                    background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', border: 'none', cursor: 'pointer',
                  }}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 重置确认弹窗 */}
        {showResetConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>确认重置？</h3>
                <p style={{ fontSize: 14, color: '#64748b' }}>这将清除所有学习进度，包括：</p>
                <ul style={{ fontSize: 13, color: '#94a3b8', textAlign: 'left', marginTop: 12, paddingLeft: 20 }}>
                  <li>所有单词的学习状态</li>
                  <li>所有 List 的完成状态</li>
                  <li>连续学习天数</li>
                  <li>学习统计数据</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                    background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleResetProgress}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', cursor: 'pointer',
                  }}
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
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

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
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

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px',
};
