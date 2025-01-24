import Redis from "ioredis";
import { configDotenv } from "dotenv";

configDotenv();

export const redis = new Redis(process.env.REDIS);
//await redis.set("foo", "bar");
