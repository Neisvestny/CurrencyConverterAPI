import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
	statusCode: StatusCodes;
	code: string;
	details?: any;

	constructor(
		statusCode: StatusCodes,
		code: string,
		message: string,
		details?: any,
	) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}
