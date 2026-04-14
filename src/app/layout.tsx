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
  title: "OpenLedger — Free Alternative to Bloomberg & Nansen",
  description: "Institutional-grade crypto data for everyone. Real-time prices, whale alerts, wallet tracker, AI analyst — zero paywall. Free alternative to Bloomberg, Nansen & Glassnode.",
  metadataBase: new URL("https://openledger-six.vercel.app"),
  openGraph: {
    title: "OpenLedger — Free Alternative to Bloomberg & Nansen",
    description: "Real-time crypto prices, whale alerts, AI analyst & DeFi data — completely free. No account required.",
    url: "https://openledger-six.vercel.app",
    siteName: "OpenLedger",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "OpenLedger — Free Financial Intelligence",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenLedger — Free Alternative to Bloomberg & Nansen",
    description: "Real-time crypto prices, whale alerts, AI analyst & DeFi data — completely free.",
    images: ["/opengraph-image.png"],
  },
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
          ✦ Free Forever · No Paywall · No Account Required ·{' '}
          <a
            href="https://github.com/DiveshK007/openledger"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >Open Source ↗</a>
          {' '}✦
        </div>
        {children}
      </body>
    </html>
  );
}
