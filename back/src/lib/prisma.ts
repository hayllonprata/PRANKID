import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { applyNormalizedDatabaseUrl } from "./database-url.js";

applyNormalizedDatabaseUrl();

export const prisma = new PrismaClient();
