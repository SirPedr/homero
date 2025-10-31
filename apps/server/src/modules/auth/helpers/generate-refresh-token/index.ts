import { signJWT } from "../sign-jwt";

export const generateRefreshToken = (userID: string) =>
  signJWT({ type: "refresh", userID }, process.env.REFRESH_JWT_SECRET!, "7d");
