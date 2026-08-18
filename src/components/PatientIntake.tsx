"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import IntakeForm from "@/components/IntakeForm";

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

  documents: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
}

export default function PatientIntake() {
  const [intakes, setIntakes] =
    useState<Intake[]>([]);

  const [selectedIntake, setSelectedIntake] =
    useState<Intake | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadIntakes =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/intakes",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ??
              "Unable to load applications"
          );

          return;
        }

        setIntakes(data);
      } catch (error) {
        console.error(
          "Failed to load patient intakes:",
          error
        );

        setError(
          "Unable to load your applications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
    async function initialLoad() {
        try {
        const response = await fetch(
            "/api/intakes",
            {
            cache: "no-store",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setError(
            data.error ??
                "Unable to load applications"
            );
            return;
        }

        setIntakes(data);
        } catch (error) {
        console.error(
            "Failed to load patient intakes:",
            error
        );

        setError(
            "Unable to load your applications."
        );
        } finally {
        setLoading(false);
        }
    }

    initialLoad();
    }, []);

  async function handleCreated() {
    setShowForm(false);
    setSelectedIntake(null);

    await loadIntakes();
  }

  if (loading) {
    return (
      <p>
        Loading applications...
      </p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: "1rem",
          backgroundColor: "#fee",
          borderRadius: "6px",
        }}
      >
        {error}
      </div>
    );
  }

  // -------------------------
  // NEW APPLICATION FORM
  // -------------------------

  if (showForm) {
    return (
      <section>
        <button
          type="button"
          onClick={() =>
            setShowForm(false)
          }
          style={{
            marginBottom: "1rem",
          }}
        >
          ← Back to Applications
        </button>

        <h2>
          New Enrollment Application
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "2rem",
          }}
        >
          Complete the form below to submit a
          new clinical trial enrollment
          application.
        </p>

        <IntakeForm
          onCreated={handleCreated}
        />
      </section>
    );
  }

  // -------------------------
  // SELECTED APPLICATION
  // -------------------------

  if (selectedIntake) {
    return (
      <PatientIntakeDetails
        intake={selectedIntake}
        onBack={() =>
          setSelectedIntake(null)
        }
      />
    );
  }

  // -------------------------
  // APPLICATION LIST
  // -------------------------

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: "0.25rem",
            }}
          >
            My Applications
          </h2>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            View your submitted applications
            or create a new one.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowForm(true)
          }
        >
          + New Application
        </button>
      </div>

      {intakes.length === 0 ? (
        <EmptyState
          onCreate={() =>
            setShowForm(true)
          }
        />
      ) : (
        <div>
          {intakes.map(
            (intake) => (
              <PatientIntakeCard
                key={intake.id}
                intake={intake}
                onClick={() =>
                  setSelectedIntake(
                    intake
                  )
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

// --------------------------------------------------
// PATIENT INTAKE CARD
// --------------------------------------------------

function PatientIntakeCard({
  intake,
  onClick,
}: {
  intake: Intake;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "1.25rem",
        marginBottom: "1rem",
        textAlign: "left",
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
            }}
          >
            {intake.clientName}
          </h3>

          <p
            style={{
              margin: "0.35rem 0 0",
              color: "#666",
              fontSize: "0.9rem",
            }}
          >
            Submitted{" "}
            {formatDate(
              intake.createdAt
            )}
          </p>
        </div>

        <StatusBadge
          status={intake.status}
        />
      </div>

      <p
        style={{
          margin: "1rem 0 0",
        }}
      >
        {truncate(
          intake.description,
          120
        )}
      </p>
    </button>
  );
}

// --------------------------------------------------
// PATIENT INTAKE DETAILS
// --------------------------------------------------

function PatientIntakeDetails({
  intake,
  onBack,
}: {
  intake: Intake;
  onBack: () => void;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: "1.5rem",
        }}
      >
        ← Back to My Applications
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: "0.25rem",
            }}
          >
            Application Details
          </h2>

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
          status={intake.status}
        />
      </div>

      <section style={cardStyle}>
        <h3>
          Patient Information
        </h3>

        <div style={gridStyle}>
          <Detail
            label="Full Name"
            value={
              intake.clientName
            }
          />

          <Detail
            label="Email"
            value={
              intake.clientEmail
            }
          />

          <Detail
            label="Phone"
            value={
              intake.clientPhone
            }
          />

          <Detail
            label="Date of Birth"
            value={
              intake.dateOfBirth
            }
          />

          <Detail
            label="Social Security Number"
            value={intake.ssn}
          />
        </div>
      </section>

      <section style={cardStyle}>
        <h3>
          Enrollment Information
        </h3>

        <Detail
          label="Reason for Enrollment / Medical History"
          value={
            intake.description
          }
        />

        <Detail
          label="Additional Notes"
          value={
            intake.notes ||
            "No additional notes"
          }
        />
      </section>

      <section style={cardStyle}>
        <h3>
          Supporting Documents
        </h3>

        {intake.documents.length ===
        0 ? (
          <p>
            No supporting documents uploaded.
          </p>
        ) : (
          <ul>
            {intake.documents.map(
              (document) => (
                <li
                  key={
                    document.id
                  }
                >
                  {document.fileName}{" "}
                  ({formatFileSize(
                    document.fileSize
                  )})
                </li>
              )
            )}
          </ul>
        )}
      </section>
    </section>
  );
}

// --------------------------------------------------
// EMPTY STATE
// --------------------------------------------------

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        padding: "3rem",
        textAlign: "center",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3>
        No applications yet
      </h3>

      <p
        style={{
          color: "#666",
        }}
      >
        Submit your first clinical trial
        enrollment application to get
        started.
      </p>

      <button
        type="button"
        onClick={onCreate}
      >
        Create Application
      </button>
    </div>
  );
}

// --------------------------------------------------
// DETAIL FIELD
// --------------------------------------------------

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
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
      </div>

      <div>
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
        padding: "0.35rem 0.7rem",
        borderRadius: "999px",
        backgroundColor: "#eee",
        fontSize: "0.85rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {formatStatus(status)}
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
    .replaceAll("_", " ")
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

function truncate(
  value: string,
  maxLength: number
) {
  if (
    value.length <= maxLength
  ) {
    return value;
  }

  return `${value.slice(
    0,
    maxLength
  )}...`;
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const cardStyle = {
  padding: "1.5rem",
  marginBottom: "1.5rem",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "white",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};