import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export const isValidCurrency = (value: string): boolean =>
	/^[A-Z]{3}$/.test(value);

export const normalizeCurrency = (value: string): string => {
	const normalized = value.trim().toUpperCase();

	if (!isValidCurrency(normalized)) {
		throw new AppError(
			StatusCodes.BAD_REQUEST,
			ReasonPhrases.BAD_REQUEST,
			"Currency must be a 3-letter code (e.g. USD, EUR)",
		);
	}

	return normalized;
};
