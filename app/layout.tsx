import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kimichi ERP - نظام إدارة الأعمال',
  description: 'منصة إدارة الأعمال المتكاملة - Kimichi ERP',
  icons: { icon: 'https://i.imgur.com/1bmshnE.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
