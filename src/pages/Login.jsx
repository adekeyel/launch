import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../services/auth";
import ErrorBanner from "../components/ErrorBanner";
import { useContent } from "../context/ContentContext";

export default function Login() {
  const { login } = useAuth();
  const { content, t } = useContent();
  const copy = content.auth.login;
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const reason = location.state?.reason;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      if (from) navigate(from, { replace: true });
      else if (user.role === "vendor") navigate("/vendor/dashboard");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      {copy.eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">{t(copy.eyebrow)}</p>}
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{t(copy.title)}</h1>
      {copy.subtitle && <p className="mt-2 text-sm text-ink/55">{t(copy.subtitle)}</p>}

      {reason && (
        <p className="mt-5 rounded-xl border border-marigold/30 bg-marigold-soft/50 px-4 py-3 text-sm text-ink/80">
          {reason}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <ErrorBanner message={error} />
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className="field-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={update("password")}
            className="field-input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        New here?{" "}
        <Link to="/register" state={location.state} className="font-semibold text-ink hover:text-marigold-dark">
          Create an account
        </Link>
      </p>
    </div>
  );
}
