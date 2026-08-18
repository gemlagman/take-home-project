import {
  redirect,
} from "next/navigation";

import {
  getCurrentUser,
} from "@/lib/auth";

import IntakeDetail
  from "@/components/IntakeDetail";

import LogoutButton
  from "@/components/LogoutButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReviewerIntakePage({
  params,
}: PageProps) {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !==
    "REVIEWER"
  ) {
    redirect("/intake");
  }

  const { id } =
    await params;

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
            "flex-end",
          marginBottom:
            "1rem",
        }}
      >
        <LogoutButton />
      </header>

      <IntakeDetail
        intakeId={id}
      />
    </main>
  );
}