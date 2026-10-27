
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";

export type ModulePermission =
  | "users"
  | "categories"
  | "subcategories"
  | "financial-years"
  | "quarters"
  | "investor-table-formats"
  | "documents"
  | "careers"
  | "inquiries"
  | "news";

const ROLE_PERMISSIONS: Record<string, ModulePermission[] | ["*"]> = {
  ADMIN: ["*"],
  SYSTEM_ADMIN: ["*"],

  CS_TEAM: [
    "categories",
    "subcategories",
    "financial-years",
    "quarters",
    "investor-table-formats",
    "documents",
  ],

  HR: ["careers"],

  EDITOR: ["inquiries", "news"],
};

export function authorizeModule(permission: ModulePermission) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

   
const permissions = ROLE_PERMISSIONS[req.user.role.toUpperCase()];

if (!permissions) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to access this module.",
  });
}

const hasFullAccess = permissions.some(
  (item) => item === "*",
);

const hasModuleAccess = permissions.some(
  (item) => item === permission,
);

if (!hasFullAccess && !hasModuleAccess) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to access this module.",
  });
}


    next();
  };
}
