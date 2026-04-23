"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { clearSessionUser, getSessionUser, type AuthUser } from "@/lib/auth-client";
import styles from "../auth.module.css";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getSessionUser();
    if (!current) {
      router.replace("/login?next=/account");
      return;
    }
    setUser(current);
    setReady(true);
  }, [router]);

  const onLogout = useCallback(() => {
    clearSessionUser();
    router.replace("/login");
  }, [router]);

  if (!ready || !user) {
    return (
      <main className={styles.authMain}>
        <section className={styles.authCard}>
          <div className={styles.eyebrow}>LOADING SESSION</div>
          <h1 className={styles.title}>Checking Access...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.authMain}>
      <section className={`${styles.authCard} ${styles.accountCard}`}>
        <div className={styles.eyebrow}>SIGNED-IN VIEW</div>
        <h1 className={styles.title}>Trainer Account</h1>
        <p className={styles.accountMeta}><strong>Email:</strong> {user.email}</p>
        <p className={styles.accountMeta}><strong>Display Name:</strong> {user.displayName}</p>
        <p className={styles.accountMeta}><strong>Last Login:</strong> {new Date(user.loggedAt).toLocaleString()}</p>

        <div className={styles.accountActions}>
          <Link href="/" className={styles.secondaryBtn}>GO TO TRAINER</Link>
          <Link href="/puzzles/random" className={styles.secondaryBtn}>OPEN RANDOM PUZZLE</Link>
          <button type="button" className={styles.primaryBtn} onClick={onLogout}>LOG OUT</button>
        </div>
      </section>
    </main>
  );
}
