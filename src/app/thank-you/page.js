"use client";

import { useState, useEffect } from "react";
import ClientProtection from "../../components/ClientProtection";

export default function ThankYouPage() {
  const [countdown, setCountdown] = useState(5); // 5 seconds
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    // Show checkmark animation after component mounts
    setTimeout(() => setShowCheckmark(true), 500);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to Google when countdown reaches 0
          window.location.href = "https://www.google.com";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <ClientProtection>
      <div className="relative min-h-screen bg-white md:bg-[url('/bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 hidden md:block bg-black/25" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-12 py-16 text-center">
            {/* Animated Checkmark */}
            <div className="mb-8">
              <div
                className={`mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center transition-all duration-1000 ${
                  showCheckmark ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              >
                <svg
                  className={`w-10 h-10 text-green-600 transition-all duration-1000 delay-300 ${
                    showCheckmark
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                    className="animate-draw-check"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
              Verification Successful!
            </h1>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Your identity has been successfully verified. Thank you for using
              our secure authentication system.
            </p>

            {/* Redirect Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-3">
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
                <span className="text-blue-700 font-medium">
                  Automatically redirecting ...
                </span>
              </div>

              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-blue-800 mb-2">
                  {countdown}
                </div>
                <div className="text-sm text-blue-600">
                  You will be automatically redirected in {countdown} seconds
                </div>
              </div>
            </div>

            {/* Manual Redirect Button */}
            <button
              onClick={() => (window.location.href = "https://www.google.com")}
              className="w-full bg-blue-600 text-white rounded-full h-12 font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to Google Now
            </button>

            {/* Security Notice */}
            <p className="text-xs text-gray-500 mt-6 leading-relaxed">
              For your security, this session will automatically redirect you to
              Google. Please do not share this confirmation with anyone.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 100;
          }
          100% {
            stroke-dasharray: 100 0;
          }
        }

        .animate-draw-check {
          stroke-dasharray: 100;
          animation: draw-check 0.8s ease-in-out 0.5s forwards;
        }
      `}</style>
    </ClientProtection>
  );
}
