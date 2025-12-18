"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      // Auto-send OTP if email is provided
      sendOTP(emailParam);
    }
  }, [searchParams]);

  const sendOTP = async (emailAddress?: string) => {
    const targetEmail = emailAddress || email;
    if (!targetEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use the correct emailOTP method
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: targetEmail,
        type: "email-verification",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send OTP");
      } else {
        setOtpSent(true);
        setError("");
      }
    } catch (err) {
      setError("An error occurred while sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the correct emailOTP method
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message || "Verification failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Verify Email</h1>

      {!otpSent ? (
        <div>
          <p>Enter your email to receive a verification code.</p>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                }}
              />
            </label>
          </div>
          {error && (
            <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
          )}
          <button
            onClick={() => sendOTP()}
            disabled={loading || !email}
            style={{ padding: "0.5rem 1rem" }}
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      ) : (
        <div>
          <p>Please enter the 6-digit code sent to {email}</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                Verification Code:
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="123456"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                />
              </label>
            </div>
            {error && (
              <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !otp}
              style={{ padding: "0.5rem 1rem" }}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => sendOTP()}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                border: "1px solid #ccc",
              }}
            >
              Resend Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
