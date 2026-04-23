"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { RateLimiter } from "@/lib/security";
import { getAuthProviderStatus, getSessionUser, registerUser, type AuthProvider } from "@/lib/auth-client";
import styles from "../auth.module.css";

const REGISTER_LOCK_MS = 45_000;

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [authProvider, setAuthProvider] = useState<AuthProvider>("local");
  const [backendConfigured, setBackendConfigured] = useState(false);
  const limiterRef = useRef(new RateLimiter(4, 60_000));

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
    if (!limiterRef.current.isAllowed("register-route")) {
      setLockedUntil(now + REGISTER_LOCK_MS);
      setError("Too many registration attempts. Please wait and retry.");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await registerUser({ email, password, displayName });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const status = getAuthProviderStatus();
    setAuthProvider(status.provider);
    setBackendConfigured(status.backendConfigured);
    router.replace("/");
  }, [busy, displayName, email, lockedUntil, password, router]);

  return (
    <main className={styles.authMain}>
      <section className={styles.authCard}>
        <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Register now; this flow can switch to your real auth API later.</p>
        <span className={`${styles.modeBadge} ${authProvider === "backend" ? styles.modeBackend : styles.modeLocal}`}>
          {backendConfigured
            ? (authProvider === "backend" ? "AUTH: BACKEND" : "AUTH: LOCAL FALLBACK")
            : "AUTH: LOCAL ONLY"}
        </span>

        <form className={styles.form} onSubmit={onSubmit} autoComplete="on">
          <label className={styles.field}>
            <span className={styles.label}>Display Name</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
              required
              maxLength={32}
              minLength={2}
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              maxLength={120}
              minLength={8}
            />
          </label>
          <button className={styles.primaryBtn} type="submit" disabled={busy}>
            {busy ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <div className={styles.footerRow}>
          <Link className={styles.link} href="/login">Already have an account? Login</Link>
          <Link className={styles.link} href="/">Back to app</Link>
        </div>
      </section>
    </main>
  );
}
