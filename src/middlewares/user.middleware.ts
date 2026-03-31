import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const isUUID = (id: string) =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		id,
	);

export const userMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		let userId = req.cookies["user_id"];

		if (!userId || !isUUID(userId)) {
			userId = crypto.randomUUID();

			res.cookie("user_id", userId, {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env["NODE_ENV"] === "production",
			});
		}

		const { error } = await supabase
			.from("user_settings")
			.upsert([{ user_id: userId }], {
				onConflict: "user_id",
			});

		if (error) {
			throw new Error(`Supabase error: ${error.message}`);
		}

		req.userId = userId;

		next();
	} catch (err) {
		next(err);
	}
};
