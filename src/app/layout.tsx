import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "OpenLedger — Free Financial Intelligence",
  description: "Institutional-grade crypto data for everyone. Real-time prices, whale alerts, wallet tracker — zero paywall.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceMono.variable}`}>
      <body>
        {/* Global FREE FOREVER banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(0,229,160,0.08), rgba(0,184,255,0.08), rgba(0,229,160,0.08))',
          borderBottom: '1px solid rgba(0,229,160,0.12)',
          padding: '5px 20px',
          textAlign: 'center',
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: 10,
          color: 'var(--green)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}>
          ✦ Free Forever · No Paywall · No Account Required · Open Source ✦
        </div>
        {children}
      </body>
    </html>
  );
}
