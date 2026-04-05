import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

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
			StatusCodes.BAD_REQUEST,
			ReasonPhrases.BAD_REQUEST,
			"Targets must be 3-letter currency codes (e.g. USD, EUR) or ALL",
		);
	}

	return validCurrencies.sort().join(",");
};

export const resolveTargets = (
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
