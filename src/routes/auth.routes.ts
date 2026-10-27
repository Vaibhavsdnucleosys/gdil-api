import { Router } from "express";

import {
  login,
  logout,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller";

import {
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "../controllers/admin-user.controller";

import { authenticateJWT } from "../middleware/auth.middleware";
import { requireSystemAdmin } from "../middleware/admin.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Admin authentication APIs
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     description: Login using admin email and password and receive a JWT token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gdil.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Admin account is inactive
 */
router.post("/login", login);
router.post("/logout", authenticateJWT, logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends password reset instructions to the registered email address.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gdil.com
 *     responses:
 *       200:
 *         description: Reset instructions will be sent if the account exists.
 *       400:
 *         description: Invalid email address
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset admin password
 *     description: Resets the password using a valid, unused reset token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token received in the password reset email.
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecure@123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all admin users
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/users", authenticateJWT, requireSystemAdmin, getAdminUsers);

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Create a new admin user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - name
 *               - email
 *               - mobile
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: newadmin
 *               name:
 *                 type: string
 *                 example: New Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newadmin@gdil.in
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ChangeMe123!
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post("/users", authenticateJWT, requireSystemAdmin, createAdminUser);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     summary: Update an admin user
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - name
 *               - email
 *               - mobile
 *             properties:
 *               username:
 *                 type: string
 *                 example: updatedadmin
 *               name:
 *                 type: string
 *                 example: Updated Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: updatedadmin@gdil.in
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Optional. Leave empty or omit to keep the existing password.
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin user updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.put("/users/:id",authenticateJWT,requireSystemAdmin,updateAdminUser,
);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete an admin user
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Admin user deleted successfully
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       409:
 *         description: User has related records and cannot be deleted
 *       500:
 *         description: Server error
 */
router.delete("/users/:id", authenticateJWT, requireSystemAdmin, deleteAdminUser);

export default router;
