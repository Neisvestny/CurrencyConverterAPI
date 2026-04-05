import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getUserById, updateUserSettings } from "@/services/user.service";
import { AppError } from "@/utils/AppError";

export const getUserData = async (req: Request, res: Response) => {
	const userId = req.userId;

	if (!userId) {
		throw new AppError(
			StatusCodes.UNAUTHORIZED,
			"UNAUTHORIZED",
			"User is not authenticated",
		);
	}

	const user = await getUserById(userId);
	res.json(user);
};

export const updateUser = async (req: Request, res: Response) => {
	const userId = req.userId;

	if (!userId) {
		throw new AppError(
			StatusCodes.UNAUTHORIZED,
			"UNAUTHORIZED",
			"User is not authenticated",
		);
	}

	const updatedUser = await updateUserSettings(userId, req.body);
	res.json(updatedUser);
};
