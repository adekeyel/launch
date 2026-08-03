import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-ink/40">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">This table isn't set</h1>
      <p className="mt-2 text-sm text-ink/55">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-accent mt-6">
        Back to home
      </Link>
    </div>
  );
}
