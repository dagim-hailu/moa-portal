import "./globals.css";
import { Inter, Noto_Sans_Ethiopic, Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { getSession } from "../lib/session";
import { fetchMyApps } from "../lib/portal-queries";
import { PortalShell } from "../components/portal/PortalShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});
const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-ethiopic",
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const localeCookie = cookies().get("moa_locale")?.value;
  const locale = localeCookie === "am" ? "am" : "en";
  const apps = session ? await fetchMyApps() : [];

  return (
    <html lang={locale} className={`h-full ${inter.variable} ${plusJakarta.variable} ${notoEthiopic.variable}`} data-theme="light">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body className={`h-full ${inter.variable} ${plusJakarta.variable} ${notoEthiopic.variable} font-sans antialiased`}>
        {session ? (
          <PortalShell session={session} apps={apps} locale={locale}>
            {children}
          </PortalShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
