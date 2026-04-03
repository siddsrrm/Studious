import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth-changed"));
      getSocket();
      navigate("/");
    } else {
      navigate("/login");
    }
  }, []);

  return <p>Signing you in...</p>;
}