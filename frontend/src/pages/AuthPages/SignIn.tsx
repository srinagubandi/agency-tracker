/**
 * Sign In Page — Agency Tracker
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === "client") navigate("/portal", { replace: true });
      else navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Sign In — Agency Tracker" description="Sign in to Agency Tracker" />
      <AuthLayout>
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">Sign in to Agency Tracker</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your credentials to access your account</p>
            </div>

            <button
              onClick={() => { window.location.href = "/api/v1/auth/google"; }}
              className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 w-full mb-4"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.999 10.2217C20.0111 9.53428 19.9387 8.84788 19.7834 8.17737H10.2031V11.8884H15.8266C15.7201 12.5391 15.4804 13.162 15.1219 13.7195C14.7634 14.2771 14.2935 14.7578 13.7405 15.1328L13.7209 15.2571L16.7502 17.5568L16.96 17.5774C18.8873 15.8329 19.9986 13.2661 19.9986 10.2217" fill="#4285F4" />
                <path d="M10.2055 19.9999C12.9605 19.9999 15.2734 19.111 16.9629 17.5777L13.7429 15.1331C12.8813 15.7221 11.7248 16.1333 10.2055 16.1333C8.91513 16.1259 7.65991 15.7205 6.61791 14.9745C5.57592 14.2286 4.80007 13.1801 4.40044 11.9777L4.28085 11.9877L1.13101 14.3765L1.08984 14.4887C1.93817 16.1456 3.24007 17.5386 4.84997 18.5118C6.45987 19.4851 8.31429 20.0004 10.2059 19.9999" fill="#34A853" />
                <path d="M4.39899 11.9777C4.1758 11.3411 4.06063 10.673 4.05807 9.99996C4.06218 9.32799 4.1731 8.66075 4.38684 8.02225L4.38115 7.88968L1.19269 5.4624L1.0884 5.51101C0.372763 6.90343 0 8.4408 0 9.99987C0 11.5589 0.372763 13.0963 1.0884 14.4887L4.39899 11.9777Z" fill="#FBBC05" />
                <path d="M10.2059 3.86663C11.668 3.84438 13.0822 4.37803 14.1515 5.35558L17.0313 2.59996C15.1843 0.901848 12.7383 -0.0298855 10.2059 -3.6784e-05C8.31431 -0.000477834 6.4599 0.514732 4.85001 1.48798C3.24011 2.46124 1.9382 3.85416 1.08984 5.51101L4.38946 8.02225C4.79303 6.82005 5.57145 5.77231 6.61498 5.02675C7.65851 4.28118 8.9145 3.87541 10.2059 3.86663Z" fill="#EB4335" />
              </svg>
              Sign in with Google <span className="text-xs text-gray-400">(internal staff)</span>
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-gray-900 text-gray-400">Or sign in with email</span></div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input type="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                    {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">Forgot password?</Link>
              </div>
              <Button className="w-full" size="sm" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
            </form>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
