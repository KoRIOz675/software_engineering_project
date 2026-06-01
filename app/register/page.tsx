"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      // 2. Automatically log them in after successful registration
      const signInRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error("Registration successful, but login failed. Please try logging in.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-zinc-50 dark:bg-black">
    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
      Create an account
  </h2>
  </div>

  <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
  <form className="space-y-6" onSubmit={handleSubmit}>
    {error && (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/50">
        {error}
        </div>
    )}

  <div>
    <label className="block text-sm font-medium leading-6 text-foreground">Name</label>
    <div className="mt-2">
  <input
    type="text"
  required
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-foreground sm:text-sm sm:leading-6 px-3"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium leading-6 text-foreground">Email address</label>
  <div className="mt-2">
  <input
    type="email"
  required
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-foreground sm:text-sm sm:leading-6 px-3"
  />
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium leading-6 text-foreground">Password</label>
    <div className="mt-2">
  <input
    type="password"
  required
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 bg-transparent placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-foreground sm:text-sm sm:leading-6 px-3"
  />
  </div>
  </div>

  <div>
  <button
    type="submit"
  disabled={loading}
  className="flex w-full justify-center rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold leading-6 text-background shadow-sm hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-colors"
    >
    {loading ? "Creating account..." : "Sign up"}
    </button>
    </div>
    </form>

    <p className="mt-10 text-center text-sm text-zinc-500">
    Already have an account?{" "}
    <Link href="/login" className="font-semibold leading-6 text-foreground hover:text-foreground/80">
    Sign in
    </Link>
    </p>
    </div>
    </div>
);
}