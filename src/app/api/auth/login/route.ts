import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sessionCookieName } from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const email =
      body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 401,
        }
      );
    }

    const response =
      NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

    response.cookies.set(
      sessionCookieName,
      user.id,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Login failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to sign in",
      },
      {
        status: 500,
      }
    );
  }
}