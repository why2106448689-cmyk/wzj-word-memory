import { create } from "zustand";
import { persist } from "zustand/middleware";

type ListStatus = "pending" | "learning" | "completed" | "all_reviewed";

interface WordProgress {
  wordId: string;
  familiarity: 0 | 1 | 2;
  lastReviewed: Date;
  nextReview: Date;
  reviewCount: number;
  easeFactor?: number;
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

  // 今日已复习的List追踪
  todayReviewedLists: { date: string; lists: number[] };
  markListReviewedToday: (listId: number) => void;
  getTodayReviewedLists: () => number[];
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
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
        const state = get();
        const lastStudyDate = state.userStats.lastStudyDate;
        const today = new Date().toDateString();

        // 如果从未学习过，不处理
        if (!lastStudyDate) {
          return;
        }

        // 如果是同一天，不需要处理
        if (lastStudyDate === today) {
          return;
        }

        // 判断昨天是否学习过（连续天数是否应该+1）
        const lastDate = new Date(lastStudyDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // 昨天学习了，连续天数+1，重置今日统计
          state.resetTodayStats();
          state.updateUserStats({
            streakDays: state.userStats.streakDays + 1,
            lastStudyDate: today,
          });
        } else if (diffDays > 1) {
          // 断了一天以上，连续天数归零，重置今日统计
          state.resetTodayStats();
          state.updateUserStats({
            streakDays: 0,
            lastStudyDate: today,
          });
        }
      },

      resetAllProgress: () =>
        set({
          startDate: null,
          wordProgress: {},
          wordNotes: {},
          listProgress: {},
          todayReviewedLists: { date: new Date().toDateString(), lists: [] },
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

      todayReviewedLists: { date: new Date().toDateString(), lists: [] },
      markListReviewedToday: (listId) =>
        set((state) => {
          const today = new Date().toDateString();
          const current = state.todayReviewedLists;
          // 如果日期变了，重置
          if (current.date !== today) {
            return { todayReviewedLists: { date: today, lists: [listId] } };
          }
          // 如果已经在列表中，不重复添加
          if (current.lists.includes(listId)) {
            return {};
          }
          return { todayReviewedLists: { date: today, lists: [...current.lists, listId] } };
        }),
      getTodayReviewedLists: () => {
        const state = get();
        const today = new Date().toDateString();
        if (state.todayReviewedLists.date !== today) {
          return [];
        }
        return state.todayReviewedLists.lists;
      },
    }),
    {
      name: "wzj-study-storage",
    }
  )
);
