import type { Metadata } from "next";
import "@/styles/globals.css";
import { AsthraShell } from "@/layouts/asthra-shell";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "Asthra",
  description: "AI-native work platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AsthraShell>{children}</AsthraShell>
        </AppProviders>
      </body>
    </html>
  );
}
