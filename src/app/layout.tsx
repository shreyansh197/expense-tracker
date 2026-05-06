import type { Metadata, Viewport } from "next";
import { Lora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
  weight: ["400", "500", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ExpenStream",
  description: "Stream your expenses. Track smarter. Live better.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png?v=74b974f1", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png?v=74b974f1", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=74b974f1", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/icons/favicon-32.png?v=74b974f1", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png?v=74b974f1", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExpenStream",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // NOTE: Do NOT set viewportFit or interactiveWidget here.
  // - viewportFit=cover makes env(safe-area-inset-*) return real values (~34px
  //   on iPhone), which inflates the bottom nav height and changes iOS scroll
  //   boundary behaviour. The app components were designed without it.
  // - interactiveWidget=resizes-visual repositions the visual viewport during
  //   address-bar animations, causing scroll jank.
  // Keyboard awareness is handled entirely by the Visual Viewport API
  // (useVisualViewport hook) without changing the viewport model at all.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1B2E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${lora.variable} ${jakarta.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__pwaInstallPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallPrompt=e;});`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
