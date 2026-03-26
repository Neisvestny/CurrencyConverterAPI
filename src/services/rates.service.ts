import axios from "axios";
import { supabase } from "../lib/supabase";

type CacheEntry = {
	data: any;
	timestamp: number;
};

const requestCache = new Map<string, CacheEntry>();

const FIVE_MIN = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

interface GetRatesParams {
	base?: string;
	targets?: string;
	userId?: string;
}

const resolveBaseCurrency = async (
	base?: string,
	userId?: string,
): Promise<string> => {
	if (base) return base;

	if (userId) {
		const { data } = await supabase
			.from("user_settings")
			.select("base_currency")
			.eq("user_id", userId)
			.maybeSingle();

		if (data?.base_currency) {
			return data.base_currency;
		}
	}

	return "USD";
};

const normalizeTargets = (targets?: string): string => {
	if (!targets) return "ALL";

	return targets
		.split(",")
		.map((t) => t.trim().toUpperCase())
		.sort()
		.join(",");
};

const buildCacheKey = (
	userId: string | undefined,
	base: string,
	targets: string,
) => `${userId}_${base}_${targets}`;

const getFromMemoryCache = (key: string) => {
	const cached = requestCache.get(key);

	if (cached && Date.now() - cached.timestamp < FIVE_MIN) {
		return cached.data;
	}

	return null;
};

const saveToMemoryCache = (key: string, data: any) => {
	requestCache.set(key, {
		data,
		timestamp: Date.now(),
	});
};

const getFromDbCache = async (base: string, targets: string) => {
	const { data } = await supabase
		.from("exchange_rates_cache")
		.select("*")
		.eq("base_currency", base)
		.eq("targets", targets)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!data) return null;

	const isFresh = Date.now() - new Date(data.created_at).getTime() < ONE_DAY;
	return isFresh ? { base: data.base_currency, rates: data.rates } : null;
};

const saveToDbCache = async (base: string, targets: string, response: any) => {
	const { data, error } = await supabase.from("exchange_rates_cache").upsert({
		base_currency: base,
		targets,
		rates: response.rates,
	});

	if (error) throw Error(`DB INSERT ERROR: ${error.message}`);
};

const fetchRatesFromApi = async (base: string) => {
	const { data } = await axios.get(
		`https://open.er-api.com/v6/latest/${base}`,
	);

	return data.rates;
};

const filterRates = (
	rates: Record<string, number>,
	base: string,
	targets: string,
) => {
	if (targets === "ALL") {
		return { base, rates };
	}

	const filtered: Record<string, number> = {};

	for (const currency of targets.split(",")) {
		if (rates[currency]) {
			filtered[currency] = rates[currency];
		}
	}

	return { base, rates: filtered };
};

export const getRatesService = async ({
	base,
	targets,
	userId,
}: GetRatesParams) => {
	const finalBase = await resolveBaseCurrency(base, userId);
	const normalizedTargets = normalizeTargets(targets);
	const cacheKey = buildCacheKey(userId, finalBase, normalizedTargets);

	// memory cache
	const memoryData = getFromMemoryCache(cacheKey);
	if (memoryData) return memoryData;

	// db cache
	const dbData = await getFromDbCache(finalBase, normalizedTargets);
	if (dbData) {
		saveToMemoryCache(cacheKey, dbData);
		return dbData;
	}

	// api
	const rates = await fetchRatesFromApi(finalBase);
	const result = filterRates(rates, finalBase, normalizedTargets);

	// save caches
	await saveToDbCache(finalBase, normalizedTargets, result);
	saveToMemoryCache(cacheKey, result);

	return result;
};
