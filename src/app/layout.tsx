import type { Metadata } from "next";
import "./globals.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export const metadata: Metadata = {
  title: "Destek Yönetimi",
  description: "Saha destek ekipleri için mobil destek yönetim uygulaması",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}