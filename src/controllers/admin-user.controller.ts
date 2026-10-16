
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

const userSelect = {
  id: true,
  username: true,
  name: true,
  email: true,
  mobile: true,
  isActive: true,
  createdAt: true,
} as const;

export async function getAdminUsers(
  _req: Request,
  res: Response
) {
  try {
    const users = await prisma.adminUser.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("getAdminUsers:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
}

export async function createAdminUser(
  req: Request,
  res: Response
) {
  try {
    const { username, name, email, mobile, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof mobile !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    if (!cleanUsername || !cleanName || !cleanEmail || !cleanMobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 100 ||
      !/^[a-zA-Z0-9._-]+$/.test(cleanUsername)
    ) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3–100 characters and contain only letters, numbers, dots, underscores, or hyphens.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    if (cleanName.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Name is too long.",
      });
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters and no more than 72 UTF-8 bytes.",
      });
    }

    const existingUser = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        passwordHash,
        isActive: true,
      },
      select: userSelect,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: user,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    console.error("createAdminUser:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user.",
    });
  }
}

export async function updateAdminUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      username,
      name,
      email,
      mobile,
      password,
      isActive,
    } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof mobile !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, name, email and mobile are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 100 ||
      !/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)
    ) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-100 characters and contain only letters, numbers, dots, underscores or hyphens.",
      });
    }

    if (!cleanName || cleanName.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Name is required and must not exceed 255 characters.",
      });
    }

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits.",
      });
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const duplicate = await prisma.adminUser.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { username: cleanUsername },
              { email: cleanEmail },
            ],
          },
        ],
      },
      select: { id: true, username: true, email: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          duplicate.username === cleanUsername
            ? "Username already exists."
            : "Email already exists.",
      });
    }

    const data: {
      username: string;
      name: string;
      email: string;
      mobile: string;
      isActive?: boolean;
      passwordHash?: string;
    } = {
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
    };

    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    if (password !== undefined && password !== "") {
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
      ) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters and at most 72 UTF-8 bytes.",
        });
      }

      data.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        mobile: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateAdminUser:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update user.",
    });
  }
}

export async function deleteAdminUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, username: true },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "User deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("deleteAdminUser:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return res.status(409).json({
        success: false,
        message: "This user cannot be deleted because related records exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete user.",
    });
  }
}

