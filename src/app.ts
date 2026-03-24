import express, { Request, Response, NextFunction } from "express";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();

app.use(express.json());

const swaggerDocument = YAML.load("./swagger.yaml");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req: Request, res: Response) => {
	res.send("Hello, World!");
});

app.use((req: Request, res: Response) => {
	res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

export default app;
