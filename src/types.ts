// 单词列表总数
export const TOTAL_LISTS = 48;

// 每个列表预计单词数
export const ESTIMATED_WORDS_PER_LIST = 90;

// 每组学习单词数
export const WORDS_PER_GROUP = 10;

// 艾宾浩斯复习节点（天）
export const EBINGHAUS_NODES = [1, 2, 4, 7, 15, 30, 60] as const;

// 每天学习新列表数
const NEW_LISTS_PER_DAY = 2;

// 新列表学习天数
const NEW_LISTS_DAYS = Math.ceil(TOTAL_LISTS / NEW_LISTS_PER_DAY);

// 总学习天数（新列表 + 最长复习周期）
export const TOTAL_DAYS = NEW_LISTS_DAYS + EBINGHAUS_NODES[EBINGHAUS_NODES.length - 1];

// 计算结束日期
export function calculateEndDate(startDate: Date): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + TOTAL_DAYS - 1);
  return end;
}

// 获取某天的学习任务
export function getDayTask(
  date: Date,
  startDate: Date
): { newLists: number[]; reviewLists: number[]; totalWords: number; estimatedMinutes: number } {
  const diffTime = date.getTime() - startDate.getTime();
  const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (dayIndex < 0) {
    return { newLists: [], reviewLists: [], totalWords: 0, estimatedMinutes: 0 };
  }

  const newLists: number[] = [];

  // 当天新学的列表
  if (dayIndex < NEW_LISTS_DAYS) {
    const startList = dayIndex * NEW_LISTS_PER_DAY + 1;
    for (let i = 0; i < NEW_LISTS_PER_DAY; i++) {
      const listId = startList + i;
      if (listId <= TOTAL_LISTS) {
        newLists.push(listId);
      }
    }
  }

  // 当天需要复习的列表（根据艾宾浩斯节点）
  const reviewLists: number[] = [];
  for (const node of EBINGHAUS_NODES) {
    const learnDay = dayIndex - node;
    if (learnDay >= 0 && learnDay < NEW_LISTS_DAYS) {
      const startList = learnDay * NEW_LISTS_PER_DAY + 1;
      for (let i = 0; i < NEW_LISTS_PER_DAY; i++) {
        const listId = startList + i;
        if (listId <= TOTAL_LISTS) {
          reviewLists.push(listId);
        }
      }
    }
  }

  const totalWords = (newLists.length + reviewLists.length) * ESTIMATED_WORDS_PER_LIST;
  const estimatedMinutes = Math.round(totalWords / 18); // 约18词/分钟

  return { newLists, reviewLists, totalWords, estimatedMinutes };
}

// 获取距离结束还有多少天
export function getDaysUntilEnd(date: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - date.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// 获取学习阶段
export function getStudyPhase(date: Date, startDate: Date): "before" | "learning" | "review" | "done" {
  const diffTime = date.getTime() - startDate.getTime();
  const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (dayIndex < 0) return "before";
  if (dayIndex < NEW_LISTS_DAYS) return "learning";
  if (dayIndex < TOTAL_DAYS) return "review";
  return "done";
}

// 获取默认开始日期（今天）
export function getDefaultStartDate(): Date {
  return new Date();
}
