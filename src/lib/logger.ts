export const logger = {
	debug: (msg: string, data?: unknown) => {
		if (process.env.NODE_ENV !== "production") console.debug(msg, data);
	},
	warn: (msg: string, data?: unknown) => console.warn(msg, data),
	error: (msg: string, err?: unknown) => console.error(msg, err),
};
