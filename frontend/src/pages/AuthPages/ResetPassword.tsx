import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import apiClient from "../../api/client";
import { EyeIcon, EyeCloseIcon } from "../../icons";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Reset Password — Agency Tracker" description="Set a new password" />
      <AuthLayout>
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">Set new password</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a strong password for your account.</p>
            </div>
            {success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 dark:bg-green-500/10 dark:text-green-400">
                Password reset successfully! Redirecting to sign in…
              </div>
            ) : (
              <>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label>New Password <span className="text-error-500">*</span></Label>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <span onClick={() => setShowPwd(!showPwd)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                        {showPwd ? <EyeIcon className="fill-gray-500 size-5" /> : <EyeCloseIcon className="fill-gray-500 size-5" />}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password <span className="text-error-500">*</span></Label>
                    <Input type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </div>
                  <Button className="w-full" size="sm" disabled={loading}>{loading ? "Saving…" : "Reset password"}</Button>
                </form>
              </>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
