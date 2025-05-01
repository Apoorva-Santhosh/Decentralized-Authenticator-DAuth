import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

export const hashPassword = (password) => {
  return keccak256(toUtf8Bytes(password));
};

