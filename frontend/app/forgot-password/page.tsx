"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "password">("email");

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Use the correct forgetPassword.emailOtp method
      const result = await authClient.forgetPassword.emailOtp({
        email,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset code");
      } else {
        setMessage("Password reset code sent! Please check your inbox.");
        setStep("otp");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check the OTP first (optional step)
      const result = await authClient.emailOtp.checkVerificationOtp({
        email,
        otp,
        type: "forget-password",
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code");
      } else {
        setMessage("Code verified! Please enter your new password.");
        setStep("password");
      }
    } catch (err) {
      setError("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      // Use the emailOTP resetPassword method
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reset password");
      } else {
        setMessage(
          "Password reset successfully! You can now login with your new password."
        );
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err) {
      setError("An error occurred while resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Forgot Password</h1>

      {step === "email" && (
        <div>
          <p>
            Enter your email address and we'll send you a password reset code.
          </p>
          <form onSubmit={sendOTP}>
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
            {message && (
              <div style={{ color: "green", marginBottom: "1rem" }}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "0.5rem 1rem" }}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        </div>
      )}

      {step === "otp" && (
        <div>
          <p>Please enter the 6-digit code sent to {email}</p>
          <form onSubmit={verifyOTP}>
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
            {message && (
              <div style={{ color: "green", marginBottom: "1rem" }}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !otp}
              style={{ padding: "0.5rem 1rem" }}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() =>
                sendOTP({ preventDefault: () => {} } as React.FormEvent)
              }
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

      {step === "password" && (
        <div>
          <p>Enter your new password</p>
          <form onSubmit={resetPassword}>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                New Password:
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                />
              </label>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                Confirm Password:
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
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
            {message && (
              <div style={{ color: "green", marginBottom: "1rem" }}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{ padding: "0.5rem 1rem" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
}
