import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { I18nProvider } from "@/components/I18n";
import Fx from "@/components/Fx";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.joaoaugusto.dev";
const TITLE =
  "João Augusto de Freitas | Desenvolvedor de Software Full-Stack em São João da Boa Vista";
const DESC =
  "Portfólio de João Augusto de Freitas, dev/desenvolvedor de software full-stack em São João da Boa Vista - SP, especializado em Flutter, Node.js, NestJS e ESP32/IoT. Formado pela ETEC de Vargem Grande do Sul, cursando Análise e Desenvolvimento de Sistemas na UNIFEOB. Confira projetos, habilidades e trajetória.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  keywords: [
    "João Augusto de Freitas", "dev", "developer", "desenvolvedor", "desenvolvedor de software",
    "desenvolvedor de sistemas", "programador", "software developer", "full stack developer",
    "desenvolvedor full-stack", "desenvolvedor front-end", "desenvolvedor back-end",
    "desenvolvedor mobile", "desenvolvedor Flutter", "desenvolvedor Node.js",
    "portfolio desenvolvedor", "portfólio programador", "Flutter", "Dart", "Node.js", "NestJS",
    "JavaScript", "TypeScript", "HTML5", "CSS3", "ESP32", "IoT", "MySQL", "Firebase", "Supabase",
    "desenvolvedor São João da Boa Vista", "programador São João da Boa Vista",
    "desenvolvedor Vargem Grande do Sul", "desenvolvedor SP", "desenvolvedor interior de São Paulo",
    "UNIFEOB", "ETEC", "ETEC de Vargem Grande do Sul", "Análise e Desenvolvimento de Sistemas",
  ],
  authors: [{ name: "João Augusto de Freitas", url: SITE }],
  creator: "João Augusto de Freitas",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    languages: { "pt-BR": "/?lang=pt", en: "/?lang=en", "x-default": "/" },
  },
  // Google prefers an icon >= 48px; o .ico só tem 16/32 e aparecia errado na busca.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/icon.png", type: "image/png", sizes: "256x256" },
    ],
    apple: "/images/pinch-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "João Augusto de Freitas - Portfolio",
    title: TITLE,
    description: DESC,
    images: ["/images/me.png"],
    locale: "pt_BR",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/images/me.png"],
  },
  other: { "geo.region": "BR-SP", "geo.placename": "São João da Boa Vista" },
};

export const viewport = { themeColor: "#1e1e2f" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "João Augusto de Freitas",
  alternateName: "João Augusto Dev",
  url: SITE + "/",
  image: SITE + "/images/me.png",
  jobTitle: "Desenvolvedor de Software Full-Stack",
  description:
    "Desenvolvedor de software full-stack (dev) em São João da Boa Vista - SP, especializado em Flutter, Node.js, NestJS e ESP32/IoT.",
  knowsLanguage: ["Portuguese", "English"],
  email: "mailto:contato@joaoaugusto.dev",
  address: {
    "@type": "PostalAddress",
    addressLocality: "São João da Boa Vista",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  homeLocation: { "@type": "Place", name: "São João da Boa Vista, São Paulo, Brasil" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "UNIFEOB", description: "Análise e Desenvolvimento de Sistemas" },
    { "@type": "EducationalOrganization", name: "ETEC de Vargem Grande do Sul", description: "Técnico em Informática para Internet" },
  ],
  knowsAbout: [
    "Desenvolvimento de Software", "Programação", "Flutter", "Dart", "Node.js", "NestJS",
    "JavaScript", "TypeScript", "HTML5", "CSS3", "ESP32", "IoT", "MySQL", "Firebase", "Supabase",
    "Desenvolvimento Full-Stack", "Desenvolvimento Mobile",
  ],
  sameAs: [
    "https://github.com/joaoaugusto-dev",
    "https://www.linkedin.com/in/jo%C3%A3o-augusto-de-freitas/",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      {/* suppressHydrationWarning: extensões de "dark mode" (ex.: Dark Reader) injetam
          um <style> irmão do <link> aqui dentro antes do React hidratar. É um filho a
          mais, não um mismatch de atributo — por isso a flag vai no pai (<head>), não
          no <link>: suppressHydrationWarning só cobre um nível abaixo de onde é posta. */}
      <head suppressHydrationWarning>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full antialiased">
        <Fx />
        <I18nProvider>{children}</I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
