// utils/password.ts

import crypto from "crypto";

export function generateNewPassword() {
  // Generate a new password using random bytes
  return crypto.randomBytes(8).toString("hex");
}
