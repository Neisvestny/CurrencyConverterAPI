import axios from "axios";

export const getRatesService = async ({
	base,
	targets,
	userId,
}: {
	base?: string;
	targets?: string;
	userId?: string;
}) => {
	const finalBase = base || "USD";

	const { data } = await axios.get(
		`https://open.er-api.com/v6/latest/${finalBase}`,
	);

	const rates = data.rates;

	const targetsArray = targets?.split(",") || [];

	if (targetsArray.length === 0) {
		return {
			base: finalBase,
			rates,
		};
	}

	const filteredRates: Record<string, number> = {};

	for (const currency of targetsArray) {
		if (rates[currency]) {
			filteredRates[currency] = rates[currency];
		}
	}

	return {
		base: finalBase,
		rates: filteredRates,
	};
};
