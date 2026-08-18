import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import LogoutButton from "@/components/LogoutButton";
import ReviewerQueue from "@/components/ReviewerQueue";

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
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "2rem",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom:
                "0.25rem",
            }}
          >
            Review Queue
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Welcome, {user.name}
          </p>
        </div>

        <LogoutButton />
      </header>

      <ReviewerQueue />
    </main>
  );
}