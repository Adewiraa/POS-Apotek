"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Skema Validasi Form menggunakan Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState("");

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");

    try {
      // NOTE: Fallback mock login if backend is not ready
      if (data.email === "admin@apotek.com" && data.password === "password") {
        const mockUser = { id: 1, name: "Admin Kasir", email: data.email, role: "admin" };
        setAuth("mock-token-12345", mockUser);
        document.cookie = `token=mock-token-12345; path=/; max-age=86400`;
        router.push("/dashboard");
        return;
      }

      const response = await AuthAPI.login({ email: data.email, password: data.password });
      
      if (response.token) {
        setAuth(response.token, response.user);
        document.cookie = `token=${response.token}; path=/; max-age=86400`; 
        router.push("/dashboard");
      } else {
        setError("Format respons tidak valid dari server.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login gagal. Periksa kembali email dan password Anda.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Pill className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">POS Apotek</span>
          <span className="text-xs text-slate-500 uppercase tracking-widest leading-none">Modern</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Selamat Datang</CardTitle>
          <CardDescription>
            Silakan login dengan akun staf atau apoteker Anda. (Demo: admin@apotek.com / password)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="kasir@apotek.com" 
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Lupa password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-md transition-all"
              disabled={isSubmitting}
            >
              <KeyRound className="mr-2 h-4 w-4" /> 
              {isSubmitting ? "Memverifikasi..." : "Masuk"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="absolute bottom-8 text-center text-xs text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} POS Apotek Modern. All rights reserved.
      </p>
    </div>
  );
}
