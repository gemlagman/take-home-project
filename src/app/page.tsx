import {
  redirect,
} from "next/navigation";

import {
  getCurrentUser,
} from "@/lib/auth";

export default async function Home() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "PATIENT") {
    redirect("/intake");
  }

  if (user.role === "REVIEWER") {
    redirect("/queue");
  }

  redirect("/login");
}
