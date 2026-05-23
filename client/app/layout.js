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

export const metadata = {
  title: "AgroTrust AI — Privacy-First Agricultural Verification",
  description:
    "AI-powered crop quality analysis and invoice verification with zero-trust security. Empowering smallholder farmers with transparent grading and instant payments.",
  keywords: "agriculture, AI, crop quality, invoice OCR, privacy, fintech, SDG",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0f1a] text-slate-200">
        {children}
      </body>
    </html>
  );
}
