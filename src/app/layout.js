import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";
import Providers from "@/components/layout/Providers";
import { CONTACT_EMAIL, LEGAL_ENTITY_NAME, PLATFORM_BRAND } from "@/features/billing/lib/legal";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://10tracker.com";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const hasGaMeasurementId = Boolean(gaMeasurementId);

const defaultDescription =
  "Practice topic-wise MCQs and timed mocks, then follow OG Tracker paths — free to start on 10Tracker.";

export const metadata = {
  title: {
    default: "10Tracker - Exam Practice, Mocks & OG Trackers",
    template: "%s | 10tracker",
  },
  description: defaultDescription,
  keywords: [
    "exam preparation",
    "CAT exam",
    "GATE exam",
    "UPSC preparation",
    "JEE preparation",
    "NEET preparation",
    "competitive exams",
    "mock tests",
    "MCQ practice",
    "OG Trackers",
    "study materials",
  ],
  authors: [{ name: "10tracker Team" }],
  creator: "10tracker",
  publisher: "10tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: "10Tracker - Exam Practice, Mocks & OG Trackers",
    description: defaultDescription,
    siteName: "10tracker",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "10Tracker - Exam Practice & OG Trackers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "10Tracker - Exam Practice, Mocks & OG Trackers",
    description: defaultDescription,
    images: ["/og-image.jpg"],
    creator: "@10tracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: PLATFORM_BRAND,
  alternateName: "10Tracker",
  url: siteUrl,
  logo: `${siteUrl}/10tracker.png`,
  email: CONTACT_EMAIL,
  legalName: LEGAL_ENTITY_NAME,
  sameAs: [
    "https://x.com/10Tracker",
    "https://www.instagram.com/10trackerdotcom",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "10Tracker",
  url: siteUrl,
  description: defaultDescription,
  publisher: {
    "@type": "Organization",
    name: PLATFORM_BRAND,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {hasGaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
            </Script>
          </>
        ) : null}

        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2873018653456315`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />

        <meta name="theme-color" content="#1f2937" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="10tracker" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily:
            "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <Providers>
          {children}
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </Providers>
      </body>
    </html>
  );
}
