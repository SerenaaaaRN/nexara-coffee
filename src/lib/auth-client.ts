import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    resetPassword,
    changePassword,
    requestPasswordReset,
} = createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>()],
});
