import { supabase } from "../lib/supabase";

export const getUserById = async (userId: string) => {
	const { data, error } = await supabase
		.from("user_settings")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(`DB error: ${error.message}`);
	}

	return data;
};

export const updateUserSettings = async (
	userId: string,
	updates: {
		base_currency?: string;
		favorites?: string[];
	}
) => {
	const { data, error } = await supabase
		.from("user_settings")
		.update(updates)
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (error) {
		throw new Error(`DB error: ${error.message}`);
	}

	return data;
};