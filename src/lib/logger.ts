import pino from "pino";
import { env } from "@/config/env";

const isPretty = env.LOG_PRETTY == true;

export const logger = pino({
	level: env.LOG_LEVEL || "info",
	...(isPretty && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:HH:MM:ss",
				ignore: "pid,hostname",
			},
		},
	}),
});
