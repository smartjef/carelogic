"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@healthintel.io");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={handleSubmit} className="w-full border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-800">Healthcare Intelligence Login</h1>
        <p className="mt-1 text-sm text-gray-600">Use demo credentials to access the dashboard.</p>
        <div className="mt-5 space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-4 w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
