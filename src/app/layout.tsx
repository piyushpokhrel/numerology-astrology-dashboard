import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/components/ProfileProvider";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroNumerology — One Dashboard, Four Systems",
  description:
    "Chaldean + Pythagorean numerology, Western, Vedic and Chinese astrology in one dashboard. Exact calculations, classical interpretations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ProfileProvider>
          <AppShell>{children}</AppShell>
        </ProfileProvider>
      </body>
    </html>
  );
}
