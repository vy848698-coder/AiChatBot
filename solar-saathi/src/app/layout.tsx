import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Oriya, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const oriya = Noto_Sans_Oriya({ subsets: ["oriya"], variable: "--font-oriya" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-deva" });

export const metadata: Metadata = {
  title: "Solar Saathi · Clans Machina",
  description: "Your AI solar friend. Get a personalised rooftop solar plan in Odia, Hindi or English.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0f12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${grotesk.variable} ${oriya.variable} ${deva.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
