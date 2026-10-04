import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "../app-info";
import { UiProvider } from "../components/ui/ui-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  );
}
