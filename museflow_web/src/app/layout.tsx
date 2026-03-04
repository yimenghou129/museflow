import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { AuthBar } from "@/components/AuthBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MuseFlow — 执行引擎",
  description:
    "MuseFlow 是一个协作式执行系统，帮助用户将混乱的大脑输入转化为结构化、基于真实容量的可执行计划。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <a href="/" className="text-sm font-medium text-zinc-50">
              MuseFlow
            </a>
            <AuthBar user={user} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
