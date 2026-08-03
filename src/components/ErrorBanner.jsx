export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-chili/25 bg-chili-soft px-4 py-3 text-sm text-chili">{message}</div>
  );
}
