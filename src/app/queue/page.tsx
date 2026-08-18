import {
  redirect,
} from "next/navigation";

import {
  getCurrentUser,
} from "@/lib/auth";

import LogoutButton
  from "@/components/LogoutButton";

export default async function QueuePage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "REVIEWER") {
    redirect("/intake");
  }

  return (
    <main
      style={{
        padding: "2rem",
      }}
    >
      <h1>Review Queue</h1>

      <LogoutButton />

      <p>
        Welcome, {user.name}
      </p>

      {/* Queue implementation comes later */}
    </main>
  );
}