import type { Metadata } from "next";
import { Anton, Geist } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineVote",
  description: "A cinematic college movie voting experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-geist text-cine-text-primary">
        {children}
      </body>
    </html>
  );
}
