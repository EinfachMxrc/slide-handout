import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Instrument_Serif, Pacifico } from "next/font/google";
import { ConvexClientProvider } from "#/components/providers/convex-provider";
import { ThemeProvider } from "#/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});
const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-pacifico",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Slide Handout",
  description:
    "Das Handout, das erst aufdeckt, wenn Sie es sagen. Realtime-Fan-out für Vortrags-Handouts.",
  applicationName: "Slide Handout",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1426" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const h = await headers();
  const nonce = h.get("x-csp-nonce") ?? undefined;

  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable} ${pacifico.variable}`}
    >
      <body>
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
        {/* Hint to React server: forward nonce so any inline scripts inherit. */}
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
      </body>
    </html>
  );
}
