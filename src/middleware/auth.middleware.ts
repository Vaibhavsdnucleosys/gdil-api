import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization format must be Bearer <token>",
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

    const decoded = jwt.verify(
      token,
      secret,
    ) as jwt.JwtPayload;

    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT payload",
      });
    }

    req.user = {
      id: Number(decoded.sub),
      email: String(decoded.email),
      role: String(decoded.role || "USER"),
    };

    next();
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

    next(error);
  }
}