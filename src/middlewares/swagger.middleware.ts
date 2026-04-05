import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { Express } from "express";
import { env } from "@/config/env";

export const setupSwagger = (app: Express) => {
	if (env.NODE_ENV === "production") {
		return;
	}

	const swaggerDocument = YAML.load("./swagger.yaml");

	app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
