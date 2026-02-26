import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const getBaseUrl = () => {
	try {
		return new URL(APP_URL).origin;
	} catch {
		return "http://localhost:3000";
	}
};

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getBaseUrl();

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
