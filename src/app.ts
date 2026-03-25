import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { userMiddleware } from "./middlewares/user.middleware";
import currenciesRoutes from "./routes/currencies.routes";
import ratesRoutes from "./routes/rates.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(userMiddleware);

const swaggerDocument = YAML.load("./swagger.yaml");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/currencies", currenciesRoutes);
app.use("/api/rates", ratesRoutes);

app.use((req: Request, res: Response) => {
	res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

export default app;
