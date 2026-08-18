"use client";

import {
  ChangeEvent,
  useState,
} from "react";

interface DocumentUploadProps {
  intakeId: string;

  onUploaded: () => void;
}

export default function DocumentUpload({
  intakeId,
  onUploaded,
}: DocumentUploadProps) {
  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [
    description,
    setDescription,
  ] = useState("");

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target
        .files?.[0] ??
      null;

    setFile(selected);
    setError("");
  }

  async function handleUpload() {
    if (!file) {
      setError(
        "Please choose a file"
      );

      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      if (
        description.trim()
      ) {
        formData.append(
          "description",
          description.trim()
        );
      }

      const response =
        await fetch(
          `/api/intakes/${intakeId}/documents`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to upload document"
        );

        return;
      }

      setFile(null);
      setDescription("");

      onUploaded();
    } catch (error) {
      console.error(
        "Upload failed:",
        error
      );

      setError(
        "Unable to upload document"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          marginBottom:
            "1rem",
        }}
      >
        <label
          htmlFor="document"
          style={{
            display:
              "block",
            marginBottom:
              "0.5rem",
            fontWeight: 600,
          }}
        >
          Supporting Document
        </label>

        <input
          id="document"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={
            handleFileChange
          }
          disabled={
            uploading
          }
        />
      </div>

      <div
        style={{
          marginBottom:
            "1rem",
        }}
      >
        <label
          htmlFor="document-description"
          style={{
            display:
              "block",
            marginBottom:
              "0.5rem",
            fontWeight: 600,
          }}
        >
          Description
          (optional)
        </label>

        <input
          id="document-description"
          type="text"
          value={
            description
          }
          onChange={(
            event
          ) =>
            setDescription(
              event.target
                .value
            )
          }
          disabled={
            uploading
          }
          placeholder="e.g. Recent lab results"
          style={{
            width: "100%",
            padding:
              "0.75rem",
            boxSizing:
              "border-box",
          }}
        />
      </div>

      {file && (
        <p
          style={{
            color: "#666",
          }}
        >
          Selected:{" "}
          {file.name} (
          {formatFileSize(
            file.size
          )}
          )
        </p>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding:
              "0.75rem",
            marginBottom:
              "1rem",
            backgroundColor:
              "#fee",
            borderRadius:
              "6px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={
          handleUpload
        }
        disabled={
          uploading ||
          !file
        }
      >
        {uploading
          ? "Uploading..."
          : "Upload Document"}
      </button>
    </div>
  );
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