import LearnClient from "./LearnClient";

export function generateStaticParams() {
  return Array.from({ length: 48 }, (_, i) => ({ listId: String(i + 1) }));
}

export default function LearnPage() {
  return <LearnClient />;
}
