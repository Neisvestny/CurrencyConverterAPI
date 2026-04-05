import { supabase } from "@/lib/supabase";
import { MemoryCache } from "@/lib/cache/memoryCache";
import { AppError } from "@/utils/AppError";
import { normalizeCurrency } from "@/utils/currency"; // ← больше не дублируем
import { StatusCodes } from "http-status-codes";

type UserSettings = {
	user_id: string;
	base_currency: string;
	favorites: string[];
	updated_at: string;
};

type UpdateUserSettingsInput = {
	base_currency?: string;
	favorites?: string[];
};

const FIVE_MIN = 5 * 60 * 1000;
const memoryCache = new MemoryCache<UserSettings>(FIVE_MIN);
const buildCacheKey = (userId: string) => `user_${userId}`;

const getUserFromDb = async (userId: string): Promise<UserSettings> => {
	const { data, error } = await supabase
		.from("user_settings")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to fetch user",
			{
				message: error.message,
			},
		);
	if (!data)
		throw new AppError(
			StatusCodes.NOT_FOUND,
			"USER_NOT_FOUND",
			"User not found",
			{ userId },
		);

	return data;
};

export const getUserById = async (userId: string): Promise<UserSettings> => {
	const cacheKey = buildCacheKey(userId);
	const cached = memoryCache.get(cacheKey);

	if (cached) {
		// stale-while-revalidate: отдаём сразу, обновляем в фоне
		getUserFromDb(userId)
			.then((data) => memoryCache.set(cacheKey, data))
			.catch(() => {});

		return cached;
	}

	const data = await getUserFromDb(userId);
	memoryCache.set(cacheKey, data);
	return data;
};

const normalizeFavorites = (favorites: string[]): string[] => [
	...new Set(favorites.map(normalizeCurrency)),
];

export const updateUserSettings = async (
	userId: string,
	updates: UpdateUserSettingsInput,
): Promise<UserSettings> => {
	if (!updates || typeof updates !== "object") {
		throw new AppError(
			StatusCodes.BAD_REQUEST,
			"INVALID_BODY",
			"Invalid request body",
		);
	}

	const normalized: Partial<UpdateUserSettingsInput> = {};

	if (updates.base_currency !== undefined) {
		normalized.base_currency = normalizeCurrency(updates.base_currency);
	}

	if (updates.favorites !== undefined) {
		if (!Array.isArray(updates.favorites)) {
			throw new AppError(
				StatusCodes.BAD_REQUEST,
				"INVALID_FAVORITES",
				"Favorites must be an array",
			);
		}
		normalized.favorites = normalizeFavorites(updates.favorites);
	}

	if (Object.keys(normalized).length === 0) {
		throw new AppError(
			StatusCodes.BAD_REQUEST,
			"NO_VALID_FIELDS",
			"No valid fields provided",
		);
	}

	const { data, error } = await supabase
		.from("user_settings")
		.update({ ...normalized, updated_at: new Date().toISOString() })
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (error)
		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			"DATABASE_ERROR",
			"Failed to update user settings",
			{ message: error.message },
		);
	if (!data)
		throw new AppError(
			StatusCodes.NOT_FOUND,
			"USER_NOT_FOUND",
			"User not found",
			{ userId },
		);

	memoryCache.set(buildCacheKey(userId), data);
	return data;
};
