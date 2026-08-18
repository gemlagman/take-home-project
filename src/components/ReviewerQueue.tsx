"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type QueueType =
  | "open"
  | "assigned"
  | "completed";

interface IntakeSummary {
  id: string;

  clientName: string;
  clientEmail: string;

  description: string;

  status: string;

  createdAt: string;
  updatedAt: string;

  reviewer?: {
    id: string;
    name: string;
  } | null;
}

export default function ReviewerQueue() {
  const router = useRouter();

  const [activeQueue, setActiveQueue] =
    useState<QueueType>("open");

  const [intakes, setIntakes] =
    useState<IntakeSummary[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadQueue =
    useCallback(
      async (queue: QueueType) => {
        setLoading(true);
        setError("");

        try {
          const response = await fetch(
            `/api/intakes?queue=${queue}`,
            {
              cache: "no-store",
            }
          );

          if (response.status === 401) {
            router.push("/login");
            return;
          }

          if (response.status === 403) {
            router.push("/intake");
            return;
          }

          const data =
            await response.json();

          if (!response.ok) {
            setError(
              data.error ??
                "Unable to load queue"
            );

            return;
          }

          setIntakes(data);
        } catch (error) {
          console.error(
            "Failed to load queue:",
            error
          );

          setError(
            "Unable to load applications."
          );
        } finally {
          setLoading(false);
        }
      },
      [router]
    );

    useEffect(() => {
    async function initialLoad() {
        try {
        const response = await fetch(
            `/api/intakes?queue=${activeQueue}`,
            {
            cache: "no-store",
            }
        );

        if (response.status === 401) {
            router.push("/login");
            return;
        }

        if (response.status === 403) {
            router.push("/intake");
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            setError(
            data.error ??
                "Unable to load queue"
            );
            return;
        }

        setIntakes(data);
        } catch (error) {
        console.error(
            "Failed to load queue:",
            error
        );

        setError(
            "Unable to load applications."
        );
        } finally {
        setLoading(false);
        }
    }

    initialLoad();
    }, [
    activeQueue,
    router,
    ]);

  function changeQueue(
    queue: QueueType
  ) {
    setActiveQueue(queue);
  }

  return (
    <section>
      <QueueTabs
        activeQueue={activeQueue}
        onChange={changeQueue}
      />

      <div
        style={{
          marginTop: "2rem",
        }}
      >
        <QueueHeading
          queue={activeQueue}
        />

        {loading && (
          <p>
            Loading applications...
          </p>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "#fee",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          intakes.length === 0 && (
            <EmptyQueue
              queue={activeQueue}
            />
          )}

        {!loading &&
          !error &&
          intakes.length > 0 && (
            <div>
              {intakes.map(
                (intake) => (
                  <IntakeCard
                    key={intake.id}
                    intake={intake}
                    onClick={() =>
                      router.push(
                        `/queue/${intake.id}`
                      )
                    }
                  />
                )
              )}
            </div>
          )}
      </div>
    </section>
  );
}

function QueueTabs({
  activeQueue,
  onChange,
}: {
  activeQueue: QueueType;

  onChange: (
    queue: QueueType
  ) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        borderBottom:
          "1px solid #ddd",
      }}
    >
      <QueueTab
        label="Open"
        queue="open"
        activeQueue={
          activeQueue
        }
        onChange={onChange}
      />

      <QueueTab
        label="Assigned"
        queue="assigned"
        activeQueue={
          activeQueue
        }
        onChange={onChange}
      />

      <QueueTab
        label="Completed"
        queue="completed"
        activeQueue={
          activeQueue
        }
        onChange={onChange}
      />
    </div>
  );
}

function QueueTab({
  label,
  queue,
  activeQueue,
  onChange,
}: {
  label: string;
  queue: QueueType;
  activeQueue: QueueType;

  onChange: (
    queue: QueueType
  ) => void;
}) {
  const active =
    activeQueue === queue;

  return (
    <button
      type="button"
      onClick={() =>
        onChange(queue)
      }
      style={{
        padding:
          "0.75rem 1.25rem",

        border: "none",

        borderBottom:
          active
            ? "3px solid black"
            : "3px solid transparent",

        backgroundColor:
          "transparent",

        fontWeight:
          active ? 700 : 400,

        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function QueueHeading({
  queue,
}: {
  queue: QueueType;
}) {
  if (queue === "open") {
    return (
      <>
        <h2>
          Open Applications
        </h2>

        <p
          style={{
            color: "#666",
          }}
        >
          Unassigned applications
          available for review.
        </p>
      </>
    );
  }

  if (queue === "assigned") {
    return (
      <>
        <h2>
          Assigned to Me
        </h2>

        <p
          style={{
            color: "#666",
          }}
        >
          Applications you are
          currently reviewing.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>
        Completed Applications
      </h2>

      <p
        style={{
          color: "#666",
        }}
      >
        Applications you have
        approved or rejected.
      </p>
    </>
  );
}

function IntakeCard({
  intake,
  onClick,
}: {
  intake: IntakeSummary;
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

        border:
          "1px solid #ddd",

        borderRadius: "8px",

        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

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
              margin:
                "0.25rem 0 0",

              color: "#666",
            }}
          >
            {intake.clientEmail}
          </p>
        </div>

        <StatusBadge
          status={
            intake.status
          }
        />
      </div>

      <p
        style={{
          margin:
            "1rem 0",
        }}
      >
        {truncate(
          intake.description,
          150
        )}
      </p>

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          gap: "1rem",

          color: "#666",

          fontSize: "0.875rem",
        }}
      >
        <span>
          Submitted{" "}
          {formatDate(
            intake.createdAt
          )}
        </span>

        {intake.reviewer && (
          <span>
            Reviewer:{" "}
            {
              intake.reviewer
                .name
            }
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyQueue({
  queue,
}: {
  queue: QueueType;
}) {
  let message =
    "No applications.";

  if (queue === "open") {
    message =
      "There are no open applications waiting to be claimed.";
  }

  if (queue === "assigned") {
    message =
      "You do not have any applications currently under review.";
  }

  if (queue === "completed") {
    message =
      "You have not completed any applications yet.";
  }

  return (
    <div
      style={{
        padding: "3rem",

        textAlign: "center",

        border:
          "1px solid #ddd",

        borderRadius: "8px",
      }}
    >
      <p>{message}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      style={{
        padding:
          "0.35rem 0.7rem",

        borderRadius:
          "999px",

        backgroundColor:
          "#eee",

        fontSize:
          "0.85rem",

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
    value.length <=
    maxLength
  ) {
    return value;
  }

  return `${value.slice(
    0,
    maxLength
  )}...`;
}