"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

interface IntakeFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes: string;
}

interface IntakeFormProps {
  onCreated: () => void;
}

const initialForm: IntakeFormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  dateOfBirth: "",
  ssn: "",
  description: "",
  notes: "",
};

export default function IntakeForm({
  onCreated,
}: IntakeFormProps) {
  const [form, setForm] =
    useState<IntakeFormData>(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/intakes", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to submit application"
        );

        return;
      }

      setForm(initialForm);

      onCreated();
    } catch (error) {
      console.error(
        "Submission failed:",
        error
      );

      setError(
        "Something went wrong while submitting your application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Full Name"
        name="clientName"
        value={form.clientName}
        onChange={handleChange}
      />

      <FormField
        label="Email"
        name="clientEmail"
        type="email"
        value={form.clientEmail}
        onChange={handleChange}
      />

      <FormField
        label="Phone Number"
        name="clientPhone"
        type="tel"
        placeholder="925-555-1234"
        value={form.clientPhone}
        onChange={handleChange}
      />

      <FormField
        label="Date of Birth"
        name="dateOfBirth"
        type="date"
        value={form.dateOfBirth}
        onChange={handleChange}
      />

      <FormField
        label="Social Security Number"
        name="ssn"
        placeholder="123-45-6789"
        value={form.ssn}
        onChange={handleChange}
      />

      <div style={fieldContainerStyle}>
        <label
          htmlFor="description"
          style={labelStyle}
        >
          Reason for Enrollment / Medical History
        </label>

        <textarea
          id="description"
          name="description"
          required
          rows={5}
          value={form.description}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div style={fieldContainerStyle}>
        <label
          htmlFor="notes"
          style={labelStyle}
        >
          Additional Notes
        </label>

        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#fee",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Submitting..."
          : "Submit Application"}
      </button>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  name: keyof IntakeFormData;
  value: string;
  type?: string;
  placeholder?: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}

function FormField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  onChange,
}: FormFieldProps) {
  return (
    <div style={fieldContainerStyle}>
      <label
        htmlFor={name}
        style={labelStyle}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={inputStyle}
      />
    </div>
  );
}

const fieldContainerStyle = {
  marginBottom: "1rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  boxSizing: "border-box" as const,
};