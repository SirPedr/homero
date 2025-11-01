import type { NodePgDatabase } from "@homero/db";
import type Elysia from "elysia";
import * as schema from "@homero/db/schema";

type AppDB = NodePgDatabase<typeof schema>;
type HandlerParams = {
  db: AppDB;
};

export const createRouteHandler = (
  handler: (params: HandlerParams) => Elysia
) => {
  return (params: HandlerParams) => handler(params);
};
