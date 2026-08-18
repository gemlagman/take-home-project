import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import {
  mkdir,
  writeFile,
} from "fs/promises";

import path from "path";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const user =
      await getCurrentUser();

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

    // Only patients upload supporting documents.
    if (user.role !== "PATIENT") {
      return NextResponse.json(
        {
          error:
            "Only patients can upload documents",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await params;

    // --------------------------------------------
    // VERIFY INTAKE + OWNERSHIP
    // --------------------------------------------

    const intake =
      await prisma.intake.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          submittedById: true,
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

    if (
      intake.submittedById !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot upload documents to this application",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------
    // READ MULTIPART FORM
    // --------------------------------------------

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const description =
      formData.get("description");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "A file is required",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------
    // VALIDATION
    // --------------------------------------------

    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only PDF, JPEG, and PNG files are supported",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "File must be 10 MB or smaller",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------
    // CREATE UNIQUE LOCAL FILE NAME
    // --------------------------------------------

    const extension =
      getExtension(
        file.name
      );

    const storedFileName =
      `${crypto.randomUUID()}${extension}`;

    const uploadDirectory =
      path.join(
        process.cwd(),
        "uploads"
      );

    await mkdir(
      uploadDirectory,
      {
        recursive: true,
      }
    );

    const storagePath =
      path.join(
        uploadDirectory,
        storedFileName
      );

    // --------------------------------------------
    // WRITE FILE
    // --------------------------------------------

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    await writeFile(
      storagePath,
      buffer
    );

    // --------------------------------------------
    // SAVE METADATA + AUDIT EVENT
    // --------------------------------------------

    const document =
      await prisma.$transaction(
        async (tx) => {
          const createdDocument =
            await tx.document.create({
              data: {
                fileName:
                  file.name,

                fileType:
                  file.type,

                fileSize:
                  file.size,

                filePath:
                  `uploads/${storedFileName}`,

                description:
                  typeof description ===
                    "string" &&
                  description.trim()
                    ? description.trim()
                    : null,

                intakeId:
                  id,
              },
            });

          await tx.auditLog.create({
            data: {
              action:
                "DOCUMENT_UPLOADED",

              details:
                JSON.stringify({
                  fileName:
                    file.name,
                  fileType:
                    file.type,
                  fileSize:
                    file.size,
                }),

              userId:
                user.id,

              intakeId:
                id,
            },
          });

          return createdDocument;
        }
      );

    return NextResponse.json(
      document,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Document upload failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to upload document",
      },
      {
        status: 500,
      }
    );
  }
}

function getExtension(
  fileName: string
) {
  return path
    .extname(fileName)
    .toLowerCase();
}