import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import apiClient from "../../api/client";
import { EyeIcon, EyeCloseIcon } from "../../icons";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const token = searchParams.get("token") || "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await apiClient.post("/auth/accept-invite", { token, name, password });
      loginWithToken(res.data.token, res.data.user);
      if (res.data.user.role === "client") navigate("/portal", { replace: true });
      else navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Accept Invitation — Agency Tracker" description="Set up your account" />
      <AuthLayout>
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">Accept your invitation</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set up your name and password to get started.</p>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Full Name <span className="text-error-500">*</span></Label>
                <Input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input type={showPwd ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <span onClick={() => setShowPwd(!showPwd)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                    {showPwd ? <EyeIcon className="fill-gray-500 size-5" /> : <EyeCloseIcon className="fill-gray-500 size-5" />}
                  </span>
                </div>
              </div>
              <Button className="w-full" size="sm" disabled={loading}>{loading ? "Setting up…" : "Create account"}</Button>
            </form>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
