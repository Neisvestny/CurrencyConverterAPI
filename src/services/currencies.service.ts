import axios from "axios";
import { supabase } from "../lib/supabase";

type CacheEntry = {
	data: string[];
	timestamp: number;
};

const requestCache = new Map<string, CacheEntry>();

const FIVE_MIN = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

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
	const { data } = await supabase
		.from("currencies_cache")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!data) return null;

	const isFresh = Date.now() - new Date(data.created_at).getTime() < ONE_DAY;

	return isFresh ? data.currencies : null;
};

const saveToDbCache = async (currencies: string[]) => {
	const { error } = await supabase.from("currencies_cache").upsert({
		currencies,
	});

	if (error) {
		throw new Error(`DB INSERT ERROR: ${error.message}`);
	}
};

const fetchCurrenciesFromApi = async (): Promise<string[]> => {
	const { data } = await axios.get("https://open.er-api.com/v6/latest/USD", {
		timeout: 10000,
	});

	if (!data.rates) {
		throw new Error("Invalid response from exchange rate API");
	}

	return Object.keys(data.rates).sort();
};

export const getCurrenciesService = async ({
	userId,
}: GetCurrenciesParams = {}) => {
	const cacheKey = buildCacheKey(userId);

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
	try {
		const currencies = await fetchCurrenciesFromApi();

		await saveToDbCache(currencies);
		saveToMemoryCache(cacheKey, currencies);

		return currencies;
	} catch (error) {
		const expiredCache = requestCache.get(cacheKey);
		if (expiredCache) return expiredCache.data;

		throw new Error("Failed to fetch currencies", {
			cause: error,
		});
	}
};
