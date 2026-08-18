interface AuditEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;

  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface AuditLogProps {
  entries: AuditEntry[];
}

export default function AuditLog({
  entries,
}: AuditLogProps) {
  return (
    <section>
      <h2
        style={{
          marginTop: 0,
        }}
      >
        Audit Trail
      </h2>

      {entries.length === 0 ? (
        <p
          style={{
            color: "#666",
          }}
        >
          No activity has been recorded.
        </p>
      ) : (
        <div>
          {entries.map(
            (entry) => (
              <AuditEntry
                key={entry.id}
                entry={entry}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function AuditEntry({
  entry,
}: {
  entry: AuditEntry;
}) {
  return (
    <div
      style={{
        padding:
          "1rem 0",
        borderBottom:
          "1px solid #ddd",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "1rem",
          alignItems:
            "flex-start",
        }}
      >
        <div>
          <strong>
            {getActionLabel(
              entry.action
            )}
          </strong>

          <div
            style={{
              marginTop:
                "0.25rem",
              color: "#666",
              fontSize:
                "0.9rem",
            }}
          >
            {entry.user.name}
          </div>
        </div>

        <time
          style={{
            color: "#666",
            fontSize:
              "0.85rem",
            whiteSpace:
              "nowrap",
          }}
        >
          {formatDateTime(
            entry.createdAt
          )}
        </time>
      </div>

      <AuditDetails
        action={
          entry.action
        }
        details={
          entry.details
        }
      />
    </div>
  );
}

function AuditDetails({
  action,
  details,
}: {
  action: string;
  details: string | null;
}) {
  if (!details) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(details);

    if (
      action === "CREATED"
    ) {
      return (
        <p style={detailStyle}>
          Application created with
          status{" "}
          <strong>
            {formatValue(
              parsed.status
            )}
          </strong>
        </p>
      );
    }

    if (
      action ===
      "STATUS_CHANGED"
    ) {
      return (
        <p style={detailStyle}>
          Status changed from{" "}
          <strong>
            {formatValue(
              parsed.from
            )}
          </strong>{" "}
          to{" "}
          <strong>
            {formatValue(
              parsed.to
            )}
          </strong>
        </p>
      );
    }

    if (
      action === "ASSIGNED"
    ) {
      return (
        <p style={detailStyle}>
          Assigned to{" "}
          <strong>
            {parsed.reviewerName ??
              "reviewer"}
          </strong>
        </p>
      );
    }

    if (
      action === "VIEWED"
    ) {
      return (
        <p style={detailStyle}>
          Viewed application in{" "}
          <strong>
            {formatValue(
              parsed.view
            )}
          </strong>{" "}
          mode
        </p>
      );
    }

    if (
      action ===
      "DOCUMENT_UPLOADED"
    ) {
      return (
        <p style={detailStyle}>
          Uploaded{" "}
          <strong>
            {parsed.fileName ??
              "supporting document"}
          </strong>
        </p>
      );
    }

    return null;
  } catch {
    return (
      <p style={detailStyle}>
        {details}
      </p>
    );
  }
}

function getActionLabel(
  action: string
) {
  switch (action) {
    case "CREATED":
      return "Application Created";

    case "VIEWED":
      return "Privileged Information Viewed";

    case "ASSIGNED":
      return "Reviewer Assigned";

    case "STATUS_CHANGED":
      return "Status Changed";

    case "DOCUMENT_UPLOADED":
      return "Document Uploaded";

    default:
      return formatValue(
        action
      );
  }
}

function formatValue(
  value?: string
) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function formatDateTime(
  date: string
) {
  return new Date(
    date
  ).toLocaleString();
}

const detailStyle = {
  margin:
    "0.5rem 0 0",
  color: "#555",
  fontSize: "0.9rem",
};