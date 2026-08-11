import "server-only";

import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "./better-auth";

export const authRouteHandlers = toNextJsHandler(auth);
