import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";

export const metadata: Metadata = {
  title: "wzj单词记忆",
  description: "艾宾浩斯背单词应用",
  manifest: "/wzj-word-memory/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "wzj单词记忆",
  },
  icons: {
    icon: "/wzj-word-memory/favicon.svg",
    apple: "/wzj-word-memory/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="antialiased">
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
