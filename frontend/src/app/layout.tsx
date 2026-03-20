import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.scss';
import styles from './layout.module.scss';

const bodyFont = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
});

const titleFont = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-title',
  weight: ['600'],
});

export const metadata: Metadata = {
  title: 'Lookforgrim — карта гримеров',
  description: 'MVP интерфейс поиска гримеров на карте Яндекс Карт',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${bodyFont.variable} ${titleFont.variable} ${styles.body}`}>{children}</body>
    </html>
  );
}
