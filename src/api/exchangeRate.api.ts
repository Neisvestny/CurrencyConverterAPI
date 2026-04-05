import axios from "axios";
import { StatusCodes } from "http-status-codes";

import { AppError } from "@/utils/AppError";

export const fetchCurrenciesFromApi = async (): Promise<string[]> => {
	try {
		const { data } = await axios.get(
			"https://open.er-api.com/v6/latest/USD",
			{ timeout: 10000 },
		);

		if (!data?.rates) {
			throw new AppError(
				StatusCodes.BAD_GATEWAY,
				"EXTERNAL_API_ERROR",
				"Invalid response from exchange rate API",
			);
		}

		return Object.keys(data.rates).sort();
	} catch (error: any) {
		throw new AppError(
			StatusCodes.SERVICE_UNAVAILABLE,
			"SERVICE_UNAVAILABLE",
			"Failed to fetch data from external API",
			{
				message: error.message,
			},
		);
	}
};

export const fetchRatesFromApi = async (base: string) => {
	try {
		const { data } = await axios.get(
			`https://open.er-api.com/v6/latest/${base}`,
			{ timeout: 10000 },
		);

		if (!data?.rates) {
			throw new AppError(
				StatusCodes.BAD_GATEWAY,
				"EXTERNAL_API_ERROR",
				"Invalid response from exchange rate API",
			);
		}

		return data.rates;
	} catch (error: any) {
		throw new AppError(
			StatusCodes.SERVICE_UNAVAILABLE,
			"SERVICE_UNAVAILABLE",
			"Failed to fetch exchange rates",
			{ message: error.message },
		);
	}
};
