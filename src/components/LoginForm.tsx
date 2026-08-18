"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in");
        return;
      }

      if (data.user.role === "PATIENT") {
        router.push("/intake");
        router.refresh();
        return;
      }

      if (data.user.role === "REVIEWER") {
        router.push("/queue");
        router.refresh();
        return;
      }

      setError("Unknown user role");
    } catch (error) {
      console.error("Login failed:", error);

      setError(
        "Something went wrong while signing in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "4rem auto",
        padding: "2rem",
      }}
    >
      <h1>Sign In</h1>

      <p>
        Sign in as a patient or reviewer to continue.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            marginBottom: "1rem",
          }}
        >
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="patient@demo.com"
            required
            autoComplete="email"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p
            role="alert"
            style={{
              color: "red",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "6px",
        }}
      >
        <strong>Demo Accounts</strong>

        <p>
          Patient:
          <br />
          patient@demo.com
        </p>

        <p>
          Reviewer:
          <br />
          reviewer@demo.com
        </p>
      </div>
    </main>
  );
}