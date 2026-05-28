'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { authService } from '../../services/auth.service';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email({ message: 'Email không đúng định dạng' }),
  password: zod.string().min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
});

type LoginFields = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const response = await authService.login(data.email, data.password);
      localStorage.setItem('accessToken', response.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-600/20 text-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200">
              TF
            </div>
          </Link>
          <h2 className="text-2xl font-bold font-sans text-white tracking-tight">Chào mừng quay trở lại</h2>
          <p className="text-neutral-400 text-sm">Đăng nhập tài khoản TaskFlow của bạn</p>
        </div>

        {apiError && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
              <input
                type="email"
                placeholder="developer@taskflow.com"
                className="w-full bg-[#0b0f19] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none transition-all duration-200"
                {...register('email')}
              />
            </div>
            {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0b0f19] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none transition-all duration-200"
                {...register('password')}
              />
            </div>
            {errors.password && <span className="text-red-400 text-xs">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Đăng nhập <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-400">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
