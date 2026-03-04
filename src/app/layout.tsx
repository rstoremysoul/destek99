import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export const metadata: Metadata = {
  title: "Destek Yönetimi",
  description: "Saha destek ekipleri için mobil destek yönetim uygulaması",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="randomuuid-polyfill" strategy="beforeInteractive">
          {`
            (() => {
              const g = globalThis;
              if (!g || !g.crypto || typeof g.crypto.randomUUID === "function") return;
              const makeUuid = () => {
                if (typeof g.crypto.getRandomValues === "function") {
                  const b = new Uint8Array(16);
                  g.crypto.getRandomValues(b);
                  b[6] = (b[6] & 15) | 64;
                  b[8] = (b[8] & 63) | 128;
                  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
                  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
                }
                const p = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
                return p() + p() + "-" + p() + "-4" + p().slice(0, 3) + "-" + ((8 + Math.floor(Math.random() * 4)).toString(16) + p().slice(0, 3)) + "-" + p() + p() + p();
              };
              try {
                Object.defineProperty(g.crypto, "randomUUID", {
                  value: makeUuid,
                  configurable: true,
                  writable: true,
                });
              } catch (_) {}
              if (typeof g.crypto.randomUUID === "function") return;
              try {
                const proto = Object.getPrototypeOf(g.crypto);
                if (proto) {
                  Object.defineProperty(proto, "randomUUID", {
                    value: makeUuid,
                    configurable: true,
                    writable: true,
                  });
                }
              } catch (_) {}
              if (typeof g.crypto.randomUUID === "function") return;
              try {
                const patchedCrypto = Object.create(g.crypto);
                Object.defineProperty(patchedCrypto, "randomUUID", {
                  value: makeUuid,
                  configurable: true,
                  writable: true,
                });
                Object.defineProperty(g, "crypto", {
                  value: patchedCrypto,
                  configurable: true,
                });
              } catch (_) {}
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
