import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "有间好馆｜广州健身房选馆助手",
  description: "体验官实测、AI整理、人工审核后发布的健身房信息平台。",
  icons: {
    icon: "/assets/gym-map.svg",
    shortcut: "/assets/gym-map.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
