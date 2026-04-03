import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { logger } from "./lib/logger";
import { AppError } from "./utils/AppError";

import { userMiddleware } from "./middlewares/user.middleware";
import currenciesRoutes from "./routes/currencies.routes";
import ratesRoutes from "./routes/rates.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
	const start = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - start;

		if (res.statusCode >= 500) {
			logger.error(
				`${req.method} ${res.statusCode} ${req.originalUrl} ${duration}ms`,
			);
		} else if (res.statusCode >= 400) {
			logger.warn(
				`${req.method} ${res.statusCode} ${req.originalUrl} ${duration}ms`,
			);
		} else {
			logger.info(
				`${req.method} ${res.statusCode} ${req.originalUrl} ${duration}ms`,
			);
		}
	});

	next();
});

app.use("/api", userMiddleware);

const swaggerDocument = YAML.load("./swagger.yaml");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/currencies", currenciesRoutes);
app.use("/api/rates", ratesRoutes);
app.use("/api/user", userRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
	next(new AppError(404, "NOT_FOUND", "Route not found"));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	const status = err.statusCode || 500;

	const baseLog = {
		method: req.method,
		url: req.originalUrl,
		status,
	};

	if (status >= 500) {
		logger.error(
			{
				...baseLog,
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
});

export default app;
