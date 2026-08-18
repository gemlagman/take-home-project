import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "integral_user_id";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const userId =
    cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  return user;
}

export const sessionCookieName =
  SESSION_COOKIE;