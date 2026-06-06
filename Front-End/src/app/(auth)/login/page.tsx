"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2, FlaskConical } from "lucide-react";
import { AuthAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    try {
      // Demo bypass
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
    <div className="min-h-screen flex bg-white">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-500 to-sky-500 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-sky-400/20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-2xl text-white tracking-tight">Pharmify</span>
            <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Pharmacy Management</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Kelola apotek Anda<br />dengan lebih cerdas.
          </h2>
          <p className="text-teal-100 text-base font-medium leading-relaxed max-w-sm">
            Platform manajemen apotek terintegrasi — dari transaksi kasir, stok obat, hingga laporan penjualan real-time.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: "Transaksi", value: "POS Kasir" },
              { label: "Integrasi", value: "SATUSEHAT" },
              { label: "Laporan", value: "Real-time" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="font-black text-white text-sm">{f.value}</div>
                <div className="text-teal-200 text-xs mt-1">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-teal-200 text-xs font-medium">
          &copy; {new Date().getFullYear()} Pharmify. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-sky-500 rounded-xl flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">Pharmify</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang</h1>
            <p className="text-slate-500 mt-2 font-medium">Masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          {/* Demo hint */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-[16px]">
            <ShieldCheck className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-teal-800 uppercase tracking-widest">Akun Demo</p>
              <p className="text-xs font-bold text-teal-700 mt-0.5">
                admin@apotek.com &nbsp;/&nbsp; password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-[14px]">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="kasir@apotek.com"
                {...register("email")}
                className={`w-full h-12 px-4 rounded-[14px] border font-bold text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${errors.email ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}
              />
              {errors.email && <p className="text-xs font-bold text-rose-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Password</label>
                <a href="#" className="text-xs font-bold text-teal-600 hover:text-teal-500 transition-colors">
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full h-12 px-4 pr-12 rounded-[14px] border font-bold text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${errors.password ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-bold text-rose-500">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 bg-gradient-to-br from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 text-white rounded-[14px] font-black text-sm shadow-lg shadow-teal-500/25 border-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi...</>
              ) : (
                "Masuk ke Pharmify"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
