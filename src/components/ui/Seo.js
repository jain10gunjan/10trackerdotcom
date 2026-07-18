import Head from 'next/head';

export default function ArticleSEO({ 
  title, 
  description, 
  image, 
  url, 
  publishedTime, 
  modifiedTime, 
  author, 
  category, 
  tags = [],
  readingTime,
  viewCount
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const fullUrl = `${siteUrl}${url}`;
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-image.jpg`;

  // Google Rich Results Schema for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": fullImage,
    "url": fullUrl,
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": {
      "@type": "Person",
      "name": author || "10tracker Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "10tracker",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    },
    "articleSection": category,
    "keywords": tags.join(', '),
    "wordCount": description?.length || 0,
    "timeRequired": readingTime ? `PT${readingTime}M` : undefined
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Articles",
        "item": `${siteUrl}/articles`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": fullUrl
      }
    ]
  };

  // FAQ Schema (if applicable)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is ${title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": description
        }
      }
    ]
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title} | 10tracker</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tags.join(', ')} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="10tracker" />
      <meta property="og:locale" content="en_US" />
      <meta property="article:published_time" content={publishedTime} />
      <meta property="article:modified_time" content={modifiedTime || publishedTime} />
      <meta property="article:author" content={author || "CatTracker Team"} />
      <meta property="article:section" content={category} />
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@10tracker" />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content={author || "10tracker Team"} />
      <meta name="publisher" content="10tracker" />
      <meta name="article:reading_time" content={readingTime} />
      <meta name="article:view_count" content={viewCount} />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
    </Head>
  );
}

// SEO component for general pages
export function PageSEO({ 
  title, 
  description, 
  image, 
  url, 
  type = "website" 
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const fullUrl = `${siteUrl}${url}`;
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-image.jpg`;

  return (
    <Head>
      <title>{title} | 10tracker</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="10tracker" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </Head>
  );
}
