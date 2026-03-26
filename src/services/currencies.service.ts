import axios from "axios";

let cache: string[] | null = null;
let lastFetch = 0;

const ONE_HOUR = 60 * 60 * 1000;

export const getCurrenciesService = async () => {
	const now = Date.now();

	if (cache && now - lastFetch < ONE_HOUR) {
		return cache;
	}

	try {
		const { data } = await axios.get("https://open.er-api.com/v6/latest/USD", {
			timeout: 10000,
		});

		if (!data.rates) {
			throw new Error("Invalid response from exchange rate API");
		}

		const currencies = Object.keys(data.rates).sort();

		cache = currencies;
		lastFetch = now;

		return currencies;
	} catch (error) {
		if (cache) {
			return cache;
		}
		throw new Error(`Failed to fetch currencies`, {
			cause: error,
		});
	}
};