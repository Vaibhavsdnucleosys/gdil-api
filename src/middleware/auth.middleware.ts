import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    sessionId: string;
  };
}

export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "A valid Bearer token is required",
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "JWT token is required",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      !decoded.sub ||
      !decoded.email
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT payload",
      });
    }

    const userId = Number(decoded.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT user ID",
      });
    }

    const sessionId =
      typeof decoded.sid === "string"
        ? decoded.sid
        : "";

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        code: "SESSION_INVALID",
        message: "Invalid session",
      });
    }
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or no longer exists",
      });
    }

    if (
      user.email.toLowerCase() !==
      String(decoded.email).toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT user",
      });
    }
    const session = await prisma.browserSession.findFirst({
      where: {
        sessionKey: sessionId,
        userId: user.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        code: "SESSION_INVALID",
        message: "Your session has expired or been logged out.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    return next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "JWT token has expired",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT token",
      });
    }

    return next(error);
  }
}