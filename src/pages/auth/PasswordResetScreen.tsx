import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordReset } from "../../services/firebaseAuthService";
import { BarChart3 } from "lucide-react";

const PasswordResetScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-gray-200">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 p-4 border border-green-200">
              <div className="text-sm text-green-700">
                Password reset email sent! Please check your inbox.
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-colors"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending reset link...
                </div>
              ) : (
                "Send reset link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetScreen; 