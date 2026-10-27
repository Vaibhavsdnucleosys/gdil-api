import { Router } from "express";

import { authenticateJWT } from "../middleware/auth.middleware";
import { authorizeModule } from "../middleware/authorize";

/*
|--------------------------------------------------------------------------
| CATEGORY CONTROLLER
|--------------------------------------------------------------------------
*/

import {
  getInvestorCategories,
  createInvestorCategory,
  updateInvestorCategory,
  deleteInvestorCategory,
} from "../controllers/investor-category.controller";

/*
|--------------------------------------------------------------------------
| FINANCIAL YEAR CONTROLLER
|--------------------------------------------------------------------------
*/

import {
  getInvestorFinancialYears,
  getInvestorFinancialYearsByCategory,
  getInvestorFinancialYearsBySubCategory,
  getInvestorFinancialYearById,
  createInvestorFinancialYear,
  updateInvestorFinancialYear,
  deleteInvestorFinancialYear,
  updateInvestorFinancialYearStatus,
} from "../controllers/investor-financial-year.controller";

/*
|--------------------------------------------------------------------------
| QUARTER CONTROLLER
|--------------------------------------------------------------------------
*/

import {
  getInvestorQuarters,
  getAdminInvestorQuarters,
  getInvestorQuarterById,
  createInvestorQuarter,
  updateInvestorQuarter,
  deleteInvestorQuarter,
  updateInvestorQuarterStatus,
} from "../controllers/investor-quarter.controller";
/*
|--------------------------------------------------------------------------
| DOCUMENT CONTROLLER
|--------------------------------------------------------------------------
*/

import {
  getInvestorDocuments,
  getAnnualReports,
  getInvestorDocumentById,
  createInvestorDocument,
  updateInvestorDocument,
  deleteInvestorDocument,
} from "../controllers/investor-document.controller";
import {
  resolvePublicInvestorTableFormat,
} from "../controllers/investor-public-table-format.controller";

const router = Router();

/*
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
| PUBLIC CATEGORY APIs
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /api/investor/categories:
 *   get:
 *     summary: Get active investor categories
 *     tags:
 *       - Investor Relations
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/categories",
  getInvestorCategories,
);

/*
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
| ADMIN CATEGORY APIs
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /api/investor/admin/categories:
 *   get:
 *     summary: Get all investor categories
 *     description: Returns both active and inactive investor categories.
 *     tags:
 *       - Investor Relations
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/categories",
  authenticateJWT,
  authorizeModule("categories"),
  getInvestorCategories,
);

/**
 * @swagger
 * /api/investor/admin/categories:
 *   post:
 *     summary: Create investor category
 *     tags:
 *       - Investor Relations
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/categories",
  authenticateJWT,
  authorizeModule("categories"),
  createInvestorCategory,
);

/**
 * @swagger
 * /api/investor/categories/{id}:
 *   put:
 *     summary: Update investor category
 *     tags:
 *       - Investor Relations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put(
  "/admin/categories/:id",
  authenticateJWT,
  authorizeModule("categories"),
  updateInvestorCategory,
);


/**
 * @swagger
 * /api/investor/categories/{id}:
 *   delete:
 *     summary: Delete investor category
 *     tags:
 *       - Investor Relations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete(
  "/admin/categories/:id",
  authenticateJWT,
  authorizeModule("categories"),
  deleteInvestorCategory,
);
/*
|--------------------------------------------------------------------------
| INVESTOR FINANCIAL YEAR
|--------------------------------------------------------------------------
*/

/**
 * Public - Get all financial years
 *
 * Optional:
 * ?categoryId=1
 * ?subCategoryId=2
 */
router.get(
  "/financial-years",
  getInvestorFinancialYears,
);
router.get(
  "/admin/financial-years",
  authenticateJWT,
  authorizeModule("financial-years"),
  getInvestorFinancialYears,
);

/**
 * Public - Get financial years by category
 */
router.get(
  "/financial-years/category/:categoryId",
  getInvestorFinancialYearsByCategory,
);


/**
 * Public - Get financial years by subcategory
 */
router.get(
  "/financial-years/subcategory/:subCategoryId",
  getInvestorFinancialYearsBySubCategory,
);


/**
 * Public - Get single financial year
 */
router.get(
  "/financial-years/:id",
  getInvestorFinancialYearById,
);


