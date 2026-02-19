import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "MediaCrop Pro - Free MP3 & MP4 Online Cropper",
  description: "High-quality MP3 and MP4 cropper in your browser. No server uploads, total privacy, and blazing fast processing.",
  keywords: ["mp3 cropper", "mp4 cutter", "music editor", "video trimmer", "online media cropper", "free audio editor", "privacy first editor"],
  authors: [{ name: "MediaCrop Pro Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "MediaCrop Pro - Professional Media Cutting Tool",
    description: "The fastest way to crop your audio and video files online with zero server uploads.",
    url: "https://media-crop.zucca100.com", // Replace with actual domain
    siteName: "MediaCrop Pro",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaCrop Pro - Online MP3/MP4 Cropper",
    description: "Crop media files securely in your browser. No installation, no upload.",
  },
  alternates: {
    canonical: "https://media-crop.zucca100.com", // Replace with actual domain
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9196149361612087"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
