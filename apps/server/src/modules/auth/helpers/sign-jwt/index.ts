import { type JWTPayload, SignJWT } from "jose";

export const signJWT = async (
  payload: JWTPayload,
  key: string,
  expiration: string = "15m"
) => {
  const secret = new TextEncoder().encode(key);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);
};
