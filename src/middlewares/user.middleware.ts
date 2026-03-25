import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const userMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.cookies.user_id) {
		const newUserId = uuidv4();

		res.cookie("user_id", newUserId, {
			httpOnly: true,
			sameSite: "lax",
		});

		req.cookies.user_id = newUserId;
	}

	next();
};
