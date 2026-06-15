"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { speakWord, speakSentenceFast, stopSpeaking, isSpeechSupported } from "@/lib/speech";
import { translateToChinese } from "@/lib/translate";
import wordsData from "@/data/toefl_words.json";

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  root: string;
  mnemonic: string;
  example: string;
  listNumber: number;
}

type Familiarity = 0 | 1 | 2;
type Phase = "learn" | "quick-review" | "total-review" | "complete";

const GROUP_SIZE = 10; // 每组10个单词（约5分钟）
const TIMER_MINUTES = 5; // 5分钟倒计时
const TOTAL_REVIEW_MINUTES = 30; // 每30分钟进行一次总复习

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LearnPage() {
  const params = useParams();
  const listId = parseInt(params.listId as string);

  const { updateWordProgress, updateListProgress, updateUserStats, userStats, wordNotes, setWordNote } = useStudyStore();

  const [words, setWords] = useState<Word[]>([]);
  const [phase, setPhase] = useState<Phase>("learn");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);

  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(TIMER_MINUTES * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 当前5分钟session内学过的单词（用于快速复习）
  const [sessionStartIndex, setSessionStartIndex] = useState(0);
  const [sessionReviewWords, setSessionReviewWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);
  // 计时器到期时用户正在学一个单词（已显示答案但未评分），等待用户评分后再进入快速复习
  const [isTimerPending, setIsTimerPending] = useState(false);

  // 30分钟总复习计时器
  const [thirtyMinTimeLeft, setThirtyMinTimeLeft] = useState(TOTAL_REVIEW_MINUTES * 60);
  const [isThirtyMinTimerRunning, setIsThirtyMinTimerRunning] = useState(false);
  const thirtyMinTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 30分钟内学过的单词
  const [thirtyMinLearnedWords, setThirtyMinLearnedWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);
  // 30分钟计时到期时正在快速复习，等快速复习结束后再进入总复习
  const [isTotalReviewPending, setIsTotalReviewPending] = useState(false);

  // 总复习相关
  const [totalReviewWords, setTotalReviewWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);
  const [totalReviewIndex, setTotalReviewIndex] = useState(0);
  const [totalReviewShowAnswer, setTotalReviewShowAnswer] = useState(false);

  // 复习相关
  const [reviewWords, setReviewWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [quickReviewRevealed, setQuickReviewRevealed] = useState(false);

  // 统计
  const [startTime] = useState(Date.now());

  // 例句翻译
  const [exampleTranslation, setExampleTranslation] = useState("");

  // 笔记
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    const listWords = (wordsData as Word[]).filter(w => w.listNumber === listId);
    setWords(listWords);
  }, [listId]);

  // 计算当前组的单词
  const currentGroupStart = groupIndex * GROUP_SIZE;
  const currentGroupEnd = Math.min(currentGroupStart + GROUP_SIZE, words.length);
  const currentGroupWords = words.slice(currentGroupStart, currentGroupEnd);
  const currentWord = currentGroupWords[currentIndex];
  const totalGroups = Math.ceil(words.length / GROUP_SIZE);

  // 当单词变化时，翻译例句
  useEffect(() => {
    if (currentWord?.example) {
      setExampleTranslation("");
      translateToChinese(currentWord.example).then(setExampleTranslation);
    } else {
      setExampleTranslation("");
    }
  }, [currentWord?.word]);

  // 当单词变化时，加载笔记
  useEffect(() => {
    if (currentWord?.word) {
      setNoteText(wordNotes[currentWord.word.toLowerCase()] || "");
      setShowNoteInput(false);
    }
  }, [currentWord?.word, wordNotes]);

  // 倒计时
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 时间到，停止计时
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // 计时器到期时，如果用户正在学一个单词（已翻面但未评分），等待评分后再进入快速复习
  useEffect(() => {
    if (!isTimerRunning && timeLeft === 0 && phase === "learn") {
      if (isRevealed) {
        // 用户正在看答案，标记为等待评分状态
        setIsTimerPending(true);
      } else {
        // 用户不在学某个单词（在两次单词之间），直接进入快速复习
        setPhase("quick-review");
        setReviewIndex(0);
      }
    }
  }, [isTimerRunning, timeLeft, phase, isRevealed]);

  // 30分钟总复习倒计时
  useEffect(() => {
    if (isThirtyMinTimerRunning && thirtyMinTimeLeft > 0) {
      thirtyMinTimerRef.current = setInterval(() => {
        setThirtyMinTimeLeft(prev => {
          if (prev <= 1) {
            setIsThirtyMinTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (thirtyMinTimerRef.current) clearInterval(thirtyMinTimerRef.current);
    };
  }, [isThirtyMinTimerRunning, thirtyMinTimeLeft]);

  // 30分钟计时到期处理
  useEffect(() => {
    if (!isThirtyMinTimerRunning && thirtyMinTimeLeft === 0 && !isTotalReviewPending) {
      if (phase === "learn") {
        // 正在学习：如果5分钟计时还在运行，停止它
        if (isTimerRunning) {
          setIsTimerRunning(false);
        }
        // 如果用户正在学一个单词（已翻面未评分），等评分后再处理
        if (isRevealed) {
          setIsTimerPending(true);
          setIsTotalReviewPending(true);
        } else {
          // 直接进入快速复习，快速复习结束后会自动进入总复习（因为isTotalReviewPending=true）
          if (sessionReviewWords.length > 0) {
            setPhase("quick-review");
            setReviewIndex(0);
            setIsTotalReviewPending(true);
          } else {
            // 没有学过单词，直接进入总复习
            if (thirtyMinLearnedWords.length > 0) {
              setTotalReviewWords(shuffleArray(thirtyMinLearnedWords));
              setTotalReviewIndex(0);
              setTotalReviewShowAnswer(false);
              setPhase("total-review");
            }
          }
        }
      } else if (phase === "quick-review") {
        // 正在快速复习：标记为等待，快速复习结束后进入总复习
        setIsTotalReviewPending(true);
      }
      // 如果 phase 是 "total-review" 或 "complete"，不需要处理
    }
  }, [isThirtyMinTimerRunning, thirtyMinTimeLeft, phase, isRevealed, sessionReviewWords.length, thirtyMinLearnedWords.length, isTotalReviewPending]);

  // 开始计时
  const startTimer = () => {
    setTimeLeft(TIMER_MINUTES * 60);
    setIsTimerRunning(true);
    setIsTimerPending(false);
    // 如果30分钟计时器未运行，启动它
    if (!isThirtyMinTimerRunning && thirtyMinTimeLeft > 0) {
      setIsThirtyMinTimerRunning(true);
    }
    // 标记List为学习中
    updateListProgress(listId, {
      listId,
      status: "learning",
      wordsLearned: 0,
      wordsMastered: 0,
    });
  };

  // 计时器开始运行时，初始化session状态
  useEffect(() => {
    if (isTimerRunning) {
      setSessionStartIndex(currentIndex);
      setSessionReviewWords([]);
    }
  }, [isTimerRunning]);

  // 快速复习中切换单词时重置揭示状态
  useEffect(() => {
    setQuickReviewRevealed(false);
  }, [reviewIndex]);

  // 一组学完（当前组所有单词都学完了）
  const handleGroupComplete = useCallback(() => {
    setIsTimerRunning(false);
    // sessionReviewWords 已经在 handleFamiliarity 中逐步积累了
    setPhase("quick-review");
    setReviewIndex(0);
  }, []);

  // 处理熟悉度选择
  const handleFamiliarity = useCallback((familiarity: Familiarity) => {
    if (!currentWord) return;

    // 保存到复习列表
    setReviewWords(prev => [...prev, { word: currentWord, familiarity }]);
    // 保存到当前session复习列表
    setSessionReviewWords(prev => [...prev, { word: currentWord, familiarity }]);
    // 保存到30分钟复习列表
    setThirtyMinLearnedWords(prev => [...prev, { word: currentWord, familiarity }]);

    // 保存进度
    const wordId = `${listId}-${currentGroupStart + currentIndex}`;
    updateWordProgress(wordId, {
      wordId,
      familiarity,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reviewCount: 1,
    });

    // 使用函数式更新确保获取最新值
    const currentStats = useStudyStore.getState().userStats;
    useStudyStore.getState().updateUserStats({
      todayLearned: (currentStats.todayLearned || 0) + 1,
      lastStudyDate: new Date().toDateString(),
      // 如果是第一次学习，设置 streakDays 为 1
      streakDays: currentStats.lastStudyDate ? currentStats.streakDays : 1,
    });

    // 如果计时器已到期且正在等待评分，评分后进入快速复习
    if (isTimerPending) {
      setIsTimerPending(false);
      setPhase("quick-review");
      setReviewIndex(0);
      return;
    }

    if (currentIndex < currentGroupWords.length - 1) {
      // 继续当前组
      setShowAnswer(false);
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      // 当前组完成
      handleGroupComplete();
    }
  }, [currentIndex, currentWord, currentGroupWords.length, listId, currentGroupStart, updateWordProgress, handleGroupComplete, isTimerPending]);

  // 快速复习完成
  const handleQuickReviewComplete = useCallback(() => {
    setReviewWords([]);
    setSessionReviewWords([]);

    // 如果30分钟计时到期，等待快速复习结束后进入总复习
    if (isTotalReviewPending) {
      setIsTotalReviewPending(false);
      if (thirtyMinLearnedWords.length > 0) {
        setTotalReviewWords(shuffleArray(thirtyMinLearnedWords));
        setTotalReviewIndex(0);
        setTotalReviewShowAnswer(false);
        setPhase("total-review");
      } else {
        // 没有学过单词，回到学习
        setPhase("learn");
        setTimeLeft(TIMER_MINUTES * 60);
        setIsTimerRunning(false);
      }
      return;
    }

    // 判断当前组是否已全部学完（currentIndex 已指向下一个待学单词，如果超出组范围则组已完成）
    const groupFullyCompleted = currentIndex >= currentGroupWords.length;

    if (groupFullyCompleted) {
      // 当前组全部学完，进入下一组
      if (groupIndex < totalGroups - 1) {
        // 继续下一组
        setGroupIndex(prev => prev + 1);
        setCurrentIndex(0);
        setPhase("learn");
        setTimeLeft(TIMER_MINUTES * 60);
        setIsTimerRunning(false);
      } else {
        // 所有组完成，如果有30分钟内的学习记录，进入总复习
        if (thirtyMinLearnedWords.length > 0) {
          setIsThirtyMinTimerRunning(false);
          setTotalReviewWords(shuffleArray(thirtyMinLearnedWords));
          setTotalReviewIndex(0);
          setTotalReviewShowAnswer(false);
          setPhase("total-review");
        } else {
          setPhase("complete");
        }
      }
    } else {
      // 当前组未全部学完，从 currentIndex 继续（不 +1，因为 handleFamiliarity 已经推进了）
      setPhase("learn");
      setTimeLeft(TIMER_MINUTES * 60);
      setIsTimerRunning(false);
    }
  }, [groupIndex, totalGroups, currentIndex, currentGroupWords.length, isTotalReviewPending, thirtyMinLearnedWords.length]);

  // 总复习完成
  const handleTotalReviewComplete = useCallback(() => {
    // 重置30分钟计时器
    setThirtyMinTimeLeft(TOTAL_REVIEW_MINUTES * 60);
    setIsThirtyMinTimerRunning(false);
    setThirtyMinLearnedWords([]);
    setTotalReviewWords([]);
    setTotalReviewIndex(0);
    setTotalReviewShowAnswer(false);
    setIsTotalReviewPending(false);

    // 回到学习阶段
    setPhase("learn");
    setTimeLeft(TIMER_MINUTES * 60);
    setIsTimerRunning(false);
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!isRevealed && phase === "learn") {
          setShowAnswer(true);
          setIsRevealed(true);
        }
      } else if (e.key === "1" && isRevealed) {
        handleFamiliarity(0);
      } else if (e.key === "2" && isRevealed) {
        handleFamiliarity(1);
      } else if (e.key === "3" && isRevealed) {
        handleFamiliarity(2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, phase, handleFamiliarity]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const progress = phase === "learn"
    ? ((currentGroupStart + currentIndex) / words.length) * 100
    : phase === "quick-review"
    ? ((currentGroupStart + Math.max(currentIndex, sessionStartIndex)) / words.length) * 100
    : 100;

  // ===== 学习完成 =====
  if (phase === "complete") {
    const totalMinutes = Math.floor((Date.now() - startTime) / 60000);
    return (
      <div style={completePageStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>List {listId} 完成！</h1>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 8 }}>用时 {totalMinutes} 分钟</p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>全部学习完成</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            <Link href="/" style={primaryBtnStyle}>返回首页</Link>
            <Link href={`/review/${listId}`} style={secondaryBtnStyle}>再次复习</Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== 总复习 =====
  if (phase === "total-review") {
    const tw = totalReviewWords[totalReviewIndex];
    return (
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <Link href="/" style={backBtnStyle}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#7c3aed' }}>📖 总复习</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{totalReviewIndex + 1}/{totalReviewWords.length}</span>
          </div>
          <div style={{ height: 6, background: '#f1f5f9' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', borderRadius: 3, width: `${((totalReviewIndex + 1) / totalReviewWords.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </header>
        <main
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
          onClick={() => {
            if (!totalReviewShowAnswer) setTotalReviewShowAnswer(true);
          }}
        >
          {tw && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
              <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{tw.word.word}</h1>
              {totalReviewShowAnswer && (
                <div>
                  {tw.word.phonetic && <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{tw.word.phonetic}</p>}
                  <p style={{ fontSize: 22, color: '#334155', lineHeight: 1.6 }}>{tw.word.meaning}</p>
                </div>
              )}
              {!totalReviewShowAnswer && (
                <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕显示答案</p>
              )}
            </div>
          )}
        </main>
        {totalReviewShowAnswer && (
          <div style={bottomBtnContainer}>
            <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
              <button onClick={() => {
                if (totalReviewIndex < totalReviewWords.length - 1) {
                  setTotalReviewIndex(prev => prev + 1);
                  setTotalReviewShowAnswer(false);
                } else {
                  handleTotalReviewComplete();
                }
              }} style={{ ...actionBtnStyle, background: '#fef2f2', color: '#dc2626' }}>
                <span style={{ fontSize: 20, marginBottom: 4 }}>😣</span>
                还是不会
              </button>
              <button onClick={() => {
                if (totalReviewIndex < totalReviewWords.length - 1) {
                  setTotalReviewIndex(prev => prev + 1);
                  setTotalReviewShowAnswer(false);
                } else {
                  handleTotalReviewComplete();
                }
              }} style={{ ...actionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
                <span style={{ fontSize: 20, marginBottom: 4 }}>😊</span>
                记住了
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== 快速复习 =====
  if (phase === "quick-review") {
    const reviewWord = sessionReviewWords[reviewIndex];
    return (
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <Link href="/" style={backBtnStyle}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f97316' }}>⚡ 快速复习</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{reviewIndex + 1}/{sessionReviewWords.length}</span>
          </div>
        </header>
        <main
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
          onClick={() => {
            if (!quickReviewRevealed) {
              setQuickReviewRevealed(true);
              if (reviewWord) speakWord(reviewWord.word.word);
            }
          }}
        >
          {reviewWord && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
              <h1 style={{ fontSize: 56, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>{reviewWord.word.word}</h1>

              {/* 释义区域：未揭示时用蓝条覆盖 */}
              <div style={{ position: 'relative', minHeight: 80, marginBottom: 32 }}>
                {!quickReviewRevealed ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                  }}>
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>点击查看释义</span>
                  </div>
                ) : (
                  <div>
                    {reviewWord.word.phonetic && (
                      <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 10 }}>{reviewWord.word.phonetic}</p>
                    )}
                    <p style={{ fontSize: 22, color: '#334155', lineHeight: 1.6 }}>{reviewWord.word.meaning}</p>
                  </div>
                )}
              </div>

              {/* 按钮区域：揭示后才显示 */}
              {quickReviewRevealed && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    if (reviewIndex < sessionReviewWords.length - 1) {
                      setReviewIndex(prev => prev + 1);
                    } else {
                      handleQuickReviewComplete();
                    }
                  }} style={{ ...smallBtnStyle, background: '#fef2f2', color: '#dc2626' }}>
                    还是不会
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    if (reviewIndex < sessionReviewWords.length - 1) {
                      setReviewIndex(prev => prev + 1);
                    } else {
                      handleQuickReviewComplete();
                    }
                  }} style={{ ...smallBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
                    记住了
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ===== 学习模式 =====
  if (!currentWord) return <div style={pageStyle}><div style={loadingStyle} /></div>;

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* 顶部 */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href="/" style={backBtnStyle}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>第 {groupIndex + 1}/{totalGroups} 组</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : '#0f172a' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>总复习</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: isThirtyMinTimerRunning ? '#7c3aed' : '#cbd5e1' }}>
              {formatTime(thirtyMinTimeLeft)}
            </div>
          </div>
        </div>
        <div style={{ height: 6, background: '#f1f5f9' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #2563eb)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </header>

      {/* 倒计时提示 */}
      {!isTimerRunning && timeLeft === TIMER_MINUTES * 60 && (
        <div style={{ padding: '0 16px' }}>
          <button onClick={startTimer} style={{
            width: '100%', padding: 16, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            color: 'white', borderRadius: 16, fontSize: 16, fontWeight: 600,
            border: 'none', cursor: 'pointer', marginBottom: 16,
          }}>
            ▶️ 开始 5 分钟学习
          </button>
        </div>
      )}

      {/* 单词卡片 */}
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
        onClick={() => {
          if (!isRevealed) {
            setShowAnswer(true);
            setIsRevealed(true);
            if (!isTimerRunning && timeLeft === TIMER_MINUTES * 60) startTimer();
          }
        }}
      >
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
            {currentWord.word}
          </h1>

          {/* 语音播放按钮 */}
          <button
              onClick={(e) => {
                e.stopPropagation();
                speakWord(currentWord.word);
              }}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="播放发音"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </button>

          {showAnswer && (
            <div>
              {currentWord.phonetic && <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{currentWord.phonetic}</p>}
              <p style={{ fontSize: 22, color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>{currentWord.meaning}</p>
              {currentWord.example && (
                <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakSentenceFast(currentWord.example);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          flexShrink: 0,
                          fontSize: 11,
                        }}
                        title="播放例句发音"
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                        朗读
                      </button>
                    <p style={{ fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>{currentWord.example}</p>
                  </div>
                  {exampleTranslation ? (
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                      {exampleTranslation}
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>翻译加载中...</p>
                  )}
                </div>
              )}

              {/* 笔记区域 */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                {noteText && !showNoteInput ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNoteInput(true);
                    }}
                    style={{
                      background: '#fefce8',
                      border: '1px solid #fde68a',
                      borderRadius: 12,
                      padding: '10px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontSize: 13, color: '#92400e', textAlign: 'left' }}>
                      📝 {noteText}
                    </p>
                  </div>
                ) : showNoteInput ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="添加笔记..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: '2px solid #e2e8f0',
                        fontSize: 14,
                        outline: 'none',
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (currentWord?.word) {
                          setWordNote(currentWord.word, noteText);
                          setShowNoteInput(false);
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        background: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNoteInput(true);
                    }}
                    style={{
                      background: 'none',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 12,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      fontSize: 13,
                    }}
                  >
                    + 添加笔记
                  </button>
                )}
              </div>
            </div>
          )}

          {!isRevealed && (
            <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕或按空格显示答案</p>
          )}
        </div>
      </main>

      {/* 底部按钮 */}
      {isRevealed && (
        <div style={bottomBtnContainer}>
          <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <button onClick={() => handleFamiliarity(0)} style={{ ...actionBtnStyle, background: '#fef2f2', color: '#dc2626' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>😣</span>
              不认识
            </button>
            <button onClick={() => handleFamiliarity(1)} style={{ ...actionBtnStyle, background: '#fffbeb', color: '#d97706' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>🤔</span>
              模糊
            </button>
            <button onClick={() => handleFamiliarity(2)} style={{ ...actionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>😊</span>
              认识
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
};
const completePageStyle: React.CSSProperties = {
  ...pageStyle, alignItems: 'center', justifyContent: 'center', padding: 24,
};
const headerStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};
const headerInnerStyle: React.CSSProperties = {
  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const backBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151',
};
const mainStyle: React.CSSProperties = {
  flex: 1, padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16,
};
const primaryBtnStyle: React.CSSProperties = {
  display: 'block', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  color: 'white', borderRadius: 16, padding: 16, textAlign: 'center',
  textDecoration: 'none', fontWeight: 600, fontSize: 16,
};
const secondaryBtnStyle: React.CSSProperties = {
  display: 'block', background: '#f1f5f9',
  color: '#334155', borderRadius: 16, padding: 16, textAlign: 'center',
  textDecoration: 'none', fontWeight: 600, fontSize: 16,
};
const smallBtnStyle: React.CSSProperties = {
  padding: '12px 24px', borderRadius: 14, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
};
const actionBtnStyle: React.CSSProperties = {
  flex: 1, padding: '14px 8px', borderRadius: 16, fontSize: 15, fontWeight: 600,
  border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const bottomBtnContainer: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
  background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
};
const loadingStyle: React.CSSProperties = {
  width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#0ea5e9',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: 'auto',
};
