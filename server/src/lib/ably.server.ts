import * as Ably from "ably";

let ablyRest: Ably.Rest | null = null;

export function getAblyRest() {
	if (!process.env.ABLY_API_KEY) {
		throw new Error("ABLY_API_KEY is missing");
	}

	if (!ablyRest) {
		ablyRest = new Ably.Rest(process.env.ABLY_API_KEY);
	}

	return ablyRest;
}
