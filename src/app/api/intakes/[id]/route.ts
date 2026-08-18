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
    // --------------------------------------------

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        {
          error:
            "Only reviewers can update applications",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const body = await request.json();

    const {
      action,
      status,
    } = body;

    // --------------------------------------------
    // LOAD CURRENT STATE
    // --------------------------------------------

    const intake =
      await prisma.intake.findUnique({
        where: {
          id,
        },
      });

    if (!intake) {
      return NextResponse.json(
        {
          error: "Application not found",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================
    // ASSIGN TO SELF
    // ============================================

    if (action === "assign") {
      // Intake must still be unassigned.
      if (intake.reviewerId) {
        return NextResponse.json(
          {
            error:
              "Application is already assigned to a reviewer",
          },
          {
            status: 409,
          }
        );
      }

      // Only PENDING applications can be assigned.
      if (intake.status !== "PENDING") {
        return NextResponse.json(
          {
            error:
              "Only pending applications can be assigned",
          },
          {
            status: 409,
          }
        );
      }

      const updated =
        await prisma.$transaction(
          async (tx) => {
            // Assignment also moves the application
            // into the IN_REVIEW state.
            const updatedIntake =
              await tx.intake.update({
                where: {
                  id,
                },

                data: {
                  reviewerId: user.id,
                  status: "IN_REVIEW",
                },

                include: {
                  reviewer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              });

            // Record assignment.
            await tx.auditLog.create({
              data: {
                action: "ASSIGNED",

                details:
                  JSON.stringify({
                    reviewerId:
                      user.id,
                    reviewerName:
                      user.name,
                  }),

                userId:
                  user.id,

                intakeId:
                  id,
              },
            });

            // Record status transition.
            await tx.auditLog.create({
              data: {
                action:
                  "STATUS_CHANGED",

                details:
                  JSON.stringify({
                    from: "PENDING",
                    to: "IN_REVIEW",
                  }),

                userId:
                  user.id,

                intakeId:
                  id,
              },
            });

            return updatedIntake;
          }
        );

      return NextResponse.json(
        updated
      );
    }

    // ============================================
    // STATUS UPDATE
    // ============================================

    if (action === "status") {
      // Only assigned reviewer can make a decision.
      if (
        intake.reviewerId !== user.id
      ) {
        return NextResponse.json(
          {
            error:
              "Only the assigned reviewer can update this application",
          },
          {
            status: 403,
          }
        );
      }

      // Only IN_REVIEW can transition.
      if (
        intake.status !==
        "IN_REVIEW"
      ) {
        return NextResponse.json(
          {
            error:
              "Only applications in review can be approved or rejected",
          },
          {
            status: 409,
          }
        );
      }

      // Only terminal states allowed.
      if (
        status !== "APPROVED" &&
        status !== "REJECTED"
      ) {
        return NextResponse.json(
          {
            error:
              "Status must be APPROVED or REJECTED",
          },
          {
            status: 400,
          }
        );
      }

      const updated =
        await prisma.$transaction(
          async (tx) => {
            const updatedIntake =
              await tx.intake.update({
                where: {
                  id,
                },

                data: {
                  status,
                },

                include: {
                  reviewer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              });

            await tx.auditLog.create({
              data: {
                action:
                  "STATUS_CHANGED",

                details:
                  JSON.stringify({
                    from: "IN_REVIEW",
                    to: status,
                  }),

                userId:
                  user.id,

                intakeId:
                  id,
              },
            });

            return updatedIntake;
          }
        );

      return NextResponse.json(
        updated
      );
    }

    // --------------------------------------------
    // INVALID ACTION
    // --------------------------------------------

    return NextResponse.json(
      {
        error: "Invalid action",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Failed to update intake:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update application",
      },
      {
        status: 500,
      }
    );
  }
}