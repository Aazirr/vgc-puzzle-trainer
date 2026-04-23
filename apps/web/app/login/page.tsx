"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { RateLimiter } from "@/lib/security";
import { getAuthProviderStatus, getSessionUser, loginUser, type AuthProvider } from "@/lib/auth-client";
import styles from "../auth.module.css";

const LOGIN_LOCK_MS = 30_000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [authProvider, setAuthProvider] = useState<AuthProvider>("local");
  const [backendConfigured, setBackendConfigured] = useState(false);
  const limiterRef = useRef(new RateLimiter(5, 60_000));

  useEffect(() => {
    const existing = getSessionUser();
    if (existing) {
      router.replace("/");
    }
    const status = getAuthProviderStatus();
    setAuthProvider(status.provider);
    setBackendConfigured(status.backendConfigured);
  }, [router]);

  const onSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const now = Date.now();
    if (lockedUntil > now) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)} seconds.`);
      return;
    }
    if (!limiterRef.current.isAllowed("login-route")) {
      setLockedUntil(now + LOGIN_LOCK_MS);
      setError("Too many login attempts. Please wait and retry.");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await loginUser({ email, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    const next = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next")
      : null;
    const nextPath = next && next.startsWith("/") ? next : "/";
    const status = getAuthProviderStatus();
    setAuthProvider(status.provider);
    setBackendConfigured(status.backendConfigured);
    router.replace(nextPath);
  }, [busy, email, lockedUntil, password, router]);

  return (
    <main className={styles.authMain}>
      <section className={styles.authCard}>
        <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your puzzle sessions and sound settings.</p>
        <span className={`${styles.modeBadge} ${authProvider === "backend" ? styles.modeBackend : styles.modeLocal}`}>
          {backendConfigured
            ? (authProvider === "backend" ? "AUTH: BACKEND" : "AUTH: LOCAL FALLBACK")
            : "AUTH: LOCAL ONLY"}
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
            />
          </label>
          <button className={styles.primaryBtn} type="submit" disabled={busy}>
            {busy ? "SIGNING IN..." : "SIGN IN"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <div className={styles.footerRow}>
          <Link className={styles.link} href="/register">Need an account? Register</Link>
          <Link className={styles.link} href="/">Back to app</Link>
        </div>
      </section>
    </main>
  );
}
