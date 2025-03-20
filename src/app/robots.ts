import type { MetadataRoute } from "next";
import { redirects } from "@/lib/config/redirects";

const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set")
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          `${redirects.auth.callback}`,
          `${redirects.auth.logout}`,
          `${redirects.auth.createAccount}`,
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    // {
    //   rules:
    //     | {
    //         userAgent?: string | string[]
    //         allow?: string | string[]
    //         disallow?: string | string[]
    //         crawlDelay?: number
    //       }
    //     | Array<{
    //         userAgent: string | string[]
    //         allow?: string | string[]
    //         disallow?: string | string[]
    //         crawlDelay?: number
    //       }>
    //   sitemap?: string | string[]
    //   host?: string
    // }
  };
}
