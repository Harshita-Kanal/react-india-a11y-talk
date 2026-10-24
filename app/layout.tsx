import type { ReactNode } from 'react';
import { Announcer } from '@/lib/a11y/announcer';
import './globals.css';

export const metadata = { title: 'Calendar assistant' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Mounted once, empty, at page load: the one voice for the whole app. */}
        <Announcer>{children}</Announcer>
      </body>
    </html>
  );
}
