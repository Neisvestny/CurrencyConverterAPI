import { Request, Response } from "express";
import { getUserById, updateUserSettings } from "../services/user.service";

export const getUserData = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const user = await getUserById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.json(user);
	} catch (err: any) {
		return res.status(500).json({
			error: err.message || "Internal server error",
		});
	}
};

export const updateUser = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const { base_currency, favorites } = req.body;

		const updates: any = {};

		if (base_currency !== undefined) {
			if (
				typeof base_currency !== "string" ||
				!/^[A-Z]{3}$/i.test(base_currency)
			) {
				return res
					.status(400)
					.json({ error: "Invalid base_currency format" });
			}
			updates.base_currency = base_currency.toUpperCase();
		}

		if (favorites !== undefined) {
			if (!Array.isArray(favorites)) {
				return res
					.status(400)
					.json({ error: "favorites must be an array" });
			}
			updates.favorites = favorites;
		}

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: "No valid fields to update" });
		}

		const updatedUser = await updateUserSettings(userId, updates);

		return res.json(updatedUser);
	} catch (err: any) {
		return res.status(500).json({
			error: err.message || "Internal server error",
		});
	}
};
