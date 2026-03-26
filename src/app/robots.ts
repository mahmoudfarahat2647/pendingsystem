import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ["/login", "/forgot-password", "/reset-password"],
				disallow: [
					"/dashboard",
					"/orders",
					"/main-sheet",
					"/call-list",
					"/booking",
					"/archive",
					"/api/",
					"/draft-session-test",
				],
			},
		],
	};
}
