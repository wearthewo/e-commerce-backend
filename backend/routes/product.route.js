import express from "express";
import { protectedRoutes } from "../../middleware/auth.middleware.js";
import { adminRoutes } from "../../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/product.controller.js";
import { getPublicProducts } from "../controllers/product.controller.js";
import { createProduct } from "../controllers/product.controller.js";
import { deleteProduct } from "../controllers/product.controller.js";
import { getTop3Products } from "../controllers/product.controller.js";
import { getProductsByCategory } from "../controllers/product.controller.js";
import { updateProduct } from "../controllers/product.controller.js";
import { getProductsSortedByPrice } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", protectedRoutes, adminRoutes, getAllProducts);
router.get("/public", getPublicProducts);
router.get("/top3products", getTop3Products);
router.get("/:category", getProductsByCategory);
router.get("/sortedProducts", getProductsSortedByPrice);
router.post("/", protectedRoutes, adminRoutes, createProduct);
router.put("/:id", protectedRoutes, adminRoutes, updateProduct);
router.delete("/:id", protectedRoutes, adminRoutes, deleteProduct);

export default router;
