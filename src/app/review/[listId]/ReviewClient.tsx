"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { speakWord, isSpeechSupported } from "@/lib/speech";
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
type ReviewMode = "meaning" | "word" | "spelling" | "mixed";

const MODES = [
  { id: "meaning" as ReviewMode, name: "看词想义", icon: "📖" },
  { id: "word" as ReviewMode, name: "看义想词", icon: "💡" },
  { id: "spelling" as ReviewMode, name: "拼写", icon: "✍️" },
  { id: "mixed" as ReviewMode, name: "混合", icon: "🎲" },
];

function getRandomMode(): Exclude<ReviewMode, "mixed"> {
  const modes: Exclude<ReviewMode, "mixed">[] = ["meaning", "word", "spelling"];
  return modes[Math.floor(Math.random() * modes.length)];
}

export default function ReviewPage() {
  const params = useParams();
  const listId = parseInt(params.listId as string);

  const { updateWordProgress, updateUserStats, wordNotes } = useStudyStore();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  // 当前模式（混合模式下每个单词随机）
  const [currentMode, setCurrentMode] = useState<ReviewMode>("mixed");
  const [activeMode, setActiveMode] = useState<Exclude<ReviewMode, "mixed">>("meaning");

  // 拼写模式
  const [spellingInput, setSpellingInput] = useState("");
  const [spellingResult, setSpellingResult] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listWords = (wordsData as Word[]).filter(w => w.listNumber === listId);
    setWords(listWords);
  }, [listId]);

  const currentWord = words[currentIndex];
  const totalWords = words.length;

  // 切换模式时，如果是混合模式则随机选一个，并重置状态
  useEffect(() => {
    if (currentMode === "mixed") {
      setActiveMode(getRandomMode());
    } else {
      setActiveMode(currentMode);
    }
    // 切换模式或单词时重置状态
    setShowAnswer(false);
    setIsRevealed(false);
    setSpellingInput("");
    setSpellingResult(null);
  }, [currentMode, currentIndex]);

  // 拼写模式自动聚焦
  useEffect(() => {
    if (activeMode === "spelling" && !isRevealed && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeMode, currentIndex, isRevealed]);

  const handleFamiliarity = useCallback((familiarity: Familiarity) => {
    if (!currentWord) return;

    const wordId = `${listId}-${currentIndex}`;
    updateWordProgress(wordId, {
      wordId,
      familiarity,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reviewCount: 2,
    });

    const currentStats = useStudyStore.getState().userStats;
    useStudyStore.getState().updateUserStats({
      todayReviewed: (currentStats.todayReviewed || 0) + 1,
      totalMinutes: Math.floor((Date.now() - startTime) / 60000),
      lastStudyDate: new Date().toDateString(),
      streakDays: currentStats.lastStudyDate ? currentStats.streakDays : 1,
    });

    goToNext();
  }, [currentIndex, currentWord, words.length, listId, updateWordProgress, startTime]);

  const goToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setShowAnswer(false);
      setIsRevealed(false);
      setSpellingInput("");
      setSpellingResult(null);
      setCurrentIndex(prev => prev + 1);
      setProgress(((currentIndex + 1) / words.length) * 100);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, words.length]);

  const checkSpelling = useCallback(() => {
    if (!currentWord) return;
    const isCorrect = spellingInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    setSpellingResult(isCorrect ? "correct" : "wrong");
    setShowAnswer(true);
    setIsRevealed(true);
  }, [spellingInput, currentWord]);

  // 键盘事件（仅看词想义模式）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== "meaning") return;

      if (e.key === " " || e.key === "Enter") {
        if (!isRevealed) {
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
  }, [isRevealed, handleFamiliarity, activeMode]);

  // 模式切换按钮
  const ModeSelector = () => (
    <div style={{
      display: 'flex',
      background: '#f1f5f9',
      borderRadius: 14,
      padding: 4,
      margin: '0 16px 4px',
      gap: 2,
    }}>
      {MODES.map(mode => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => setCurrentMode(mode.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 10,
              border: 'none',
              background: isActive ? 'white' : 'transparent',
              color: isActive ? '#0f172a' : '#94a3b8',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 14 }}>{mode.icon}</span>
            <span>{mode.name}</span>
          </button>
        );
      })}
    </div>
  );

  if (words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>复习完成！</h1>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>太棒了！你已完成 List {listId} 的全部复习</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setShowAnswer(false);
                setIsRevealed(false);
                setIsComplete(false);
                setProgress(0);
                setSpellingInput("");
                setSpellingResult(null);
              }}
              style={{
                display: 'block', background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white', borderRadius: 16, padding: 16, textAlign: 'center',
                textDecoration: 'none', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer',
              }}
            >
              再复习一遍
            </button>
            <Link href="/" style={{
              display: 'block', background: '#f1f5f9',
              color: '#334155', borderRadius: 16, padding: 16, textAlign: 'center',
              textDecoration: 'none', fontWeight: 600, fontSize: 16,
            }}>返回首页</Link>
          </div>
        </div>
      </div>
    );
  }

  // 拼写模式
  if (activeMode === "spelling") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{currentIndex + 1} / {totalWords}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#8b5cf6' }}>✍️ 拼写</span>
          </div>
          <ModeSelector />
          <div style={{ height: 6, background: '#f1f5f9' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 12 }}>请拼写以下单词：</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{currentWord.meaning}</p>
            {wordNotes[currentWord.word.toLowerCase()] && (
              <p style={{ fontSize: 13, color: '#92400e', background: '#fefce8', padding: '6px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 16 }}>
                📝 {wordNotes[currentWord.word.toLowerCase()]}
              </p>
            )}

            {/* 字母个数提示 */}
            {!isRevealed && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                {currentWord.word.split('').map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 20,
                      height: 3,
                      background: spellingInput.length > i ? '#8b5cf6' : '#e2e8f0',
                      borderRadius: 2,
                      transition: 'background 0.15s',
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <input
                ref={inputRef}
                type="text"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRevealed) {
                    checkSpelling();
                  }
                }}
                placeholder="输入单词..."
                disabled={isRevealed}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: `2px solid ${spellingResult === "correct" ? '#22c55e' : spellingResult === "wrong" ? '#ef4444' : '#e2e8f0'}`,
                  fontSize: 20,
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  background: spellingResult === "correct" ? '#f0fdf4' : spellingResult === "wrong" ? '#fef2f2' : 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {!isRevealed && (
              <button
                onClick={checkSpelling}
                style={{
                  padding: '14px 32px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                检查
              </button>
            )}

            {isRevealed && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 48, fontWeight: 800, color: spellingResult === "correct" ? '#16a34a' : '#dc2626', marginBottom: 8 }}>
                  {currentWord.word}
                </p>
                {spellingResult === "correct" ? (
                  <p style={{ fontSize: 16, color: '#16a34a', fontWeight: 600 }}>✅ 正确！</p>
                ) : (
                  <p style={{ fontSize: 16, color: '#dc2626', fontWeight: 600 }}>❌ 正确拼写：{currentWord.word}</p>
                )}
                {currentWord.phonetic && (
                  <p style={{ fontSize: 16, color: '#94a3b8', marginTop: 8 }}>{currentWord.phonetic}</p>
                )}
              </div>
            )}
          </div>
        </main>

        {isRevealed && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
          }}>
            <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
              <button onClick={() => handleFamiliarity(0)} style={{
                flex: 1, padding: 16, background: '#fef2f2', color: '#dc2626',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>不认识</button>
              <button onClick={() => handleFamiliarity(1)} style={{
                flex: 1, padding: 16, background: '#fffbeb', color: '#d97706',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>模糊</button>
              <button onClick={() => handleFamiliarity(2)} style={{
                flex: 1, padding: 16, background: '#f0fdf4', color: '#16a34a',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>认识</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 看义想词模式
  if (activeMode === "word") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{currentIndex + 1} / {totalWords}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0ea5e9' }}>💡 看义想词</span>
          </div>
          <ModeSelector />
          <div style={{ height: 6, background: '#f1f5f9' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </header>

        <main
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
          onClick={() => {
            if (!isRevealed) {
              setShowAnswer(true);
              setIsRevealed(true);
            }
          }}
        >
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 16 }}>这个单词是什么？</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{currentWord.meaning}</p>
            {wordNotes[currentWord.word.toLowerCase()] && (
              <p style={{ fontSize: 13, color: '#92400e', background: '#fefce8', padding: '6px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 16 }}>
                📝 {wordNotes[currentWord.word.toLowerCase()]}
              </p>
            )}

            {showAnswer && (
              <div style={{ marginTop: 24 }}>
                <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{currentWord.word}</h1>
                {currentWord.phonetic && (
                  <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{currentWord.phonetic}</p>
                )}
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
                    margin: '0 auto',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </button>
              </div>
            )}

            {!isRevealed && (
              <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕显示答案</p>
            )}
          </div>
        </main>

        {isRevealed && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
          }}>
            <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
              <button onClick={() => handleFamiliarity(0)} style={{
                flex: 1, padding: 16, background: '#fef2f2', color: '#dc2626',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>不认识</button>
              <button onClick={() => handleFamiliarity(1)} style={{
                flex: 1, padding: 16, background: '#fffbeb', color: '#d97706',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>模糊</button>
              <button onClick={() => handleFamiliarity(2)} style={{
                flex: 1, padding: 16, background: '#f0fdf4', color: '#16a34a',
                borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>认识</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 看词想义模式（默认）
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{currentIndex + 1} / {totalWords}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f97316' }}>📖 看词想义</span>
        </div>
        <ModeSelector />
        <div style={{ height: 6, background: '#f1f5f9' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #fb923c, #ea580c)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </header>

      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
        onClick={() => {
          if (!isRevealed) {
            setShowAnswer(true);
            setIsRevealed(true);
          }
        }}
      >
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
            {currentWord.word}
          </h1>

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
            }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </button>

          {showAnswer && (
            <div>
              {currentWord.phonetic && (
                <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{currentWord.phonetic}</p>
              )}
              <p style={{ fontSize: 20, color: '#334155', lineHeight: 1.6 }}>
                {currentWord.meaning}
              </p>
              {wordNotes[currentWord.word.toLowerCase()] && (
                <p style={{ fontSize: 13, color: '#92400e', background: '#fefce8', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>
                  📝 {wordNotes[currentWord.word.toLowerCase()]}
                </p>
              )}
            </div>
          )}

          {!isRevealed && (
            <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕或按空格显示答案</p>
          )}
        </div>
      </main>

      {isRevealed && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
        }}>
          <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <button onClick={() => handleFamiliarity(0)} style={{
              flex: 1, padding: 16, background: '#fef2f2', color: '#dc2626',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>不认识</button>
            <button onClick={() => handleFamiliarity(1)} style={{
              flex: 1, padding: 16, background: '#fffbeb', color: '#d97706',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>模糊</button>
            <button onClick={() => handleFamiliarity(2)} style={{
              flex: 1, padding: 16, background: '#f0fdf4', color: '#16a34a',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>认识</button>
          </div>
        </div>
      )}
    </div>
  );
}
