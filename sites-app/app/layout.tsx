import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "youjian-haoguan.harry88767.chatgpt.site";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "有间好馆｜广州健身房选馆助手",
    description: "体验官实测、AI整理、人工审核后发布的健身房信息平台。",
    icons: {
      icon: "/assets/gym-map.svg",
      shortcut: "/assets/gym-map.svg",
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      title: "有间好馆｜只做真实的评分",
      description: "体验官实测、人工审核、真实报告，帮你看懂价格、器械、拥挤与办卡风险。",
      images: [{ url: new URL("/og.png", metadataBase), width: 1729, height: 910, alt: "有间好馆真实评分平台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "有间好馆｜只做真实的评分",
      description: "体验官实测、人工审核、真实报告。",
      images: [new URL("/og.png", metadataBase)],
    },
  };
}

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
