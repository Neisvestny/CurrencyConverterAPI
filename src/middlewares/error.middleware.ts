import { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/logger";

export const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const status = err.statusCode || 500;

	if (status >= 500) {
		logger.error(
			{
				method: req.method,
				url: req.originalUrl,
				status,
				error: {
					message: err.message,
					code: err.code,
					stack: err.stack,
				},
			},
			"internal error",
		);
	}

	res.status(status).json({
		error: {
			code: err.code || "INTERNAL_ERROR",
			message: err.message || "Something went wrong",
			details: err.details || null,
		},
	});
};
