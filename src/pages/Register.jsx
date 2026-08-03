import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../services/auth";
import ErrorBanner from "../components/ErrorBanner";

const initialForm = {
  fullname: "",
  email: "",
  password: "",
  phone: "",
  role: "customer",
  businessName: "",
  address: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      if (user.role === "vendor") {
        navigate("/vendor/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Get started</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Create your account</h1>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-ink/15 bg-white p-1">
        {[
          { value: "customer", label: "I'm ordering food" },
          { value: "vendor", label: "I'm a vendor" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
            className={`h-10 rounded-full text-sm font-semibold transition ${
              form.role === opt.value ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorBanner message={error} />
        <div>
          <label className="field-label" htmlFor="fullname">
            Full name
          </label>
          <input
            id="fullname"
            required
            value={form.fullname}
            onChange={update("fullname")}
            className="field-input"
            placeholder="Ada Obi"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="field-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={update("phone")}
            className="field-input"
            placeholder="080…"
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
            minLength={8}
            value={form.password}
            onChange={update("password")}
            className="field-input"
            placeholder="At least 8 characters, 1 number"
          />
        </div>

        {form.role === "vendor" && (
          <div className="space-y-4 rounded-xl border border-marigold/30 bg-marigold-soft/40 p-4">
            <p className="text-xs font-semibold text-marigold-dark">Tell us about your kitchen</p>
            <div>
              <label className="field-label" htmlFor="businessName">
                Business name
              </label>
              <input
                id="businessName"
                required
                value={form.businessName}
                onChange={update("businessName")}
                className="field-input"
                placeholder="Ada's Kitchen"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                value={form.address}
                onChange={update("address")}
                className="field-input"
                placeholder="12 Allen Avenue, Ikeja"
              />
            </div>
            <p className="text-xs text-ink/50">
              New vendor accounts start pending review. You can add your menu right away, but customers will only
              see it once an admin verifies your kitchen.
            </p>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-ink hover:text-marigold-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
