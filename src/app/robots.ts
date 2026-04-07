import type { MetadataRoute } from "next";

const BASE_URL = "https://bdj-karukera.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/games", "/community", "/membership", "/login", "/register"],
        disallow: ["/dashboard", "/operations", "/settings", "/admin"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
