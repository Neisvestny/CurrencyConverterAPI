import { Request, Response, NextFunction } from "express";
import { getUserById, updateUserSettings } from "../services/user.service";
import { AppError } from "../utils/AppError";

export const getUserData = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return next(
				new AppError(401, "UNAUTHORIZED", "User is not authenticated"),
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
	next: NextFunction,
) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return next(
				new AppError(401, "UNAUTHORIZED", "User is not authenticated"),
			);
		}

		const updatedUser = await updateUserSettings(userId, req.body);

		return res.json(updatedUser);
	} catch (err) {
		next(err);
	}
};
