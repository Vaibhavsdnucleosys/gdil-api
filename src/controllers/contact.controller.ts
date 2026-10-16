import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendFormNotification } from "../lib/mailer";

/**
 * ==========================================================================
 * CREATE CONTACT INQUIRY
 * ==========================================================================
 * POST /api/contact
 *
 * Public API
 */
export async function createContactInquiry(
  req: Request,
  res: Response,
) {
  try {
    const {
      companyName,
      name,
      email,
      phone,
      subject,
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
    // Create inquiry
    // ----------------------------------------------------------------------

    const inquiry =
      await prisma.contactInquiry.create({
        data: {
          companyName:
            companyName &&
            String(companyName).trim()
              ? String(companyName).trim()
              : null,

          name: String(name).trim(),

          email: emailValue,

          phone:
            phone &&
            String(phone).trim()
              ? String(phone).trim()
              : null,

          subject:
            subject &&
            String(subject).trim()
              ? String(subject).trim()
              : null,

          message: String(message).trim(),

          status: "new",
        },
      });
      try {
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL;

  if (!recipient) {
    throw new Error("CONTACT_NOTIFICATION_EMAIL is not configured.");
  }

  await sendFormNotification({
    to: recipient,
    subject: `New Contact Inquiry: ${inquiry.subject || inquiry.name}`,
    replyTo: inquiry.email,
    text: [
      "New contact form submission",
      ""
      ,
      `Name: ${inquiry.name}`,
      `Email: ${inquiry.email}`,
      `Company: ${inquiry.companyName || "Not provided"}`,
      `Phone: ${inquiry.phone || "Not provided"}`,
      `Subject: ${inquiry.subject || "Not provided"}`,
      "",
      "Message:",
      inquiry.message,
    ].join("\n"),
  });
} catch (emailError) {
  console.error("Contact notification email failed:", emailError);
}

    // ----------------------------------------------------------------------
    // Response
    // ----------------------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Your inquiry has been submitted successfully.",
      data: {
        id: inquiry.id,
        companyName: inquiry.companyName,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create Contact Inquiry Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting your inquiry.",
    });
  }
}

/**
 * ==========================================================================
 * GET ALL CONTACT INQUIRIES
 * ==========================================================================
 * GET /api/contact/admin
 *
 * Admin API
 *
 * Query parameters:
 * ?page=1
 * ?limit=10
 * ?search=john
 * ?status=new
 */
export async function getContactInquiries(
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
          companyName: {
            contains: search,
          },
        },
        {
          subject: {
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
      inquiries,
      total,
    ] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.contactInquiry.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(
      total / limit,
    );

    return res.status(200).json({
      success: true,

      data: inquiries,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "Get Contact Inquiries Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load contact inquiries",
    });
  }
}

/**
 * ==========================================================================
 * GET SINGLE CONTACT INQUIRY
 * ==========================================================================
 * GET /api/contact/admin/:id
 *
 * Admin API
 */
export async function getContactInquiryById(
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
        message: "Invalid inquiry ID",
      });
    }

    const inquiry =
      await prisma.contactInquiry.findUnique({
        where: {
          id,
        },
      });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error(
      "Get Contact Inquiry Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load contact inquiry",
    });
  }
}

/**
 * ==========================================================================
 * UPDATE CONTACT INQUIRY STATUS
 * ==========================================================================
 * PATCH /api/contact/admin/:id/status
 *
 * Admin API
 *
 * Body:
 * {
 *   "status": "read"
 * }
 *
 * Allowed:
 * new
 * read
 * replied
 * closed
 */
export async function updateContactInquiryStatus(
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
        message: "Invalid inquiry ID",
      });
    }

    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "read",
      "replied",
      "closed",
    ];

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: new, read, replied, closed",
      });
    }

    const existing =
      await prisma.contactInquiry.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    const inquiry =
      await prisma.contactInquiry.update({
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
        "Contact inquiry status updated successfully.",
      data: inquiry,
    });
  } catch (error) {
    console.error(
      "Update Contact Inquiry Status Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update contact inquiry status",
    });
  }
}

/**
 * ==========================================================================
 * DELETE CONTACT INQUIRY
 * ==========================================================================
 * DELETE /api/contact/admin/:id
 *
 * Admin API
 */
export async function deleteContactInquiry(
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
        message: "Invalid inquiry ID",
      });
    }

    const existing =
      await prisma.contactInquiry.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    await prisma.contactInquiry.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Contact inquiry deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Contact Inquiry Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete contact inquiry",
    });
  }
}