"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import wordsData from "@/data/toefl_words.json";
import { speakWord, isSpeechSupported } from "@/lib/speech";
import { useStudyStore } from "@/lib/store";

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  root: string;
  mnemonic: string;
  example: string;
  listNumber: number;
}

export default function VocabularyPage() {
  const { wordNotes } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const wordsPerPage = 50;

  useEffect(() => { setMounted(true); }, []);

  const allWords = wordsData as Word[];

  // 获取所有 List 编号
  const listNumbers = useMemo(() => {
    const lists = [...new Set(allWords.map(w => w.listNumber))].sort((a, b) => a - b);
    return lists;
  }, [allWords]);

  // 过滤单词
  const filteredWords = useMemo(() => {
    let filtered = allWords;

    // 按 List 过滤
    if (selectedList !== null) {
      filtered = filtered.filter(w => w.listNumber === selectedList);
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(query) ||
        w.meaning.toLowerCase().includes(query) ||
        w.phonetic.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allWords, selectedList, searchQuery]);

  // 分页
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * wordsPerPage,
    currentPage * wordsPerPage
  );

  // 重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedList]);

  if (!mounted) return <Loading />;

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
          <h1 style={titleStyle}>全部词汇</h1>
          <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{filteredWords.length} 词</span>
        </div>
      </header>

      <main style={mainStyle}>
        {/* 搜索框 */}
        <div style={searchContainerStyle}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="搜索单词或释义..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={clearBtnStyle}
            >
              ✕
            </button>
          )}
        </div>

        {/* List 筛选 */}
        <div style={filterContainerStyle}>
          <button
            onClick={() => setSelectedList(null)}
            style={{
              ...filterBtnStyle,
              background: selectedList === null ? '#0ea5e9' : '#f1f5f9',
              color: selectedList === null ? 'white' : '#64748b',
            }}
          >
            全部
          </button>
          {listNumbers.slice(0, 10).map(listNum => (
            <button
              key={listNum}
              onClick={() => setSelectedList(selectedList === listNum ? null : listNum)}
              style={{
                ...filterBtnStyle,
                background: selectedList === listNum ? '#0ea5e9' : '#f1f5f9',
                color: selectedList === listNum ? 'white' : '#64748b',
              }}
            >
              L{listNum}
            </button>
          ))}
          {listNumbers.length > 10 && (
            <span style={{ fontSize: 13, color: '#94a3b8', padding: '8px 4px' }}>...</span>
          )}
        </div>

        {/* 单词列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginatedWords.map((word, index) => (
            <div
              key={`${word.word}-${index}`}
              style={wordCardStyle}
              onClick={() => setExpandedWord(expandedWord === word.word ? null : word.word)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{word.word}</span>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(word.word);
                        }}
                        style={speakBtnStyle}
                        title="播放发音"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                      </button>
                  </div>
                  {word.phonetic && (
                    <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 2, display: 'block' }}>{word.phonetic}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: 8 }}>
                  L{word.listNumber}
                </span>
              </div>

              {/* 释义（默认显示） */}
              <p style={{ fontSize: 14, color: '#334155', marginTop: 8, lineHeight: 1.5 }}>
                {word.meaning}
              </p>

              {/* 展开的详细信息 */}
              {expandedWord === word.word && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                  {word.root && (
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>词根：</span>{word.root}
                    </p>
                  )}
                  {word.mnemonic && (
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>助记：</span>{word.mnemonic}
                    </p>
                  )}
                  {wordNotes[word.word.toLowerCase()] && (
                    <div style={{ background: '#fefce8', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <p style={{ fontSize: 13, color: '#92400e' }}>
                        📝 {wordNotes[word.word.toLowerCase()]}
                      </p>
                    </div>
                  )}
                  {word.example && (
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>例句：</p>
                      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, fontStyle: 'italic' }}>
                        {word.example}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                ...paginationBtnStyle,
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              上一页
            </button>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                ...paginationBtnStyle,
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              下一页
            </button>
          </div>
        )}

        {/* 空状态 */}
        {filteredWords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16, color: '#64748b' }}>没有找到匹配的单词</p>
          </div>
        )}
      </main>

      <BottomNav active="vocabulary" />
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

const searchContainerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'white', borderRadius: 16, padding: '12px 16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none', fontSize: 16,
  background: 'transparent', color: '#0f172a',
};

const clearBtnStyle: React.CSSProperties = {
  background: '#f1f5f9', border: 'none', borderRadius: '50%',
  width: 24, height: 24, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: '#64748b',
};

const filterContainerStyle: React.CSSProperties = {
  display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
  WebkitOverflowScrolling: 'touch',
};

const filterBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
  transition: 'all 0.2s',
};

const wordCardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  cursor: 'pointer', transition: 'all 0.2s',
};

const speakBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  border: 'none', borderRadius: '50%', width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'white', flexShrink: 0,
};

const paginationStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
  padding: '16px 0',
};

const paginationBtnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
  background: 'white', color: '#0ea5e9', border: '1px solid #e2e8f0',
  cursor: 'pointer', transition: 'all 0.2s',
};
