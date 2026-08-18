import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import LogoutButton from "@/components/LogoutButton";
import PatientIntake from "@/components/PatientIntake";

export default async function IntakePage() {
  const user = await getCurrentUser();

  // No logged-in user
  if (!user) {
    redirect("/login");
  }

  // Reviewer should not access patient intake page
  if (user.role !== "PATIENT") {
    redirect("/queue");
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: "0.25rem",
            }}
          >
            Clinical Trial Enrollment
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

      <PatientIntake />
    </main>
  );
}