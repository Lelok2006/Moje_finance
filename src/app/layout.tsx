import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moje finance",
  description: "Gospodinjski ERP — upravljanje družinskih financ",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#185FA5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
