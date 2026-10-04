import { t } from "elysia";

export const mapsQuery = t.Object({
  branch: t.Optional(t.String()),
});
