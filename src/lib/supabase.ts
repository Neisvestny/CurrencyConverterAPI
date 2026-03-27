import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("SUPABASE_URL: ", supabaseUrl ? "OK" : "MISSING");
	console.error("SUPABASE_KEY: ", supabaseKey ? "OK" : "MISSING");

	process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
