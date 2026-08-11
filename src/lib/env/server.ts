import "server-only";

export {
  getRequiredServerEnvValue,
  getServerEnv,
  validateTicketCredentialEncryptionKey,
} from "./validation";
export type { ServerEnv } from "./validation";
