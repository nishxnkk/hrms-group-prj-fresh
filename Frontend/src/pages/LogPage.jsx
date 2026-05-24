import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";

export default function LogPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;

    if (!username.trim()) {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }

    if (password.trim().length < 8) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    if (isValid) {
      try {
        const { login } = await import("../services/auth.service.js");
        await login(username.trim(), password.trim());
        navigate("/dashboard");
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <main className="login-page relative min-h-screen w-full bg-[var(--rn-bg)] text-[var(--rn-ink)] dark:bg-[#211313] dark:text-[#fff7f1]">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-[var(--rn-border)] bg-white/90 text-[var(--rn-primary-dark)] shadow-sm transition hover:bg-[var(--rn-soft)] dark:border-white/10 dark:bg-white/10 dark:text-[#fff7f1]"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className="login-shell mx-auto grid min-h-screen w-full max-w-6xl grid-cols-[0.92fr_1.08fr] items-center gap-12 px-6 py-10 md:px-10">
        <div className="login-panel">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--rn-primary)]">
            RedNote PayRoll System
          </p>
          <h1 className="mb-4 max-w-md text-4xl font-bold leading-tight text-[var(--rn-primary-dark)] dark:text-[#fff7f1]">
            Manage payroll and people operations with clarity.
          </h1>
          <p className="max-w-md text-base leading-7 text-[var(--rn-muted)] dark:text-[#ffd6cc]">
            A focused workspace for employees, hiring, recognition, and payroll records.
          </p>
        </div>

        <div className="login-card w-full rounded-lg border border-[var(--rn-border)] bg-white p-8 shadow-xl shadow-red-950/10 dark:border-white/10 dark:bg-[#2a1717] md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--rn-ink)] dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-[var(--rn-muted)] dark:text-[#ffd6cc]">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-[var(--rn-ink)] dark:text-[#fff7f1]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--rn-border)] bg-white px-4 py-3 text-sm text-[var(--rn-ink)] outline-none transition focus:border-[var(--rn-primary)] focus:ring-4 focus:ring-[var(--rn-focus)] dark:border-white/10 dark:bg-[#211313] dark:text-white"
                autoComplete="username"
                placeholder="Enter username"
              />
              {usernameError && <p className="text-red-500 text-xs mt-1">Username is required.</p>}

              <label className="text-sm font-semibold text-[var(--rn-ink)] dark:text-[#fff7f1]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[var(--rn-border)] bg-white px-4 py-3 pr-12 text-sm text-[var(--rn-ink)] outline-none transition focus:border-[var(--rn-primary)] focus:ring-4 focus:ring-[var(--rn-focus)] dark:border-white/10 dark:bg-[#211313] dark:text-white"
                  autoComplete="current-password"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--rn-muted)] transition hover:bg-[var(--rn-soft)] hover:text-[var(--rn-primary)] dark:text-[#ffd6cc] dark:hover:bg-white/10"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters long.</p>}

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-[var(--rn-muted)] dark:text-[#ffd6cc]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[var(--rn-border)] accent-[var(--rn-primary)]" />
                  Remember me
                </label>
                <a href="/" className="font-medium text-[var(--rn-primary)] hover:underline">Forgot password?</a>
              </div>

              <button type="submit" className="mt-2 w-full rounded-lg bg-[var(--rn-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--rn-primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--rn-focus)]">
                Sign in
              </button>

              <div className="pt-2 text-center text-sm text-[var(--rn-muted)] dark:text-[#ffd6cc]">
                Don't have an account?{" "}
                <Link to="/Signup" className="font-semibold text-[var(--rn-primary)]">Create account</Link>
              </div>
            </form>
        </div>
      </section>
    </main>
  );
}
