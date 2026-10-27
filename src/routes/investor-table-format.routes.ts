import { Router } from "express";

import {
  getInvestorTableFormats,
  getInvestorTableFormatById,
  createInvestorTableFormat,
  updateInvestorTableFormat,
  deleteInvestorTableFormat,
  updateInvestorTableFormatStatus,

  getInvestorTableColumns,
  createInvestorTableColumn,
  updateInvestorTableColumn,
  deleteInvestorTableColumn,

  getInvestorTableFormatAssignments,
  createInvestorTableFormatAssignment,
  updateInvestorTableFormatAssignment,
  deleteInvestorTableFormatAssignment,
} from "../controllers/investor-table-format.controller";

import { authenticateJWT } from "../middleware/auth.middleware";
import { authorizeModule } from "../middleware/authorize";

const router = Router();

/**
 * |--------------------------------------------------------------------------
 * | TABLE FORMAT ASSIGNMENTS
 * |--------------------------------------------------------------------------
 */

/**
 * GET assignments
 *
 * Examples:
 * GET /api/investor/admin/table-formats/assignments
 * GET /api/investor/admin/table-formats/assignments?categoryId=1
 * GET /api/investor/admin/table-formats/assignments?subCategoryId=2
 * GET /api/investor/admin/table-formats/assignments?financialYearId=3
 * GET /api/investor/admin/table-formats/assignments?quarterId=4
 */
router.get(
  "/assignments",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  getInvestorTableFormatAssignments,
);


/**
 * CREATE assignment
 */
router.post(
  "/assignments",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  createInvestorTableFormatAssignment,
);

/**
 * UPDATE assignment
 */
router.put(
  "/assignments/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  updateInvestorTableFormatAssignment,
);

/**
 * DELETE assignment
 */
router.delete(
  "/assignments/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  deleteInvestorTableFormatAssignment,
);

/**
 * |--------------------------------------------------------------------------
 * | TABLE COLUMNS
 * |--------------------------------------------------------------------------
 */

/**
 * GET columns
 */
router.get(
  "/:tableFormatId/columns",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  getInvestorTableColumns,
);

/**
 * CREATE column
 */
router.post(
  "/:tableFormatId/columns",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  createInvestorTableColumn,
);

/**
 * UPDATE column
 */
router.put(
  "/columns/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  updateInvestorTableColumn,
);

/**
 * DELETE column
 */
router.delete(
  "/columns/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  deleteInvestorTableColumn,
);


/**
 * |--------------------------------------------------------------------------
 * | TABLE FORMATS
 * |--------------------------------------------------------------------------
 */

/**
 * GET all table formats
 */
router.get(
  "/",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  getInvestorTableFormats,
);

/**
 * GET single table format
 */
router.get(
  "/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  getInvestorTableFormatById,
);

/**
 * CREATE table format
 */
router.post(
  "/",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  createInvestorTableFormat,
);

/**
 * UPDATE table format
 */
router.put(
  "/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  updateInvestorTableFormat,
);

/**
 * DELETE table format
 */
router.delete(
  "/:id",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  deleteInvestorTableFormat,
);

/**
 * UPDATE table format status
 */
router.patch(
  "/:id/status",
  authenticateJWT,
  authorizeModule("investor-table-formats"),
  updateInvestorTableFormatStatus,
);

export default router;