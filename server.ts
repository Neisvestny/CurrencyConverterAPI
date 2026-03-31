import dotenv from "dotenv";
dotenv.config();

import app from "./src/app";
import { logger } from "./src/lib/logger";

const PORT = process.env["PORT"] || 3000;

app.listen(PORT, () => {
	logger.info(`Server started on http://localhost:${PORT}`);
});
