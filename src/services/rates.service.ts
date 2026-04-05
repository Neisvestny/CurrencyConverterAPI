import { fetchRatesFromApi } from "@/api/exchangeRate.api";
import { MemoryCache } from "@/lib/cache/memoryCache";
import { getRatesFromDb, saveRatesToDb } from "@/lib/cache/dbCache";
import { supabase } from "@/lib/supabase";
import { AppError } from "@/utils/AppError";
import { normalizeCurrency } from "@/utils/currency";
import { resolveTargets } from "@/utils/targets";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const FIVE_MIN = 5 * 60 * 1000;
const memoryCache = new MemoryCache<{
	base: string;
	rates: Record<string, number>;
}>(FIVE_MIN);

interface GetRatesParams {
	base?: string;
	targets?: string;
	userId?: string;
}

const getUserSettings = async (userId?: string) => {
	if (!userId) return null;

	const { data, error } = await supabase
		.from("user_settings")
		.select("base_currency, favorites")
		.eq("user_id", userId)
		.maybeSingle();

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to fetch user settings",
			{ message: error.message },
		);

	return data;
};

const resolveBase = (base: string | undefined, userSettings: any): string => {
	if (base) return normalizeCurrency(base); // бросит AppError если невалидно
	return userSettings?.base_currency ?? "USD";
};

const filterRates = (
	rates: Record<string, number>,
	base: string,
	targets: string,
): { base: string; rates: Record<string, number> } => {
	if (targets === "ALL") return { base, rates };

	const filtered: Record<string, number> = {};

	for (const c of targets.split(",")) {
		const value = rates[c];
		if (value !== undefined) {
			filtered[c] = value;
		}
	}

	return { base, rates: filtered };
};

export const getRatesService = async ({
	base,
	targets,
	userId,
}: GetRatesParams) => {
	try {
		const userSettings = await getUserSettings(userId);
		const finalBase = resolveBase(base, userSettings);
		const normalizedTargets = resolveTargets(targets, userSettings);
		const cacheKey = `${userId ?? "guest"}_${finalBase}_${normalizedTargets}`;

		const memoryData = memoryCache.get(cacheKey);
		if (memoryData) return memoryData;

		const dbData = await getRatesFromDb(finalBase, normalizedTargets);
		if (dbData) {
			memoryCache.set(cacheKey, dbData);
			return dbData;
		}

		const rates = await fetchRatesFromApi(finalBase);
		const result = filterRates(rates, finalBase, normalizedTargets);

		await saveRatesToDb(finalBase, normalizedTargets, result.rates);
		memoryCache.set(cacheKey, result);

		return result;
	} catch (error: any) {
		if (error instanceof AppError) throw error;
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			ReasonPhrases.INTERNAL_SERVER_ERROR,
			"Failed to get exchange rates",
			{ message: error.message },
		);
	}
};
