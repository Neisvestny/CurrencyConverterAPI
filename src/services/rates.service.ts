import axios from "axios";
import { supabase } from "../lib/supabase";

interface GetRatesParams {
	base?: string;
	targets?: string;
	userId?: string;
}

export const getRatesService = async ({
	base,
	targets,
	userId,
}: GetRatesParams) => {
	let finalBase = base;

	if (!finalBase && userId) {
		const { data: userSettings, error } = await supabase
			.from("user_settings")
			.select("base_currency")
			.eq("user_id", userId)
			.maybeSingle();

		if (!error && userSettings?.base_currency) {
			finalBase = userSettings.base_currency;
		}
	}

	if (!finalBase) {
		finalBase = "USD";
	}

	try {
		const { data } = await axios.get(
			`https://open.er-api.com/v6/latest/${finalBase}`,
		);

		const rates = data.rates;

		const targetsArray = targets?.split(",") || [];

		if (targetsArray.length === 0) {
			return {
				base: finalBase,
				rates,
			};
		}

		const filteredRates: Record<string, number> = {};

		for (const currency of targetsArray) {
			const trimmedCurrency = currency.trim().toUpperCase();
			if (rates[trimmedCurrency]) {
				filteredRates[trimmedCurrency] = rates[trimmedCurrency];
			}
		}

		return {
			base: finalBase,
			rates: filteredRates,
		};
	} catch (error: any) {
		throw new Error("Failed to fetch rates", {
			cause: error,
		});
	}
};
