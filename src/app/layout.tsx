import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/shake.config";
import SmoothScroll from "@/components/core/SmoothScroll";
import CustomCursor from "@/components/core/CustomCursor";
import FilmGrain from "@/components/core/FilmGrain";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.brandName} — ${site.tagline}`,
  description:
    "Thick, cold, real-fruit shakes. Mango, strawberry, chocolate, pistachio, cookies and cream.",
};

export const viewport: Viewport = {
  themeColor: "#ffb02e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${manrope.variable}`}>
      <body className="no-x">
        <SmoothScroll />
        <CustomCursor />
        {children}
        <FilmGrain />
      </body>
    </html>
  );
}
