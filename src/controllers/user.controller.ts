import { Request, Response, NextFunction } from "express";
import { getUserById, updateUserSettings } from "../services/user.service";
import { AppError } from "../utils/AppError";

export const getUserData = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return next(
				new AppError(401, "UNAUTHORIZED", "User is not authenticated")
			);
		}

		const user = await getUserById(userId);

		return res.json(user);
	} catch (err) {
		next(err);
	}
};

export const updateUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return next(
				new AppError(401, "UNAUTHORIZED", "User is not authenticated")
			);
		}

		const { base_currency, favorites } = req.body;

		const updates: any = {};

		if (base_currency !== undefined) {
			if (
				typeof base_currency !== "string" ||
				!/^[A-Z]{3}$/i.test(base_currency)
			) {
				return next(
					new AppError(
						400,
						"INVALID_BASE_CURRENCY",
						"Base currency must be a valid 3-letter code",
						{ value: base_currency }
					)
				);
			}
			updates.base_currency = base_currency.toUpperCase();
		}

		if (favorites !== undefined) {
			if (!Array.isArray(favorites)) {
				return next(
					new AppError(
						400,
						"INVALID_FAVORITES",
						"Favorites must be an array of currency codes"
					)
				);
			}
			updates.favorites = favorites;
		}

		if (Object.keys(updates).length === 0) {
			return next(
				new AppError(
					400,
					"NO_VALID_FIELDS",
					"No valid fields provided for update"
				)
			);
		}

		const updatedUser = await updateUserSettings(userId, updates);

		return res.json(updatedUser);
	} catch (err) {
		next(err);
	}
};