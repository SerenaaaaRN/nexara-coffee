import { app } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
app.listen(port);

console.log(`🦊 Nexara API running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 OpenAPI docs at http://${app.server?.hostname}:${app.server?.port}/openapi`);
