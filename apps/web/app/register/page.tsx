"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { RateLimiter } from "@/lib/security";
import { useAuth } from "@/components/AuthProvider";
import styles from "../auth.module.css";

const REGISTER_LOCK_MS = 45_000;

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, backendConfigured, register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const limiterRef = useRef(new RateLimiter(4, 60_000));

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

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
      if (!limiterRef.current.isAllowed("register-route")) {
        setLockedUntil(now + REGISTER_LOCK_MS);
        setError("Too many registration attempts. Please wait and retry.");
        return;
      }

      setBusy(true);
      setError(null);
      const result = await register({ email, password, displayName });
      setBusy(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace("/");
    },
    [busy, displayName, email, lockedUntil, password, register, router]
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
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>
          Join the VGC Puzzle Trainer to track your progress and compete on the leaderboard.
        </p>
        <span
          className={`${styles.modeBadge} ${
            backendConfigured ? styles.modeBackend : styles.modeLocal
          }`}
        >
          {backendConfigured ? "AUTH: BACKEND" : "AUTH: BACKEND UNCONFIGURED"}
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
              placeholder="Your trainer name"
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
              placeholder="trainer@example.com"
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
              placeholder="At least 8 characters"
            />
          </label>
          <button className={styles.primaryBtn} type="submit" disabled={busy}>
            {busy ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <div className={styles.footerRow}>
          <Link className={styles.link} href="/login">
            Already have an account? Login
          </Link>
          <Link className={styles.link} href="/">
            Back to app
          </Link>
        </div>
      </section>
    </main>
  );
}

