import { Router } from "express";

import {
  getInvestorSubCategories,
  getInvestorSubCategoriesByCategory,
  getInvestorSubCategoryById,
  createInvestorSubCategory,
  updateInvestorSubCategory,
  deleteInvestorSubCategory,
  updateInvestorSubCategoryStatus,
} from "../controllers/investor-subcategory.controller";

import { authenticateJWT } from "../middleware/auth.middleware";
import { authorizeModule } from "../middleware/authorize";

const router = Router();

/**
 * Public
 */
router.get(
  "/",
  getInvestorSubCategories,
);

/**
 * Public - by category
 */
router.get(
  "/category/:categoryId",
  getInvestorSubCategoriesByCategory,
);

/**
 * Get single
 */
router.get(
  "/:id",
  getInvestorSubCategoryById,
);

/**
 * Admin - create
 */
router.post(
  "/",
  authenticateJWT,
  authorizeModule("subcategories"),
  createInvestorSubCategory,
);

/**
 * Admin - update
 */
router.put(
  "/:id",
  authenticateJWT,
  authorizeModule("subcategories"),
  updateInvestorSubCategory,
);

/**
 * Admin - delete
 */
router.delete(
  "/:id",
  authenticateJWT,
  authorizeModule("subcategories"),
  deleteInvestorSubCategory,
);

/**
 * Admin - status
 */
router.patch(
  "/:id/status",
  authenticateJWT,
  authorizeModule("subcategories"),
  updateInvestorSubCategoryStatus,
);

export default router;