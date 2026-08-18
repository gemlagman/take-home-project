"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

interface Intake {
  id: string;

  clientName: string;
  clientEmail: string;
  clientPhone: string;

  dateOfBirth: string;
  ssn: string;

  description: string;
  notes: string | null;

  status: string;

  createdAt: string;
  updatedAt: string;

  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;

  submittedBy: {
    id: string;
    name: string;
  };
}

interface IntakeDetailProps {
  intakeId: string;
}

export default function IntakeDetail({
  intakeId,
}: IntakeDetailProps) {
  const router = useRouter();

  const [intake, setIntake] =
    useState<Intake | null>(null);

  // Always default to the simple/redacted view.
  const [privileged, setPrivileged] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");
  
  const [updating, setUpdating] =
  useState(false);

  const [actionError, setActionError] =
  useState("");  

  const loadIntake =
    useCallback(
      async (
        privilegedView: boolean
      ) => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `/api/intakes/${intakeId}?privileged=${privilegedView}`,
              {
                cache: "no-store",
              }
            );

          // User is no longer logged in.
          if (
            response.status === 401
          ) {
            router.push("/login");
            return;
          }

          const data =
            await response.json();

          // Intake is assigned to another reviewer
          // or user does not have permission.
          if (
            response.status === 403
          ) {
            setError(
              data.error ??
                "You do not have access to this application"
            );

            return;
          }

          if (
            response.status === 404
          ) {
            setError(
              "Application not found"
            );

            return;
          }

          if (!response.ok) {
            setError(
              data.error ??
                "Unable to load application"
            );

            return;
          }

          setIntake(data);
        } catch (error) {
          console.error(
            "Failed to load intake:",
            error
          );

          setError(
            "Something went wrong while loading the application."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        intakeId,
        router,
      ]
    );

  // Whenever a different intake is opened,
  // reset back to the simple/redacted view.
  useEffect(() => {
    async function initialLoad() {
      try {
        const response = await fetch(
          `/api/intakes/${intakeId}?privileged=false`,
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (response.status === 403) {
          setError(
            data.error ??
              "You do not have access to this application"
          );
          return;
        }

        if (response.status === 404) {
          setError("Application not found");
          return;
        }

        if (!response.ok) {
          setError(
            data.error ??
              "Unable to load application"
          );
          return;
        }

        setIntake(data);
      } catch (error) {
        console.error(
          "Failed to load intake:",
          error
        );

        setError(
          "Something went wrong while loading the application."
        );
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
  }, [
    intakeId,
    router,
  ]);

  async function togglePrivileged() {
    const nextView =
      !privileged;

    // This intentionally makes a new API call.
    //
    // Going to privileged mode:
    // GET /api/intakes/:id?privileged=true
    //
    // The backend will:
    // - verify access
    // - create VIEWED audit event
    // - return full PII
    //
    // Returning to simple mode:
    // GET /api/intakes/:id?privileged=false
    //
    // The backend returns redacted PII again.
    await loadIntake(
      nextView
    );

    setPrivileged(
      nextView
    );
  }

  async function assignToSelf() {
    setUpdating(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/intakes/${intakeId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "assign",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setActionError(
          data.error ??
            "Unable to assign application"
        );

        return;
      }

      // Reload detail after assignment.
      //
      // Use simple view again so we don't
      // unnecessarily preserve privileged PII.
      setPrivileged(false);

      await loadIntake(false);
    } catch (error) {
      console.error(
        "Assignment failed:",
        error
      );

      setActionError(
        "Unable to assign application"
      );
    } finally {
      setUpdating(false);
    }
  }

  async function updateStatus(
    status:
      | "APPROVED"
      | "REJECTED"
  ) {
    setUpdating(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/intakes/${intakeId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "status",
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setActionError(
          data.error ??
            "Unable to update application"
        );

        return;
      }

      // Approved/rejected applications belong
      // in Completed, so return to the queues.
      router.push("/queue");
      router.refresh();
    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );

      setActionError(
        "Unable to update application"
      );
    } finally {
      setUpdating(false);
    }
  }

  // --------------------------------------------
  // LOADING
  // --------------------------------------------

  if (loading) {
    return (
      <p>
        Loading application...
      </p>
    );
  }

  // --------------------------------------------
  // ERROR / FORBIDDEN
  // --------------------------------------------

  if (error) {
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              "/queue"
            )
          }
        >
          ← Back to Queue
        </button>

        <div
          role="alert"
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#fee",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!intake) {
    return null;
  }

  // --------------------------------------------
  // DETAIL VIEW
  // --------------------------------------------

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          router.push("/queue")
        }
        style={{
          marginBottom: "1.5rem",
        }}
      >
        ← Back to Queue
      </button>

      <header
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              margin:
                "0 0 0.25rem",
            }}
          >
            {intake.clientName}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Submitted{" "}
            {formatDate(
              intake.createdAt
            )}
          </p>
        </div>

        <StatusBadge
          status={
            intake.status
          }
        />
      </header>

      {/* ----------------------------------------
          PATIENT INFORMATION
         ---------------------------------------- */}

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                marginTop: 0,
                marginBottom:
                  "0.25rem",
              }}
            >
              Patient Information
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              {privileged
                ? "Privileged patient information is visible."
                : "Sensitive patient information is redacted."}
            </p>
          </div>

          <button
            type="button"
            onClick={
              togglePrivileged
            }
          >
            {privileged
              ? "Return to Simple View"
              : "View Privileged Information"}
          </button>
        </div>

        <div style={gridStyle}>
          <DetailField
            label="Full Name"
            value={
              intake.clientName
            }
          />

          <DetailField
            label="Email"
            value={
              intake.clientEmail
            }
          />

          <DetailField
            label="Phone"
            value={
              intake.clientPhone
            }
            sensitive
          />

          <DetailField
            label="Date of Birth"
            value={
              intake.dateOfBirth
            }
            sensitive
          />

          <DetailField
            label="Social Security Number"
            value={
              intake.ssn
            }
            sensitive
          />
        </div>
      </section>

      {/* ----------------------------------------
          ENROLLMENT INFORMATION
         ---------------------------------------- */}

      <section style={cardStyle}>
        <h2>
          Enrollment Information
        </h2>

        <DetailField
          label="Reason for Enrollment / Medical History"
          value={
            intake.description
          }
        />

        <DetailField
          label="Additional Notes"
          value={
            intake.notes ||
            "No additional notes"
          }
        />
      </section>

      {/* ----------------------------------------
          REVIEW INFORMATION
         ---------------------------------------- */}

      <section style={cardStyle}>
        <h2>
          Review Information
        </h2>

        <div style={gridStyle}>
          <DetailField
            label="Status"
            value={
              formatStatus(
                intake.status
              )
            }
          />

          <DetailField
            label="Assigned Reviewer"
            value={
              intake.reviewer
                ?.name ??
              "Unassigned"
            }
          />
        </div>

        {actionError && (
          <div
            role="alert"
            style={{
              padding: "0.75rem",
              marginTop: "1rem",
              backgroundColor: "#fee",
              borderRadius: "6px",
            }}
          >
            {actionError}
          </div>
        )}

        {/* ----------------------------------
            PENDING + UNASSIGNED
            ---------------------------------- */}

        {intake.status ===
          "PENDING" &&
          !intake.reviewer && (
            <div
              style={{
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={assignToSelf}
                disabled={updating}
              >
                {updating
                  ? "Assigning..."
                  : "Assign to Me"}
              </button>
            </div>
          )}

        {/* ----------------------------------
            IN REVIEW + ASSIGNED
            ---------------------------------- */}

        {intake.status ===
          "IN_REVIEW" &&
          intake.reviewer && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    "APPROVED"
                  )
                }
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Approve"}
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    "REJECTED"
                  )
                }
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Reject"}
              </button>
            </div>
          )}
      </section>
    </div>
  );
}

// --------------------------------------------------
// DETAIL FIELD
// --------------------------------------------------

function DetailField({
  label,
  value,
  sensitive = false,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        {label}

        {sensitive && (
          <span>
            {" "}
            • Sensitive
          </span>
        )}
      </div>

      <div
        style={{
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// --------------------------------------------------
// STATUS BADGE
// --------------------------------------------------

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      style={{
        padding:
          "0.4rem 0.75rem",
        borderRadius:
          "999px",
        backgroundColor:
          "#eee",
        fontWeight: 600,
        whiteSpace:
          "nowrap",
      }}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatStatus(
  status: string
) {
  return status
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString();
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const cardStyle = {
  padding: "1.5rem",
  marginBottom: "1.5rem",
  border:
    "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor:
    "white",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};