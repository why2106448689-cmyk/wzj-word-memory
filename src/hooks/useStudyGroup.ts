"use client";

import { useState, useCallback, useEffect } from "react";
import { WORDS_PER_GROUP } from "@/types";

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  root: string;
  mnemonic: string;
  example: string;
}

export interface StudyGroupState {
  words: Word[];
  currentIndex: number;
  groupIndex: number;
  totalGroups: number;
  isRevealed: boolean;
  isGroupComplete: boolean;
  isListComplete: boolean;
  progress: number;
  phase: "new" | "review" | "total" | "evening";
}

export function useStudyGroup(initialWords: Word[]) {
  const [state, setState] = useState<StudyGroupState>({
    words: initialWords,
    currentIndex: 0,
    groupIndex: 0,
    totalGroups: Math.ceil(initialWords.length / WORDS_PER_GROUP),
    isRevealed: false,
    isGroupComplete: false,
    isListComplete: false,
    progress: 0,
    phase: "new",
  });

  const currentWord = state.words[state.currentIndex];
  const totalWords = state.words.length;

  // 重置显示状态
  const reveal = useCallback(() => {
    setState((prev) => ({ ...prev, isRevealed: true }));
  }, []);

  // 处理熟悉度选择
  const handleFamiliarity = useCallback(
    (familiarity: 0 | 1 | 2) => {
      // 记录学习数据
      console.log(
        `单词: ${currentWord.word}, 熟悉度: ${familiarity}, 阶段: ${state.phase}`
      );

      setState((prev) => {
        // 计算下一个单词索引
        const nextIndex = prev.currentIndex + 1;
        const progress = (nextIndex / totalWords) * 100;

        // 检查是否完成一组
        const isGroupEnd = nextIndex % WORDS_PER_GROUP === 0;
        const isListEnd = nextIndex >= totalWords;

        return {
          ...prev,
          currentIndex: nextIndex,
          isRevealed: false,
          progress,
          isGroupComplete: isGroupEnd && !isListEnd,
          isListComplete: isListEnd,
          groupIndex: isGroupEnd ? prev.groupIndex + 1 : prev.groupIndex,
        };
      });
    },
    [currentWord, state.phase, totalWords]
  );

  // 处理组复习完成
  const handleGroupComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGroupComplete: false,
      phase: "review",
    }));
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!state.isRevealed) {
          e.preventDefault();
          reveal();
        }
      } else if (e.key === "1" && state.isRevealed) {
        handleFamiliarity(0);
      } else if (e.key === "2" && state.isRevealed) {
        handleFamiliarity(1);
      } else if (e.key === "3" && state.isRevealed) {
        handleFamiliarity(2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isRevealed, reveal, handleFamiliarity]);

  return {
    ...state,
    currentWord,
    totalWords,
    reveal,
    handleFamiliarity,
    handleGroupComplete,
  };
}
