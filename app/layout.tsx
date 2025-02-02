import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claudius | Simple Claude 3.5 Sonnet Chat API",
  description: "By claudius.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
