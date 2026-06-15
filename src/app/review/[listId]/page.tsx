import ReviewClient from "./ReviewClient";

export function generateStaticParams() {
  return Array.from({ length: 48 }, (_, i) => ({ listId: String(i + 1) }));
}

export default function ReviewPage() {
  return <ReviewClient />;
}
