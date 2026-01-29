import { compare, hash } from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 10);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await compare(password, hashedPassword);
};
