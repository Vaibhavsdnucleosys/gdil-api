// import type {
//   Request,
//   Response,
//   NextFunction,
// } from "express";

// export function adminAuth(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const adminKey = req.header("x-admin-key");

//   if (!process.env.ADMIN_API_KEY) {
//     return res.status(500).json({
//       success: false,
//       message: "ADMIN_API_KEY is not configured",
//     });
//   }

//   if (adminKey !== process.env.ADMIN_API_KEY) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized",
//     });
//   }

//   next();
// }

import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";

export function requireSystemAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
  }

  if (!["ADMIN", "SYSTEM_ADMIN"].includes(req.user.role)) {
  return res.status(403).json({
    success: false,
    message: "Access denied. Only Admin users can manage users.",
  });
}

  next();
}
