import { Request, Response, NextFunction } from "express";
import { getRatesService } from "../services/rates.service";

export const getRates = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { base, targets } = req.query;

		const params = {
			...(typeof base === "string" ? { base } : {}),
			...(typeof targets === "string" ? { targets } : {}),
			...(req.cookies["user_id"]
				? { userId: req.cookies["user_id"] }
				: {}),
		};

		const result = await getRatesService(params);

		res.json(result);
	} catch (err) {
		next(err);
	}
};
