import type { MetadataRoute } from "next";

const routes = [
	"/",
	"/dashboard",
	"/orders",
	"/main-sheet",
	"/call-list",
	"/booking",
	"/archive",
] as const;

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const getBaseUrl = () => {
	try {
		return new URL(APP_URL).origin;
	} catch {
		return "http://localhost:3000";
	}
};

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = getBaseUrl();
	const lastModified = new Date();

	return routes.map((route) => ({
		url: `${baseUrl}${route}`,
		lastModified,
	}));
}
