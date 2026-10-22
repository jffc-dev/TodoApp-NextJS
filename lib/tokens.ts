import { randomInt } from "node:crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) para que el link sea fácil de leer.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateToken(length = 12) {
  let token = "";
  for (let i = 0; i < length; i++) token += ALPHABET[randomInt(ALPHABET.length)];
  return token;
}
