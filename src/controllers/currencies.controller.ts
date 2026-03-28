import { Request, Response, NextFunction } from "express";
import { getCurrenciesService } from "../services/currencies.service";

export const getCurrencies = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const data = await getCurrenciesService({ userId: req.userId });
		res.json(data);
	} catch (err) {
		next(err);
	}
};
