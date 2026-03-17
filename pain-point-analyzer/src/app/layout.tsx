import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pain Point Analyzer | 发现用户真正需要的',
  description: 'AI 驱动的痛点分析工具，帮助产品经理和创业者发现用户真正需要的',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
