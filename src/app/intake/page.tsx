import {
  redirect,
} from "next/navigation";

import {
  getCurrentUser,
} from "@/lib/auth";

import LogoutButton
  from "@/components/LogoutButton";

export default async function IntakePage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "PATIENT") {
    redirect("/queue");
  }

  return (
    <main
      style={{
        padding: "2rem",
      }}
    >
      <h1>
        Clinical Trial Enrollment
      </h1>

      <LogoutButton />

      <p>
        Welcome, {user.name}
      </p>

      {/* Intake form comes next */}
    </main>
  );
}