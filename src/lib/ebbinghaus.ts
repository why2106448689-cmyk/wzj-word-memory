import { EBINGHAUS_NODES } from "@/types";

// 艾宾浩斯复习节点（天）
const REVIEW_NODES = [1, 2, 4, 7, 15, 30, 60];

// 默认遗忘因子
const DEFAULT_EASE_FACTOR = 2.5;

// 计算下一次复习日期
export function calculateNextReviewDate(
  lastReviewDate: Date,
  nodeIndex: number,
  _easeFactor: number = DEFAULT_EASE_FACTOR
): Date {
  const daysToAdd = REVIEW_NODES[nodeIndex];
  const nextDate = new Date(lastReviewDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
}

// 获取艾宾浩斯复习节点
export function getEbbinghausNodes(): readonly number[] {
  return REVIEW_NODES;
}

// 根据熟悉度更新遗忘因子
export function updateEaseFactor(
  currentEaseFactor: number,
  familiarity: number
): number {
  // 简化版：熟悉度高增加因子（减少复习频率），熟悉度低降低因子（增加复习频率）
  const delta = familiarity === 0 ? -0.2 : familiarity === 1 ? 0 : 0.1;
  return Math.max(1.3, Math.min(2.5, currentEaseFactor + delta));
}

// 判断是否需要进行艾宾浩斯复习
export function shouldReview(nextReviewDate: Date | null): boolean {
  if (!nextReviewDate) return true;
  return new Date() >= nextReviewDate;
}

// 获取下一次复习的节点索引
export function getNextReviewNodeIndex(reviewCount: number): number {
  return Math.min(reviewCount, REVIEW_NODES.length - 1);
}

// 格式化复习时间（相对时间）
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "已到期";
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "明天";
  if (diffDays < 7) return `${diffDays}天后`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周后`;
  return `${Math.floor(diffDays / 30)}个月后`;
}

// 生成复习提醒消息
export function generateReviewMessage(word: string, nextReviewDate: Date): string {
  return `单词 "${word}" 将在 ${formatRelativeTime(nextReviewDate)} 复习`;
}
