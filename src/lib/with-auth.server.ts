import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { type Action, can, type Resource, type Role } from "@/lib/rbac";

export type ActionResult<T = unknown> =
    | { success: true; data: T }
    | { success: false; error: string };

async function getSessionInternal() {
    const request = getRequest();
    const session = await auth.api.getSession({
        headers: request.headers,
    });
    return session;
}

export const getSessionFn = createServerFn({ method: "GET" }).handler(
    async () => {
        return getSessionInternal();
    },
);

export async function getSession() {
    return getSessionInternal();
}

export async function requireAuth() {
    const session = await getSessionInternal();
    if (!session) {
        throw redirect({ to: "/login" });
    }
    return session;
}

export async function requireAccess(action: Action, resource: Resource) {
    const session = await requireAuth();
    const role = session.user.role as Role;
    if (!can(role, action, resource)) {
        throw new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }
    return session;
}

export async function requireAccessAction(
    action: Action,
    resource: Resource,
): Promise<
    | {
          success: true;
          session: NonNullable<Awaited<ReturnType<typeof getSessionInternal>>>;
      }
    | { success: false; error: string }
> {
    const session = await getSessionInternal();
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const role = session.user.role as Role;
    if (!can(role, action, resource)) {
        return { success: false, error: "Forbidden" };
    }
    return { success: true, session };
}

export async function requireAccessRSC(action: Action, resource: Resource) {
    const session = await getSessionInternal();
    if (!session?.user) throw redirect({ to: "/login" });
    const role = session.user.role as Role;
    if (!can(role, action, resource)) throw redirect({ to: "/" });
    return session;
}
