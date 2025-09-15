import React from "react";
import { useForm } from "react-hook-form";
import { login } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

type Form = { username: string; password: string };

const LoginPage: React.FC = () => {
  const { register, handleSubmit } = useForm<Form>();
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (f: Form) => {
    try {
      const u = await login(f.username, f.password);
      setUser(u);
      if (u.role === "teacher") nav("/teacher");
      else if (u.role === "student") nav("/student");
      else if (u.role === "hod") nav("/hod");
      else nav("/");
    } catch (e: any) {
      setError("Invalid credentials or server error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 border rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full border rounded px-3 py-2"
            {...register("username", { required: true })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            {...register("password", { required: true })}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-black text-white rounded py-2"
        >
          Login
        </button>
      </form>
    </div>
  );
};
export default LoginPage;
