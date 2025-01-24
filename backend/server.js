import express from "express";
import { configDotenv } from "dotenv";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./mongo_db/db.js";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/product.route.js";

configDotenv();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json()); // allows to parse the body of the reuest
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.listen(5000, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
