import axios from "axios";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";

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

const getUserSettings = async (userId?: string) => {
	if (!userId) return null;

	const { data, error } = await supabase
		.from("user_settings")
		.select("base_currency, favorites")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to fetch user settings",
			{ message: error.message },
		);
	}

	return data;
};

const resolveBaseCurrency = (
	base: string | undefined,
	userSettings: any,
): string => {
	const normalizedBase = normalizeBase(base);
	if (normalizedBase) return normalizedBase;

	if (userSettings?.base_currency) {
		return userSettings.base_currency;
	}

	return "USD";
};

const resolveTargets = (
	targets: string | undefined,
	userSettings: any,
): string => {
	if (targets) {
		return normalizeTargets(targets);
	}

	if (userSettings?.favorites?.length > 0) {
		return userSettings.favorites
			.map((t: string) => t.trim().toUpperCase())
			.filter((t: string) => /^[A-Z]{3}$/.test(t))
			.sort()
			.join(",");
	}

	return "ALL";
};

const normalizeBase = (base?: string): string | undefined => {
	if (!base) return undefined;

	const normalized = base.trim().toUpperCase();

	if (!/^[A-Z]{3}$/.test(normalized)) {
		throw new AppError(
			400,
			"INVALID_REQUEST",
			"Base must be a 3-letter currency code (e.g. USD, EUR)",
		);
	}

	return normalized;
};

const normalizeTargets = (targets?: string): string => {
	if (!targets) return "ALL";

	const normalized = targets.trim().toUpperCase();

	if (normalized === "ALL") {
		return "ALL";
	}

	const validCurrencies = normalized
		.split(",")
		.map((t) => t.trim())
		.filter((t) => /^[A-Z]{3}$/.test(t));

	if (validCurrencies.length === 0) {
		throw new AppError(
			400,
			"INVALID_REQUEST",
			"Targets must be 3-letter currency codes (e.g. USD, EUR) or ALL",
		);
	}

	return validCurrencies.sort().join(",");
};

const buildCacheKey = (
	userId: string | undefined,
	base: string,
	targets: string,
) => `${userId || "guest"}_${base}_${targets}`;

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
	const { data, error } = await supabase
		.from("exchange_rates_cache")
		.select("*")
		.eq("base_currency", base)
		.eq("targets", targets)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to fetch rates from database",
			{ message: error.message },
		);
	}

	if (!data) return null;

	const isFresh = Date.now() - new Date(data.created_at).getTime() < ONE_DAY;

	return isFresh ? { base: data.base_currency, rates: data.rates } : null;
};

const saveToDbCache = async (base: string, targets: string, response: any) => {
	const { error } = await supabase.from("exchange_rates_cache").upsert(
		{
			base_currency: base,
			targets,
			rates: response.rates,
		},
		{
			onConflict: "base_currency,targets",
		},
	);

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to save rates to database",
			{ message: error.message },
		);
	}
};

const fetchRatesFromApi = async (base: string) => {
	try {
		const { data } = await axios.get(
			`https://open.er-api.com/v6/latest/${base}`,
			{ timeout: 10000 },
		);

		if (!data?.rates) {
			throw new AppError(
				502,
				"EXTERNAL_API_ERROR",
				"Invalid response from exchange rate API",
			);
		}

		return data.rates;
	} catch (error: any) {
		throw new AppError(
			503,
			"SERVICE_UNAVAILABLE",
			"Failed to fetch exchange rates",
			{ message: error.message },
		);
	}
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
	try {
		const userSettings = await getUserSettings(userId);

		const finalBase = resolveBaseCurrency(base, userSettings);
		const normalizedTargets = resolveTargets(targets, userSettings);
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
	} catch (error: any) {
		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(
			500,
			"INTERNAL_ERROR",
			"Failed to get exchange rates",
			{ message: error.message },
		);
	}
};
