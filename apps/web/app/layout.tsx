import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteMetadata } from "../lib/metadata";

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#6366f1" />
      </head>
<body suppressHydrationWarning>{children}</body>

    </html>
  );
}
