import axios from "axios";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";

type CacheEntry = {
	data: string[];
	timestamp: number;
};

const requestCache = new Map<string, CacheEntry>();

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 24 * 60 * 60 * 1000;

interface GetCurrenciesParams {
	userId?: string;
}

const buildCacheKey = (userId?: string) => `${userId || "guest"}_currencies`;

const getFromMemoryCache = (key: string) => {
	const cached = requestCache.get(key);

	if (cached && Date.now() - cached.timestamp < FIVE_MIN) {
		return cached.data;
	}

	return null;
};

const saveToMemoryCache = (key: string, data: string[]) => {
	requestCache.set(key, {
		data,
		timestamp: Date.now(),
	});
};

const getFromDbCache = async () => {
	const { data, error } = await supabase
		.from("currencies_cache")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to fetch currencies from database",
			{ message: error.message },
		);
	}

	if (!data) return null;

	const isFresh = Date.now() - new Date(data.created_at).getTime() < ONE_HOUR;

	return isFresh ? data.currencies : null;
};

const saveToDbCache = async (currencies: string[]) => {
	const { error } = await supabase.from("currencies_cache").upsert({
		currencies,
	});

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to save currencies to database",
			{ message: error.message },
		);
	}
};

const fetchCurrenciesFromApi = async (): Promise<string[]> => {
	try {
		const { data } = await axios.get(
			"https://open.er-api.com/v6/latest/USD",
			{ timeout: 10000 },
		);

		if (!data?.rates) {
			throw new AppError(
				502,
				"EXTERNAL_API_ERROR",
				"Invalid response from exchange rate API",
			);
		}

		return Object.keys(data.rates).sort();
	} catch (error: any) {
		throw new AppError(
			503,
			"SERVICE_UNAVAILABLE",
			"Failed to fetch data from external API",
			{
				message: error.message,
			},
		);
	}
};

export const getCurrenciesService = async ({
	userId,
}: GetCurrenciesParams = {}) => {
	const cacheKey = buildCacheKey(userId);

	try {
		// memory cache
		const memoryData = getFromMemoryCache(cacheKey);
		if (memoryData) return memoryData;

		// db cache
		const dbData = await getFromDbCache();
		if (dbData) {
			saveToMemoryCache(cacheKey, dbData);
			return dbData;
		}

		// api
		const currencies = await fetchCurrenciesFromApi();

		await saveToDbCache(currencies);
		saveToMemoryCache(cacheKey, currencies);

		return currencies;
	} catch (error: any) {
		const expiredCache = requestCache.get(cacheKey);
		if (expiredCache) return expiredCache.data;

		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(
			500,
			"INTERNAL_ERROR",
			"Failed to fetch currencies",
			{
				message: error.message,
			},
		);
	}
};
