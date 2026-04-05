import { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/logger";

export const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const start = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - start;

		const logData = {
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			duration,
		};

		if (res.statusCode >= 500) {
			logger.error(logData, "request failed");
		} else if (res.statusCode >= 400) {
			logger.warn(logData, "request warning");
		} else {
			logger.info(logData, "request success");
		}
	});

	next();
};
