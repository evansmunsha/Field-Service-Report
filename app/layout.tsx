// app/layout.tsx
import { SessionProvider } from "next-auth/react";
import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";


const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Field Service Report | Track Ministry Time",
  description:
    "Track your field service hours, Bible studies, and generate monthly ministry reports",
  generator: "Munsha",
  metadataBase: new URL("https://field-service-reports.vercel.app"),
  applicationName: "Field Service Report",
  keywords: [
    "field service",
    "ministry",
    "time tracking",
    "bible studies",
    "JW",
    "reports",
  ],
  authors: [{ name: "Evans Munsha" }],
  creator: "Evans Munsha",
  publisher: "Field Service Report",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [{ url: "/logo.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "dark light",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Field Service Report",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Field Service Report",
    "application-name": "Field Service Report",
    "msapplication-TileColor": "#0f172a",
    "msapplication-config": "/browserconfig.xml",
  },
};

import Head from "next/head";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <body className="font-sans antialiased">
        <SessionProvider>{children}<Analytics /></SessionProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registered:', registration);
                  })
                  .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

