import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apotek ApoGo - Sistem Kasir & Inventaris Pintar",
  description: "Aplikasi Kasir (POS) Apotek ApoGo dengan pelacakan expired date (FEFO), manajemen resep dokter, dan terintegrasi SatuSehat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
