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
  title: "Diabetes Ops Cockpit",
  description: "Real-time diabetes management dashboard — BG, IOB/COB, basal, meals, and anomaly alerts from Nightscout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inject Nightscout config synchronously before React hydrates.
  // This prevents SWR hooks from seeing undefined config and caching errors.
  const nsScript = `
    (function(){
      var url = '${process.env.NEXT_PUBLIC_NIGHTSCOUT_URL || ''}';
      var token = '${process.env.NEXT_PUBLIC_NIGHTSCOUT_TOKEN || ''}';
      if(url && token) window.__NIGHTSCOUT_CONFIG__ = {url:url,token:token};
    })();
  `;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: nsScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
