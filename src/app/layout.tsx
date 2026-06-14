import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apotek Modern POS - Sistem Kasir & Inventaris Pintar",
  description: "Aplikasi Kasir (POS) Apotek Modern dengan pelacakan expired date (FEFO), manajemen resep dokter, dan terintegrasi SatuSehat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
