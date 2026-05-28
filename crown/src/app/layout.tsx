import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "CROWN — Watch Collection Identity",
  description: "Turn your watch collection into shareable digital identity cards. Every timepiece deserves its moment.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👑</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: '#0a0a0a' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}