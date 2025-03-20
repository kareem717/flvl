import { redirects } from "@/lib/config/redirects";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${BASE_URL}${redirects.legal.privacy}`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}${redirects.legal.terms}`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}${redirects.auth.login}`,
      lastModified: new Date(),
    },
  ];
}
