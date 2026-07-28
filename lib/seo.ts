import type { Metadata } from "next";

import { SITE_NAME, SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from "@/constants/seo.constant";

interface BuildMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

export function buildMetadata(props: BuildMetadataProps): Metadata {
  let openGraphImageUrl = new URL("/og.png", SITE_URL).toString();

  const title = props.title ? `${props.title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const description = props.description ?? DEFAULT_DESCRIPTION;

  const url = new URL(props.path ?? "/", SITE_URL).toString();

  if (props.image) {
    openGraphImageUrl = props.image.startsWith("http")
      ? props.image
      : new URL(props.image, SITE_URL).toString();
  }

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),

    icons: {
      icon: "favicon.ico",
    },

    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: openGraphImageUrl }],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [openGraphImageUrl],
    },

    alternates: { canonical: url },

    robots: props.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  };
}
