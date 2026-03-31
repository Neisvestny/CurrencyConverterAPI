import { createClient } from "@supabase/supabase-js";
import { logger } from "./../lib/logger";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseKey = process.env["SUPABASE_KEY"];

if (!supabaseUrl || !supabaseKey) {
	logger.error(
		{
			SUPABASE_URL: supabaseUrl ? "OK" : "MISSING",
			SUPABASE_KEY: supabaseKey ? "OK" : "MISSING",
		},
		"Supabase env validation failed",
	);

	process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
