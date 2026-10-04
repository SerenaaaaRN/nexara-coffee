import { t } from "elysia";

export const notificationIdParams = t.Object({
	id: t.String({ minLength: 1 }),
});
