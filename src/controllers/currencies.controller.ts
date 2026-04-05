import { Request, Response } from "express";
import { getCurrenciesService } from "@/services/currencies.service";

export const getCurrencies = async (req: Request, res: Response) => {
	const params = req.userId ? { userId: req.userId } : {};

	const data = await getCurrenciesService(params);
	res.json(data);
};
