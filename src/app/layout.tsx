import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeDesk",
  description: "Roki, dokumenti, opomniki in stroški za gospodinjstvo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#185FA5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl" suppressHydrationWarning>
      <head>
        {/* Anti-flash: nastavi dark class pred hydracijo */}
        <script dangerouslySetInnerHTML={{ __html: `try{const s=localStorage.getItem('lifedesk-theme');if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
