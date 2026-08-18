import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "PATIENT") {
    redirect("/intake");
  }

  if (user?.role === "REVIEWER") {
    redirect("/queue");
  }

  return <LoginForm />;
}