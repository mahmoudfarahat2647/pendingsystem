import type { HTMLAttributes } from "react";

type MirageLoaderProps = HTMLAttributes<HTMLElement> & {
	size?: number | string;
	speed?: number | string;
	color?: number | string;
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"l-mirage": MirageLoaderProps;
		}
	}
}

declare module "react/jsx-runtime" {
	namespace JSX {
		interface IntrinsicElements {
			"l-mirage": MirageLoaderProps;
		}
	}
}

declare module "react/jsx-dev-runtime" {
	namespace JSX {
		interface IntrinsicElements {
			"l-mirage": MirageLoaderProps;
		}
	}
}
