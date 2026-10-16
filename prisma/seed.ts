import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma from "../src/lib/prisma";

declare const process: {
  exit(code?: number): never;
};

const categories = [
  {
    name: "Annual Reports",
    slug: "annual-reports",
    sortOrder: 1,
  },
  {
    name: "Financial Results",
    slug: "financial-results",
    sortOrder: 2,
  },
  {
    name: "Annual Returns",
    slug: "annual-returns",
    sortOrder: 3,
  },
  {
    name: "Corporate Announcements",
    slug: "corporate-announcements",
    sortOrder: 4,
  },
  {
    name: "Corporate Governance",
    slug: "corporate-governance",
    sortOrder: 5,
  },
  {
    name: "Shareholding Pattern",
    slug: "shareholding-pattern",
    sortOrder: 6,
  },
  {
    name: "SEBI LODR Disclosures",
    slug: "sebi-lodr",
    sortOrder: 7,
  },
  {
    name: "Investor Forms",
    slug: "investor-forms",
    sortOrder: 8,
  },
  {
    name: "Subsidiary Financials",
    slug: "subsidiary-financials",
    sortOrder: 9,
  },
  {
    name: "Notice to Stakeholders",
    slug: "notice-to-stakeholders",
    sortOrder: 10,
  },
  {
    name: "Newspaper Publication",
    slug: "newspaper-publication",
    sortOrder: 11,
  },
  {
    name: "Stock Exchange Disclosures",
    slug: "stock-exchange-disclosures",
    sortOrder: 12,
  },
  {
    name: "KYC and Nomination",
    slug: "kyc-nomination",
    sortOrder: 13,
  },
  {
    name: "Tax Declarations",
    slug: "tax-declarations",
    sortOrder: 14,
  },
  {
    name: "Unpaid Dividends",
    slug: "unpaid-dividends",
    sortOrder: 15,
  },
];

async function main() {
  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE ADMIN USER
  |--------------------------------------------------------------------------
  */

  const adminEmail = "admin@gdil.com";

  const adminPassword = "Admin@123";

  const passwordHash = await bcrypt.hash(
    adminPassword,
    12,
  );

  // const admin = await prisma.adminUser.upsert({
  //   where: {
  //     email: adminEmail,
  //   },

  //   update: {
  //     name: "GDIL Admin",
  //     passwordHash,
  //     isActive: true,
  //   },

  //   create: {
  //     email: adminEmail,
  //     name: "GDIL Admin",
  //     passwordHash,
  //     isActive: true,
  //   },
  // });

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

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE INVESTOR CATEGORIES
  |--------------------------------------------------------------------------
  */

  for (const category of categories) {
    const existingCategory = await prisma.investorCategory.findFirst({
      where: {
        name: category.name,
      },
    });

    if (existingCategory) {
      await prisma.investorCategory.update({
        where: {
          id: existingCategory.id,
        },
        data: {
          name: category.name,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      });
    } else {
      await prisma.investorCategory.create({
        data: {
          name: category.name,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      });
    }
  }

  console.log(
    "Investor categories created successfully.",
  );

  /*
  |--------------------------------------------------------------------------
  | COMPLETE
  |--------------------------------------------------------------------------
  */

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