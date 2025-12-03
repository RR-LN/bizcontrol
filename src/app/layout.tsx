import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StockAlertToast from "./components/StockAlertToast";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BizControl 360 - Sistema ERP Moderno",
  description: "Sistema de gestão empresarial completo para pequenas e médias empresas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <Providers>
          <StockAlertToast />
          {children}
        </Providers>
      </body>
    </html>
  );
}
