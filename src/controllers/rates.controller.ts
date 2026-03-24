import { Request, Response } from "express";
import { getRatesService } from "../services/rates.service";

export const getRates = async (req: Request, res: Response) => {
	const { base, targets } = req.query;

	const result = await getRatesService({
		base: base as string | undefined,
		targets: targets as string | undefined,
		userId: req.cookies.user_id,
	});

	res.json(result);
};
