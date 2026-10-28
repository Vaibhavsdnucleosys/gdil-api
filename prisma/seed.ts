import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma from "../src/lib/prisma";

declare const process: {
  exit(code?: number): never;
};

async function main() {

  const adminEmail = "admin@gdil.com";

  const adminPassword = "Admin@123";

  const passwordHash = await bcrypt.hash(
    adminPassword,
    12,
  );

const admin = await prisma.adminUser.upsert({
  where: {
    email: adminEmail,
  },

  update: {
    username: "gdiladmin",
    name: "GDIL Admin",
    passwordHash,
    role: "SYSTEM_ADMIN",
    isActive: true,
  },

  create: {
    username: "gdiladmin",
    email: adminEmail,
    name: "GDIL Admin",
    passwordHash,
    role: "SYSTEM_ADMIN",
    isActive: true,
  },
});

console.log(
  `System Admin created/updated: ${admin.email} (${admin.role})`,
);

  console.log(
    "Database seed completed successfully.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });