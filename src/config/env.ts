import { get } from "env-var";

export const env = {
	NODE_ENV: get("NODE_ENV")
		.default("development")
		.asEnum(["development", "production", "test"]),

	HOST: get("HOST").default("localhost").asString(),
	PORT: get("PORT").default("3000").asPortNumber(),

	SUPABASE_URL: get("SUPABASE_URL").required().asString(),
	SUPABASE_KEY: get("SUPABASE_KEY").required().asString(),

	LOG_LEVEL: get("LOG_LEVEL").default("info").asString(),
	LOG_PRETTY: get("LOG_PRETTY").default("false").asBool(),
};
