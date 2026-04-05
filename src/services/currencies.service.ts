import { fetchCurrenciesFromApi } from "@/api/exchangeRate.api";
import { MemoryCache } from "@/lib/cache/memoryCache";
import { getCurrenciesFromDb, saveCurrenciesToDb } from "@/lib/cache/dbCache";
import { AppError } from "@/utils/AppError";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const FIVE_MIN = 5 * 60 * 1000;
const memoryCache = new MemoryCache<string[]>(FIVE_MIN);

const buildCacheKey = (userId?: string) => `${userId ?? "guest"}_currencies`;

export const getCurrenciesService = async ({
	userId,
}: { userId?: string } = {}) => {
	const cacheKey = buildCacheKey(userId);

	try {
		const memoryData = memoryCache.get(cacheKey);
		if (memoryData) return memoryData;

		const dbData = await getCurrenciesFromDb();
		if (dbData) {
			memoryCache.set(cacheKey, dbData);
			return dbData;
		}

		const currencies = await fetchCurrenciesFromApi();
		await saveCurrenciesToDb(currencies);
		memoryCache.set(cacheKey, currencies);

		return currencies;
	} catch (error: any) {
		// stale fallback — лучше отдать устаревшее, чем ничего
		const stale = memoryCache.get(cacheKey);
		if (stale) return stale;

		if (error instanceof AppError) throw error;

		throw new AppError(
			StatusCodes.INTERNAL_SERVER_ERROR,
			ReasonPhrases.INTERNAL_SERVER_ERROR,
			"Failed to fetch currencies",
			{ message: error.message },
		);
	}
};
