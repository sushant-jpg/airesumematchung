import type { UserRole } from "@hirematch/types";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: { userId: string; role: UserRole };
    }
  }
}
export {};
