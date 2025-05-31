import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GameWebSocketProvider } from "../context/game-socket-provider";
import { TanstackProvider } from "../context/tanstack-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Code Royale",
  description: "Online coding battle royale game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#161616]`}>
        <TanstackProvider>
          <GameWebSocketProvider>{children}</GameWebSocketProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}
