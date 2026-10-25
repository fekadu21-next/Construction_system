import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { verifyEmail, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!token) {
      setError("Invalid verification token");
      return;
    }

    setLoading(true);
    setError("");

    const result = await verifyEmail(token);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    const email = prompt("Enter your email address to resend verification link:");
    if (!email) return;

    setLoading(true);
    setError("");

    const result = await resendVerificationEmail(email);

    setLoading(false);

    if (result.success) {
      alert("A verification link has been sent to your email.");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h1>
            <p className="text-gray-600">Verify your email address to continue</p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="font-medium">Email Verified Successfully!</p>
                    <p className="text-sm">You can now sign in to your account.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:underline disabled:opacity-50 transition-colors"
                >
                  Resend verification email
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm text-gray-600 hover:text-gray-700 focus:outline-none focus:underline transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
