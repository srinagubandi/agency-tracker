import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        loginWithToken(token, user);
        if (user.role === "client") navigate("/portal", { replace: true });
        else navigate("/", { replace: true });
      } catch {
        navigate("/signin", { replace: true });
      }
    } else {
      navigate("/signin", { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
