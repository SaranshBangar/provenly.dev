import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DialogProvider } from "@/components/Dialog";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Provenly, Verifiable Certificates",
  description:
    "Design beautiful certificates, issue them in bulk, and give every recipient a public verification page. One scan proves it's real, forever.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://provenly.dev"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    images: ["/provenly-social.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
