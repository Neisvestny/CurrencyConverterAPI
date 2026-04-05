import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import { StatusCodes } from "http-status-codes";

import routes from "./routes";
import { userMiddleware } from "./middlewares/user.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { setupSwagger } from "./middlewares/swagger.middleware";

import { AppError } from "./utils/AppError";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(requestLogger);

setupSwagger(app);

app.use("/api", userMiddleware);

app.use("/api", routes);

app.use((req, res, next) => {
	next(new AppError(StatusCodes.NOT_FOUND, "NOT_FOUND", "Route not found"));
});

app.use(errorHandler);

export default app;
