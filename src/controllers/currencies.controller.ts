import { Request, Response } from "express";
import { getCurrenciesService } from "../services/currencies.service";

export const getCurrencies = async (req: Request, res: Response) => {
	const data = await getCurrenciesService();
	res.json(data);
};
