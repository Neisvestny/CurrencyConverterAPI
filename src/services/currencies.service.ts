import axios from "axios";

let cache: string[] | null = null;
let lastFetch = 0;

const ONE_HOUR = 60 * 60 * 1000;

export const getCurrenciesService = async () => {
	const now = Date.now();

	if (cache && now - lastFetch < ONE_HOUR) {
		return cache;
	}

	const { data } = await axios.get("https://open.er-api.com/v6/latest/USD");

	const currencies = Object.keys(data.rates);

	cache = currencies;
	lastFetch = now;

	return currencies;
};
