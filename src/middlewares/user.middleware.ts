import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

export const userMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		let userId = req.cookies?.user_id;

		if (!userId) {
			userId = uuidv4();

			res.cookie("user_id", userId, {
				httpOnly: true,
				sameSite: "lax",
				secure: true,
			});
		}

		const { error } = await supabase
			.from("user_settings")
			.upsert([{ user_id: userId }], { onConflict: "user_id" });

		if (error) {
			throw new Error(`Supabase error: ${error.message}`);
		}

		req.userId = userId;

		next();
	} catch (err) {
		next(err);
	}
};
