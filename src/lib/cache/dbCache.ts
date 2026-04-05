import { supabase } from "../supabase";
import { AppError } from "../../utils/AppError";
import { StatusCodes } from "http-status-codes";

const CURRENCIES_TTL = 60 * 60 * 1000; // 1 час

export const getCurrenciesFromDb = async (): Promise<string[] | null> => {
	const { data, error } = await supabase
		.from("currencies_cache")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to fetch currencies from database",
			{ message: error.message },
		);
	if (!data) return null;

	const isFresh =
		Date.now() - new Date(data.created_at).getTime() < CURRENCIES_TTL;
	return isFresh ? data.currencies : null;
};

export const saveCurrenciesToDb = async (
	currencies: string[],
): Promise<void> => {
	const { error } = await supabase
		.from("currencies_cache")
		.upsert({ currencies });

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to save currencies to database",
			{ message: error.message },
		);
};

const RATES_TTL = 24 * 60 * 60 * 1000; // 1 день

type RatesData = { base: string; rates: Record<string, number> };

export const getRatesFromDb = async (
	base: string,
	targets: string,
): Promise<RatesData | null> => {
	const { data, error } = await supabase
		.from("exchange_rates_cache")
		.select("*")
		.eq("base_currency", base)
		.eq("targets", targets)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to fetch rates from database",
			{ message: error.message },
		);
	if (!data) return null;

	const isFresh =
		Date.now() - new Date(data.created_at).getTime() < RATES_TTL;
	return isFresh ? { base: data.base_currency, rates: data.rates } : null;
};

export const saveRatesToDb = async (
	base: string,
	targets: string,
	rates: Record<string, number>,
): Promise<void> => {
	const { error } = await supabase
		.from("exchange_rates_cache")
		.upsert(
			{ base_currency: base, targets, rates },
			{ onConflict: "base_currency,targets" },
		);

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to save rates to database",
			{ message: error.message },
		);
};
