import { supabase } from "../lib/supabase";
import { AppError } from "../utils/AppError";

type UserSettings = {
	user_id: string;
	base_currency: string;
	favorites: string[];
	updated_at: string;
};

type CacheEntry = {
	data: UserSettings;
	timestamp: number;
};

const requestCache = new Map<string, CacheEntry>();

const FIVE_MIN = 5 * 60 * 1000;

const buildCacheKey = (userId: string) => `user_${userId}`;

const saveToMemoryCache = (key: string, data: UserSettings) => {
	requestCache.set(key, {
		data,
		timestamp: Date.now(),
	});
};

const getUserFromDb = async (userId: string): Promise<UserSettings> => {
	const { data, error } = await supabase
		.from("user_settings")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new AppError(500, "DATABASE_ERROR", "Failed to fetch user", {
			message: error.message,
		});
	}

	if (!data) {
		throw new AppError(404, "USER_NOT_FOUND", "User not found", { userId });
	}

	return data;
};

export const getUserById = async (userId: string) => {
	const cacheKey = buildCacheKey(userId);
	const cached = requestCache.get(cacheKey);

	if (cached) {
		const isExpired = Date.now() - cached.timestamp > FIVE_MIN;

		if (!isExpired) {
			return cached.data;
		}

		getUserFromDb(userId)
			.then((data) => saveToMemoryCache(cacheKey, data))
			.catch(() => {});

		return cached.data;
	}

	const data = await getUserFromDb(userId);
	saveToMemoryCache(cacheKey, data);
	return data;
};

const normalizeCurrency = (value: string): string => {
	const normalized = value.trim().toUpperCase();

	if (!/^[A-Z]{3}$/.test(normalized)) {
		throw new AppError(
			400,
			"INVALID_REQUEST",
			"Currency must be a 3-letter code (e.g. USD, EUR)"
		);
	}

	return normalized;
};

const normalizeFavorites = (favorites?: string[]): string[] | undefined => {
	if (!favorites) return undefined;

	const valid = favorites
		.map((f) => normalizeCurrency(f));

	return [...new Set(valid)];
};

export const updateUserSettings = async (
	userId: string,
	updates: {
		base_currency?: string;
		favorites?: string[];
	},
) => {
	const cacheKey = buildCacheKey(userId);

	const normalizedUpdates = {
		...(updates.base_currency && {
			base_currency: normalizeCurrency(updates.base_currency),
		}),
		...(updates.favorites && {
			favorites: normalizeFavorites(updates.favorites),
		}),
	};

	const { data, error } = await supabase
		.from("user_settings")
		.update({
			...normalizedUpdates,
			updated_at: new Date().toISOString(),
		})
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (error) {
		throw new AppError(
			500,
			"DATABASE_ERROR",
			"Failed to update user settings",
			{ message: error.message },
		);
	}

	if (!data) {
		throw new AppError(404, "USER_NOT_FOUND", "User not found", { userId });
	}

	saveToMemoryCache(cacheKey, data);

	return data;
};