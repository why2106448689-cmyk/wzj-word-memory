import { create } from "zustand";
import { persist } from "zustand/middleware";

type ListStatus = "pending" | "learning" | "completed" | "all_reviewed";

interface WordProgress {
  wordId: string;
  familiarity: 0 | 1 | 2;
  lastReviewed: Date;
  nextReview: Date;
  reviewCount: number;
}

interface ListProgress {
  listId: number;
  status: "pending" | "learning" | "completed" | "all_reviewed";
  wordsLearned: number;
  wordsMastered: number;
}

interface UserStats {
  streakDays: number;
  lastStudyDate: string | null;
  totalMinutes: number;
  todayLearned: number;
  todayReviewed: number;
}

interface StudyStore {
  // 学习计划开始日期
  startDate: string | null;
  setStartDate: (date: string) => void;

  // 单词进度
  wordProgress: Record<string, WordProgress>;
  updateWordProgress: (wordId: string, data: Partial<WordProgress>) => void;

  // 单词笔记
  wordNotes: Record<string, string>;
  setWordNote: (word: string, note: string) => void;

  // List进度
  listProgress: Record<number, ListProgress>;
  updateListProgress: (listId: number, data: Partial<ListProgress>) => void;

  // 用户统计
  userStats: UserStats;
  updateUserStats: (data: Partial<UserStats>) => void;

  // 重置今日学习数据
  resetTodayStats: () => void;

  // 检查并重置今日统计（如果是新的一天）
  checkAndResetToday: () => void;

  // 重置所有学习进度
  resetAllProgress: () => void;

  // 设置指定List的进度
  setListProgress: (listId: number, status: ListStatus, wordCount?: number) => void;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      startDate: null,
      setStartDate: (date) => set({ startDate: date }),

      wordProgress: {},
      updateWordProgress: (wordId, data) =>
        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: {
              ...state.wordProgress[wordId],
              ...data,
            },
          },
        })),

      wordNotes: {},
      setWordNote: (word, note) =>
        set((state) => ({
          wordNotes: {
            ...state.wordNotes,
            [word.toLowerCase()]: note,
          },
        })),

      listProgress: {},
      updateListProgress: (listId, data) =>
        set((state) => ({
          listProgress: {
            ...state.listProgress,
            [listId]: {
              ...state.listProgress[listId],
              ...data,
            },
          },
        })),

      userStats: {
        streakDays: 0,
        lastStudyDate: null,
        totalMinutes: 0,
        todayLearned: 0,
        todayReviewed: 0,
      },
      updateUserStats: (data) =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            ...data,
          },
        })),

      resetTodayStats: () =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            todayLearned: 0,
            todayReviewed: 0,
          },
        })),

      checkAndResetToday: () => {
        const state = useStudyStore.getState();
        const lastStudyDate = state.userStats.lastStudyDate;
        const today = new Date().toDateString();

        // 如果从未学习过，不设置 streakDays
        if (!lastStudyDate) {
          return;
        }

        // 如果是新的一天，重置今日统计并增加连续学习天数
        if (lastStudyDate !== today) {
          useStudyStore.getState().resetTodayStats();
          useStudyStore.getState().updateUserStats({
            lastStudyDate: today,
            streakDays: state.userStats.streakDays + 1,
          });
        }
      },

      resetAllProgress: () =>
        set({
          startDate: null,
          wordProgress: {},
          wordNotes: {},
          listProgress: {},
          userStats: {
            streakDays: 0,
            lastStudyDate: null,
            totalMinutes: 0,
            todayLearned: 0,
            todayReviewed: 0,
          },
        }),

      setListProgress: (listId, status, wordCount) =>
        set((state) => ({
          listProgress: {
            ...state.listProgress,
            [listId]: {
              listId,
              status,
              wordsLearned: status === "completed" ? (wordCount ?? 0) : 0,
              wordsMastered: status === "completed" ? (wordCount ?? 0) : 0,
            },
          },
        })),
    }),
    {
      name: "wzj-study-storage",
    }
  )
);
