import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";
import { env } from "@/config/env";

app.listen(env.PORT, () => {
	if (env.NODE_ENV === "development") {
		logger.info(`Server started on http://${env.HOST}:${env.PORT}`);
	} else {
		logger.info({ port: env.PORT }, "server started");
	}
});
