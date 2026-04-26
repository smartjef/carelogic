import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Agentic Healthcare Intelligence",
  description: "Search messy healthcare reports and find best-fit facilities fast.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-100 text-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