/*
|--------------------------------------------------------------------------
| ADMIN FINANCIAL YEAR
|--------------------------------------------------------------------------
*/

/**
 * Admin - Create financial year
 *
 * Directly under category:
 * {
 *   categoryId: 1,
 *   subCategoryId: null,
 *   year: "2025-26"
 * }
 *
 * Under subcategory:
 * {
 *   categoryId: 1,
 *   subCategoryId: 2,
 *   year: "2025-26"
 * }
 */
router.post(
  "/admin/financial-years",
  authenticateJWT,
  authorizeModule("financial-years"),
  createInvestorFinancialYear,
);


/**
 * Admin - Update financial year
 */
router.put(
  "/admin/financial-years/:id",
  authenticateJWT,
  authorizeModule("financial-years"),
  updateInvestorFinancialYear,
);


/**
 * Admin - Delete financial year
 */
router.delete(
  "/admin/financial-years/:id",
  authenticateJWT,
  authorizeModule("financial-years"),
  deleteInvestorFinancialYear,
);


/**
 * |--------------------------------------------------------------------------
 * | ADMIN FINANCIAL YEAR STATUS
 * |--------------------------------------------------------------------------
 */

/**
 * Admin - Activate / Deactivate financial year
 */
router.patch(
  "/admin/financial-years/:id/status",
  authenticateJWT,
  authorizeModule("financial-years"),
  updateInvestorFinancialYearStatus,
);


/*
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
| PUBLIC QUARTER APIs
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
*/

/**
 * Get active investor quarters
 *
 * GET /api/investor/quarters
 *
 * Optional:
 * GET /api/investor/quarters?financialYearId=1
 */
router.get(
  "/quarters",
  getInvestorQuarters,
);

/**
 * Get single quarter
 *
 * GET /api/investor/quarters/:id
 */
router.get(
  "/quarters/:id",
  getInvestorQuarterById,
);


/*
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
| ADMIN QUARTER APIs
|--------------------------------------------------------------------------
|--------------------------------------------------------------------------
*/

/**
 * Get all investor quarters
 *
 * GET /api/investor/admin/quarters
 *
 * Optional:
 * GET /api/investor/admin/quarters?financialYearId=1
 */
router.get(
  "/admin/quarters",
  authenticateJWT,
  authorizeModule("quarters"),
  getAdminInvestorQuarters,
);

/**
 * Create investor quarter
 *
 * POST /api/investor/admin/quarters
 */
router.post(
  "/admin/quarters",
  authenticateJWT,
  authorizeModule("quarters"),
  createInvestorQuarter,
);

/**
 * Update investor quarter
 *
 * PUT /api/investor/admin/quarters/:id
 */
router.put(
  "/admin/quarters/:id",
  authenticateJWT,
  authorizeModule("quarters"),
  updateInvestorQuarter,
);

/**
 * Delete investor quarter
 *
 * DELETE /api/investor/admin/quarters/:id
 */
router.delete(
  "/admin/quarters/:id",
  authenticateJWT,
  authorizeModule("quarters"),
  deleteInvestorQuarter,
);

/**
 * Activate / Deactivate investor quarter
 *
 * PATCH /api/investor/admin/quarters/:id/status
 */
router.patch(
  "/admin/quarters/:id/status",
  authenticateJWT,
  authorizeModule("quarters"),
  updateInvestorQuarterStatus,
);

/**
 * Public - Resolve Investor Table Format
 *
 * Example:
 * GET /api/investor/table-formats/resolve
 *     ?categoryId=1
 *     &subCategoryId=2
 *     &financialYearId=3
 *     &quarterId=4
 */
router.get(
  "/table-formats/resolve",
  resolvePublicInvestorTableFormat,
);
router.get(
  "/documents",
  getInvestorDocuments,
);

router.get(
  "/annual-reports",
  getAnnualReports,
);

router.get(
  "/documents/:id",
  getInvestorDocumentById,
);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/documents",
  authenticateJWT,
  authorizeModule("documents"),
  getInvestorDocuments,
);

router.post(
  "/admin/documents",
  authenticateJWT,
  authorizeModule("documents"),
  createInvestorDocument,
);

router.put(
  "/admin/documents/:id",
  authenticateJWT,
  authorizeModule("documents"),
  updateInvestorDocument,
);

router.delete(
  "/admin/documents/:id",
  authenticateJWT,
  authorizeModule("documents"),
  deleteInvestorDocument,
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

export default router;