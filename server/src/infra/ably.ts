import { Rest } from "ably";

let instance: Rest | null = null;

export const getAblyRest = (): Rest => {
	if (!process.env.ABLY_API_KEY) {
		throw new Error(
			"ABLY_API_KEY environment variable is not set. " +
				"Required for Ably REST client initialization.",
		);
	}

	instance ??= new Rest(process.env.ABLY_API_KEY);
	return instance;
};
