import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerOS | Job Quest Demo",
  description:
    "CareerOS fictional interactive job quest demo. Explore authored technology roles and build a session-only party. No applications are submitted; refresh resets changes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-100 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}