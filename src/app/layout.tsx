import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import InlineScript from "@/components/InlineScript";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ce fac în oraș — București",
  description:
    "Tot ce se întâmplă în oraș, într-un singur loc: concerte, stand-up, teatru, expoziții, târguri și petreceri din București.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ce fac în oraș",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* Rulează sincron, înainte ca pagina să se deseneze: aplică tema
            salvată (sau preferința sistemului) ca să nu apară un flash alb. */}
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="flex-1 w-full max-w-2xl mx-auto pb-20">{children}</div>
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
