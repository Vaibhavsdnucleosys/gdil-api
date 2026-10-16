import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendFormNotification } from "../lib/mailer";
/**
 * ==========================================================================
 * CREATE CAREER APPLICATION
 * ==========================================================================
 * POST /api/contact/careers
 *
 * Public API
 */
export async function createCareerApplication(
  req: Request,
  res: Response,
) {
  try {
    const {
      name,
      email,
      phone,
      position,
      experience,
      message,
    } = req.body;

    // ----------------------------------------------------------------------
    // Required field validation
    // ----------------------------------------------------------------------

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!position || !String(position).trim()) {
      return res.status(400).json({
        success: false,
        message: "Position is required",
      });
    }

    if (!experience || !String(experience).trim()) {
      return res.status(400).json({
        success: false,
        message: "Experience is required",
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // ----------------------------------------------------------------------
    // Email validation
    // ----------------------------------------------------------------------

    const emailValue = String(email)
      .trim()
      .toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // ----------------------------------------------------------------------
    // Create career application
    // ----------------------------------------------------------------------

    const application =
      await prisma.careerApplication.create({
        data: {
          name: String(name).trim(),

          email: emailValue,

          phone:
            phone &&
            String(phone).trim()
              ? String(phone).trim()
              : null,

          position: String(position).trim(),

          experience: String(experience).trim(),

          message: String(message).trim(),

          status: "new",
        },
      });
      try {
  const recipient = process.env.CAREER_NOTIFICATION_EMAIL;

  if (!recipient) {
    throw new Error("CAREER_NOTIFICATION_EMAIL is not configured.");
  }

  await sendFormNotification({
    to: recipient,
    subject: `New Career Application: ${application.position}`,
    replyTo: application.email,
    text: [
      "New career application",
      "",
      `Name: ${application.name}`,
      `Email: ${application.email}`,
      `Phone: ${application.phone || "Not provided"}`,
      `Position: ${application.position}`,
      `Experience: ${application.experience}`,
      "",
      "Message:",
      application.message,
    ].join("\n"),
  });
} catch (emailError) {
  console.error("Career notification email failed:", emailError);
}

    // ----------------------------------------------------------------------
    // Response
    // ----------------------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Your career application has been submitted successfully.",
      data: {
        id: application.id,
        name: application.name,
        email: application.email,
        phone: application.phone,
        position: application.position,
        experience: application.experience,
        message: application.message,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create Career Application Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting your career application.",
    });
  }
}

/**
 * ==========================================================================
 * GET ALL CAREER APPLICATIONS
 * ==========================================================================
 * GET /api/contact/careers/admin
 *
 * Admin API
 *
 * Query parameters:
 * ?page=1
 * ?limit=10
 * ?search=john
 * ?status=new
 */
export async function getCareerApplications(
  req: Request,
  res: Response,
) {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1,
      ),
      100,
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";

    const where: any = {};

    // ----------------------------------------------------------------------
    // Search
    // ----------------------------------------------------------------------

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          position: {
            contains: search,
          },
        },
        {
          experience: {
            contains: search,
          },
        },
        {
          message: {
            contains: search,
          },
        },
      ];
    }

    // ----------------------------------------------------------------------
    // Status filter
    // ----------------------------------------------------------------------

    if (status) {
      where.status = status;
    }

    // ----------------------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------------------

    const skip = (page - 1) * limit;

    const [
      applications,
      total,
    ] = await Promise.all([
      prisma.careerApplication.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.careerApplication.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(
      total / limit,
    );

    return res.status(200).json({
      success: true,

      data: applications,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "Get Career Applications Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load career applications",
    });
  }
}

/**
 * ==========================================================================
 * GET SINGLE CAREER APPLICATION
 * ==========================================================================
 * GET /api/contact/careers/admin/:id
 *
 * Admin API
 */
export async function getCareerApplicationById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid career application ID",
      });
    }

    const application =
      await prisma.careerApplication.findUnique({
        where: {
          id,
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Career application not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(
      "Get Career Application Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load career application",
    });
  }
}

/**
 * ==========================================================================
 * UPDATE CAREER APPLICATION STATUS
 * ==========================================================================
 * PATCH /api/contact/careers/admin/:id/status
 *
 * Admin API
 *
 * Body:
 * {
 *   "status": "reviewed"
 * }
 *
 * Allowed:
 * new
 * reviewed
 * shortlisted
 * rejected
 * hired
 * closed
 */
export async function updateCareerApplicationStatus(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid career application ID",
      });
    }

    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "reviewed",
      "shortlisted",
      "rejected",
      "hired",
      "closed",
    ];

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: new, reviewed, shortlisted, rejected, hired, closed",
      });
    }

    const existing =
      await prisma.careerApplication.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Career application not found",
      });
    }

    const application =
      await prisma.careerApplication.update({
        where: {
          id,
        },

        data: {
          status,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Career application status updated successfully.",
      data: application,
    });
  } catch (error) {
    console.error(
      "Update Career Application Status Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update career application status",
    });
  }
}

/**
 * ==========================================================================
 * DELETE CAREER APPLICATION
 * ==========================================================================
 * DELETE /api/contact/careers/admin/:id
 *
 * Admin API
 */
export async function deleteCareerApplication(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid career application ID",
      });
    }

    const existing =
      await prisma.careerApplication.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Career application not found",
      });
    }

    await prisma.careerApplication.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Career application deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Career Application Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete career application",
    });
  }
}