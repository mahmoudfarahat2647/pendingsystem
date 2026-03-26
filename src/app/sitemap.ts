import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
	return [
		{
			url: `${baseUrl}/login`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
	];
}
