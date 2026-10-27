import type {
  Request,
  Response,
  NextFunction,
} from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  browserId: z.string().uuid(),
});

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE REQUEST
    |--------------------------------------------------------------------------
    */

    const parsed =
      loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
        errors: parsed.error.flatten(),
      });
    }

    const { email, password, browserId } = parsed.data;

    /*
    |--------------------------------------------------------------------------
    | FIND ADMIN
    |--------------------------------------------------------------------------
    */

    const admin =
      await prisma.adminUser.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK ACTIVE
    |--------------------------------------------------------------------------
    */

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PASSWORD
    |--------------------------------------------------------------------------
    */

    const passwordValid =
      await bcrypt.compare(
        password,
        admin.passwordHash,
      );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | JWT
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | CREATE BROWSER SESSION AND JWT
    |--------------------------------------------------------------------------
    */

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const role = admin.role;
    const now = new Date();
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

    // Check for an existing session in this browser profile.
    const existingSession = await prisma.browserSession.findUnique({
      where: {
        userId_browserId: {
          userId: admin.id,
          browserId,
        },
      },
    });

    // Prevent duplicate login if this session is still active.
    if (
      existingSession &&
      !existingSession.revokedAt &&
      existingSession.expiresAt > now
    ) {
      return res.status(409).json({
        success: false,
        code: "SESSION_ALREADY_ACTIVE",
        message:
          "You are already logged in in this browser profile. Please use your existing session or log out first.",
      });
    }

    const sessionKey = crypto.randomUUID();

    const token = jwt.sign(
      {
        email: admin.email,
        role,
        sid: sessionKey,
      },
      secret,
      {
        subject: String(admin.id),
        expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
      },
    );

    const decodedToken = jwt.decode(token);

    if (
      !decodedToken ||
      typeof decodedToken === "string" ||
      !decodedToken.exp
    ) {
      throw new Error("Could not determine JWT expiration");
    }

    const expiresAt = new Date(decodedToken.exp * 1000);

    if (existingSession) {
      await prisma.browserSession.update({
        where: {
          userId_browserId: {
            userId: admin.id,
            browserId,
          },
        },
        data: {
          sessionKey,
          expiresAt,
          revokedAt: null,
        },
      });
    } else {
      await prisma.browserSession.create({
        data: {
          userId: admin.id,
          browserId,
          sessionKey,
          expiresAt,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.sessionId) {
      return res.status(401).json({
        success: false,
        message: "No active session found",
      });
    }

    await prisma.browserSession.updateMany({
      where: {
        sessionKey: req.user.sessionId,
        userId: req.user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

const genericResetMessage =
  "If an account exists for that email, password reset instructions will be sent.";

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * POST /api/auth/forgot-password
 */
export async function requestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const email = parsed.data.email.toLowerCase();

    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    // Do not reveal whether an account exists or is active.
    if (!admin || !admin.isActive) {
      return res.status(200).json({
        success: true,
        message: genericResetMessage,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    if (
      !frontendUrl ||
      !smtpHost ||
      !smtpUser ||
      !smtpPassword ||
      !smtpFrom ||
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535
    ) {
      throw new Error("Password reset email configuration is incomplete.");
    }

    // The raw token is emailed; only its SHA-256 hash is stored.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate older, unused tokens for this user.
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: admin.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = new URL("/admin/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", rawToken);

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: admin.email,
        subject: "Reset your GDIL Admin password",
        text: [
          `Hello ${admin.name || "Admin"},`,
          "",
          "We received a request to reset your password.",
          `Use this link within 15 minutes: ${resetUrl.toString()}`,
          "",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
        html: `
          <p>Hello ${admin.name || "Admin"},</p>
          <p>We received a request to reset your GDIL Admin password.</p>
          <p>
            <a href="${resetUrl.toString()}">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes and can only be used once.</p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Do not leave a usable token behind if delivery fails.
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: admin.id,
          tokenHash,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: genericResetMessage,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (
      !parsed.success ||
      Buffer.byteLength(parsed.success ? parsed.data.password : "", "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid reset token and a password of 8–72 characters (maximum 72 UTF-8 bytes).",
      });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashResetToken(token);
    const now = new Date();

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt <= now ||
      !resetRecord.user.isActive
    ) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or expired. Please request a new one.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Atomically consume the token to prevent concurrent reuse.
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetRecord.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (consumed.count !== 1) {
        return false;
      }

      await tx.adminUser.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
        },
      });

      // Log out this user from all devices.
      await tx.browserSession.updateMany({
        where: {
          userId: resetRecord.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      // Invalidate other outstanding reset links.
      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetRecord.userId,
          id: { not: resetRecord.id },
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      return true;
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
}