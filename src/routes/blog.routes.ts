import { Router } from "express";

import {
  getBlogs,
  getBlogBySlug,
  getBlogsByType,

  getAdminBlogs,
  getAdminBlogById,

  createBlog,
  updateBlog,
  deleteBlog,
  updateBlogStatus,

  getBlogTypes,
} from "../controllers/blog.controller";

import { authenticateJWT } from "../middleware/auth.middleware";
import { authorizeModule } from "../middleware/authorize";

const router = Router();

/**
 * |--------------------------------------------------------------------------
 * | PUBLIC BLOG / NEWS & UPDATES ROUTES
 * |--------------------------------------------------------------------------
 */

/**
 * GET /api/blog
 *
 * Get all published blog/news items.
 *
 * Optional query parameters:
 * ?type=INAUGURATION
 * ?page=1
 * ?limit=10
 */
router.get("/", getBlogs);

/**
 * GET /api/blog/type/:type
 *
 * Get published posts by type.
 *
 * Example:
 * /api/blog/type/INAUGURATION
 * /api/blog/type/PRESS_RELEASE
 * /api/blog/type/NEWSLETTER_ARCHIVE
 */
router.get("/type/:type", getBlogsByType);

/**
 * |--------------------------------------------------------------------------
 * | ADMIN BLOG / NEWS & UPDATES ROUTES
 * |--------------------------------------------------------------------------
 *
 * All routes below require JWT authentication.
 */

/**
 * GET /api/blog/admin/types
 *
 * Get available blog types.
 */
router.get(
  "/admin/types",
  authenticateJWT,
  authorizeModule("news"),
  getBlogTypes
);

/**
 * GET /api/blog/admin
 *
 * Get all blog posts including unpublished posts.
 *
 * Optional query parameters:
 * ?type=INAUGURATION
 * ?search=plant
 * ?isPublished=true
 * ?page=1
 * ?limit=10
 */
router.get(
  "/admin",
  authenticateJWT,
  authorizeModule("news"),
  getAdminBlogs
);

/**
 * GET /api/blog/admin/:id
 *
 * Get a single blog post by ID.
 */
router.get(
  "/admin/:id",
  authenticateJWT,
  authorizeModule("news"),
  getAdminBlogById
);

/**
 * POST /api/blog/admin
 *
 * Create a new blog/news item.
 */
router.post(
  "/admin",
  authenticateJWT,
  authorizeModule("news"),
  createBlog
);

/**
 * PUT /api/blog/admin/:id
 *
 * Update an existing blog/news item.
 */
router.put(
  "/admin/:id",
  authenticateJWT,
  authorizeModule("news"),
  updateBlog
);

/**
 * DELETE /api/blog/admin/:id
 *
 * Delete a blog/news item.
 */
router.delete(
  "/admin/:id",
  authenticateJWT,
  authorizeModule("news"),
  deleteBlog
);

/**
 * PATCH /api/blog/admin/:id/status
 *
 * Publish/unpublish a blog/news item.
 *
 * Body:
 * {
 *   "isPublished": true
 * }
 */
router.patch(
  "/admin/:id/status",
  authenticateJWT,
  authorizeModule("news"),
  updateBlogStatus
);

/**
 * |--------------------------------------------------------------------------
 * | PUBLIC SINGLE BLOG ROUTE
 * |--------------------------------------------------------------------------
 *
 * IMPORTANT:
 * Keep this AFTER /admin routes.
 *
 * GET /api/blog/:slug
 *
 * Example:
 * /api/blog/ador-plant-inauguration
 */
router.get(
  "/:slug",
  getBlogBySlug
);

export default router;