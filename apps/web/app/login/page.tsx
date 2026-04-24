"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { RateLimiter } from "@/lib/security";
import { useAuth } from "@/components/AuthProvider";
import styles from "../auth.module.css";

const LOGIN_LOCK_MS = 30_000;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated, backendConfigured, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const limiterRef = useRef(new RateLimiter(5, 60_000));

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = searchParams.get("next");
      const destination = next && next.startsWith("/") ? next : "/";
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, searchParams, router]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy) return;

      const now = Date.now();
      if (lockedUntil > now) {
        setError(
          `Too many attempts. Try again in ${Math.ceil(
            (lockedUntil - now) / 1000
          )} seconds.`
        );
        return;
      }
      if (!limiterRef.current.isAllowed("login-route")) {
        setLockedUntil(now + LOGIN_LOCK_MS);
        setError("Too many login attempts. Please wait and retry.");
        return;
      }

      setBusy(true);
      setError(null);
      const result = await login({ email, password });
      setBusy(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const next = searchParams.get("next");
      const destination = next && next.startsWith("/") ? next : "/";
      router.replace(destination);
    },
    [busy, email, lockedUntil, password, login, searchParams, router]
  );

  // Show nothing while checking auth state to prevent flash
  if (isLoading) {
    return (
      <main className={styles.authMain}>
        <section className={styles.authCard}>
          <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
          <h1 className={styles.title}>Loading...</h1>
        </section>
      </main>
    );
  }

  // If already authenticated, the useEffect above will redirect.
  // Render a brief "Redirecting..." to avoid flash if redirect is async.
  if (isAuthenticated) {
    return (
      <main className={styles.authMain}>
        <section className={styles.authCard}>
          <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
          <h1 className={styles.title}>Redirecting...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.authMain}>
      <section className={styles.authCard}>
        <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to track your puzzle progress and streaks.</p>
        <span
          className={`${styles.modeBadge} ${
            backendConfigured ? styles.modeBackend : styles.modeLocal
          }`}
        >
          {backendConfigured ? "AUTH: BACKEND" : "AUTH: BACKEND UNCONFIGURED"}
        </span>

        <form className={styles.form} onSubmit={onSubmit} autoComplete="on">
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              maxLength={120}
              placeholder="trainer@example.com"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              maxLength={120}
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>
          <button className={styles.primaryBtn} type="submit" disabled={busy}>
            {busy ? "SIGNING IN..." : "SIGN IN"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <div className={styles.footerRow}>
          <Link className={styles.link} href="/register">
            Need an account? Register
          </Link>
          <Link className={styles.link} href="/">
            Back to app
          </Link>
        </div>
      </section>
    </main>
  );
}

