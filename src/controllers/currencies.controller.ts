import { Request, Response, NextFunction } from "express";
import { getCurrenciesService } from "../services/currencies.service";

export const getCurrencies = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const params = req.userId ? { userId: req.userId } : {};

		const data = await getCurrenciesService(params);
		res.json(data);
	} catch (err) {
		next(err);
	}
};
