import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

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
    // --------------------------------------------------

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const url = new URL(request.url);

    const queue =
      url.searchParams.get("queue") ?? "open";

    // --------------------------------------------------
    // OPEN QUEUE
    //
    // Any reviewer can see:
    // - PENDING
    // - unassigned
    // --------------------------------------------------

    if (queue === "open") {
      const intakes = await prisma.intake.findMany({
        where: {
          status: "PENDING",
          reviewerId: null,
        },

        select: {
          id: true,
          clientName: true,
          clientEmail: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

      return NextResponse.json(intakes);
    }

    // --------------------------------------------------
    // ASSIGNED QUEUE
    //
    // Reviewer can only see:
    // - IN_REVIEW
    // - assigned to themselves
    // --------------------------------------------------

    if (queue === "assigned") {
      const intakes = await prisma.intake.findMany({
        where: {
          status: "IN_REVIEW",
          reviewerId: user.id,
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
          updatedAt: "desc",
        },
      });

      return NextResponse.json(intakes);
    }

    // --------------------------------------------------
    // COMPLETED QUEUE
    //
    // Reviewer can only see:
    // - assigned to themselves
    // - APPROVED or REJECTED
    // --------------------------------------------------

    if (queue === "completed") {
      const intakes = await prisma.intake.findMany({
        where: {
          reviewerId: user.id,

          status: {
            in: [
              "APPROVED",
              "REJECTED",
            ],
          },
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
          updatedAt: "desc",
        },
      });

      return NextResponse.json(intakes);
    }

    return NextResponse.json(
      {
        error: "Invalid queue",
      },
      {
        status: 400,
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

        await tx.auditLog.create({
          data: {
            action: "CREATED",

            details: JSON.stringify({
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
        error: "Unable to submit application",
      },
      {
        status: 500,
      }
    );
  }
}