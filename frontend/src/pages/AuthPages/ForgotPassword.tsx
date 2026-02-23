import { useState } from "react";
import { Link } from "react-router";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import apiClient from "../../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Forgot Password — Agency Tracker" description="Reset your password" />
      <AuthLayout>
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">Forgot your password?</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we'll send you a reset link.</p>
            </div>
            {sent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400">
                <p className="font-medium">Check your email</p>
                <p className="text-sm mt-1">If an account exists for {email}, you'll receive a password reset link shortly.</p>
              </div>
            ) : (
              <>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label>Email <span className="text-error-500">*</span></Label>
                    <Input type="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <Button className="w-full" size="sm" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
                </form>
              </>
            )}
            <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
              Remember your password? <Link to="/signin" className="text-brand-500 hover:text-brand-600">Sign in</Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
