import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LalaFlow — Operational Engine for Lala Tech LLC",
  description: "Turn operational chaos into coordinated action. AI-powered operational intake and accountability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
