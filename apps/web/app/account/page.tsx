"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import styles from "../auth.module.css";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Client-side guard: redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/account");
    }
  }, [isLoading, isAuthenticated, router]);

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  // Loading state while checking auth
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

  // If not authenticated, the useEffect above will redirect.
  // Show a brief loading state to avoid flash.
  if (!isAuthenticated || !user) {
    return (
      <main className={styles.authMain}>
        <section className={styles.authCard}>
          <div className={styles.eyebrow}>VGC PUZZLE TRAINER</div>
          <h1 className={styles.title}>Checking Access...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.authMain}>
      <section className={`${styles.authCard} ${styles.accountCard}`}>
        <div className={styles.eyebrow}>TRAINER ACCOUNT</div>
        <h1 className={styles.title}>{user.displayName}</h1>
        <p className={styles.accountMeta}>
          <strong>Email:</strong> {user.email}
        </p>
        <p className={styles.accountMeta}>
          <strong>Member since:</strong>{" "}
          {new Date(user.loggedAt).toLocaleDateString()}
        </p>

        <div className={styles.accountActions}>
          <Link href="/" className={styles.secondaryBtn}>
            GO TO TRAINER
          </Link>
          <Link href="/puzzles/random" className={styles.secondaryBtn}>
            RANDOM PUZZLE
          </Link>
          <button type="button" className={styles.primaryBtn} onClick={onLogout}>
            LOG OUT
          </button>
        </div>
      </section>
    </main>
  );
}

