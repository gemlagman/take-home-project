import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redactIntake } from "@/lib/redaction";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();

    // --------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------
    // AUTHORIZATION
    // Reviewer detail endpoint for now
    // --------------------------------------------

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        {
          error:
            "Only reviewers can access this view",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    // --------------------------------------------
    // CHECK ACCESS FIRST
    // --------------------------------------------

    const accessCheck =
      await prisma.intake.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          reviewerId: true,
        },
      });

    if (!accessCheck) {
      return NextResponse.json(
        {
          error:
            "Application not found",
        },
        {
          status: 404,
        }
      );
    }

    // If it is assigned, only the assigned
    // reviewer may view it.
    if (
      accessCheck.reviewerId &&
      accessCheck.reviewerId !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This application is assigned to another reviewer",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------
    // VIEW TYPE
    // --------------------------------------------

    const url =
      new URL(request.url);

    const privileged =
      url.searchParams.get(
        "privileged"
      ) === "true";

    // --------------------------------------------
    // AUDIT PRIVILEGED ACCESS
    // --------------------------------------------

    if (privileged) {
      await prisma.auditLog.create({
        data: {
          action: "VIEWED",

          details:
            JSON.stringify({
              view: "PRIVILEGED",
            }),

          userId: user.id,
          intakeId: id,
        },
      });
    }

    // --------------------------------------------
    // LOAD DETAILS
    // --------------------------------------------

    const intake =
      await prisma.intake.findUnique({
        where: {
          id,
        },

        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          submittedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!intake) {
      return NextResponse.json(
        {
          error:
            "Application not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------
    // PRIVILEGED
    // Full PII
    // --------------------------------------------

    if (privileged) {
      return NextResponse.json(
        intake
      );
    }

    // --------------------------------------------
    // SIMPLE / REDACTED
    // --------------------------------------------

    return NextResponse.json(
      redactIntake(intake)
    );
  } catch (error) {
    console.error(
      "Failed to retrieve intake:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve application",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  const { id } = await params;

  return NextResponse.json(
    {
      message:
        `TODO: Implement PATCH /api/intakes/${id}`,
    },
    {
      status: 501,
    }
  );
}