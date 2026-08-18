import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    // User must be logged in
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

    // --------------------------------------------------
    // PATIENT
    // Return only this patient's applications
    // --------------------------------------------------

    if (user.role === "PATIENT") {
      const intakes = await prisma.intake.findMany({
        where: {
          submittedById: user.id,
        },

        include: {
          documents: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(intakes);
    }

    // --------------------------------------------------
    // REVIEWER
    // Return active, claimable/owned applications
    // --------------------------------------------------

    if (user.role === "REVIEWER") {
      const intakes = await prisma.intake.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  reviewerId: null,
                },
                {
                  reviewerId: user.id,
                },
              ],
            },

            {
              status: {
                in: [
                  "PENDING",
                  "IN_REVIEW",
                ],
              },
            },
          ],
        },

        select: {
          id: true,

          clientName: true,
          clientEmail: true,

          description: true,

          status: true,

          createdAt: true,
          updatedAt: true,

          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(intakes);
    }

    return NextResponse.json(
      {
        error: "Invalid user role",
      },
      {
        status: 403,
      }
    );
  } catch (error) {
    console.error(
      "Failed to retrieve intakes:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to retrieve applications",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const user = await getCurrentUser();

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // AUTHORIZATION
    // Only patients can create applications
    // --------------------------------------------------

    if (user.role !== "PATIENT") {
      return NextResponse.json(
        {
          error: "Only patients can submit applications",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientPhone,
      dateOfBirth,
      ssn,
      description,
      notes,
    } = body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
      !clientName?.trim() ||
      !clientEmail?.trim() ||
      !clientPhone?.trim() ||
      !dateOfBirth?.trim() ||
      !ssn?.trim() ||
      !description?.trim()
    ) {
      return NextResponse.json(
        {
          error: "Please complete all required fields",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // CREATE INTAKE + AUDIT EVENT
    // --------------------------------------------------

    const intake = await prisma.$transaction(
      async (tx) => {
        const createdIntake =
          await tx.intake.create({
            data: {
              clientName:
                clientName.trim(),

              clientEmail:
                clientEmail.trim(),

              clientPhone:
                clientPhone.trim(),

              dateOfBirth:
                dateOfBirth.trim(),

              ssn:
                ssn.trim(),

              description:
                description.trim(),

              notes:
                typeof notes === "string" &&
                notes.trim()
                  ? notes.trim()
                  : null,

              submittedById:
                user.id,
            },
          });

        // Record every new intake submission
        await tx.auditLog.create({
          data: {
            action: "CREATED",

            details:
              JSON.stringify({
                status:
                  createdIntake.status,
              }),

            userId:
              user.id,

            intakeId:
              createdIntake.id,
          },
        });

        return createdIntake;
      }
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      intake,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create intake:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit application",
      },
      {
        status: 500,
      }
    );
  }
}