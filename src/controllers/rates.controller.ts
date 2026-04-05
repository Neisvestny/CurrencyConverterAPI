import { Request, Response } from "express";
import { getRatesService } from "@/services/rates.service";

type RatesParams = {
	base?: string;
	targets?: string;
	userId?: string;
};

export const getRates = async (req: Request, res: Response) => {
	const { base, targets } = req.query;

	const params: RatesParams = {};

	if (typeof base === "string") {
		params.base = base;
	}

	if (typeof targets === "string") {
		params.targets = targets;
	}

	const userId = req.cookies["user_id"];
	if (userId) {
		params.userId = userId;
	}

	const result = await getRatesService(params);

	res.json(result);
};
