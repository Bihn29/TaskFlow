'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    // FIXED: removed overflow-hidden so page can scroll normally
    <div className="min-h-screen bg-[#090d16] flex flex-col relative">
      {/* Background Decorative Gradients — fixed so they stay in place while scrolling */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/8 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#a855f7]/8 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ===== STICKY HEADER ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </Link>

          {/* Nav links — hidden on mobile, visible md+ */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
            >
              Tính năng
            </Link>
            <Link
              href="#demo-guide"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
            >
              Hướng dẫn
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              Dùng thử miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section
        id="home"
        className="relative flex-1 flex flex-col justify-center min-h-[calc(100vh-73px)] max-w-7xl mx-auto px-6 py-12 lg:py-24 z-10 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              ✨ Kiến trúc Real-time hiện đại
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Quản lý công việc <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                Thời gian thực
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              TaskFlow giúp đội ngũ của bạn tối ưu hiệu năng làm việc với giao diện kéo thả trực quan, đồng bộ hóa tức thì, quản lý phân quyền chuyên nghiệp và báo cáo hoạt động chi tiết.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Scroll to #features */}
              <Link
                href="#features"
                className="flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                Khám phá ngay
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>

              {/* Scroll to #demo-guide */}
              <Link
                href="#demo-guide"
                className="flex items-center justify-center h-13 px-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 transition-all duration-200"
              >
                Xem Demo
              </Link>
            </div>
          </div>

          {/* Right Preview Column (Kanban Board Mockup) */}
          <div className="lg:col-span-5 relative w-full aspect-square sm:aspect-auto sm:h-[450px] rounded-3xl overflow-hidden glass-panel p-6 border border-slate-800 flex flex-col justify-between shadow-2xl animate-fade-in">
            {/* Window chrome header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs text-slate-500 font-mono">board:taskflow-demo</span>
            </div>

            {/* Simulated board list columns */}
            <div className="flex-1 grid grid-cols-2 gap-4 mt-6">
              {/* To-Do Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cần làm (2)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2 card-shadow-hover cursor-pointer">
                  <span className="px-2 py-0.5 text-[10px] w-fit rounded-md bg-indigo-500/10 text-indigo-400 font-semibold">Frontend</span>
                  <p className="text-xs font-bold text-slate-200">Thiết kế UI Dashboard</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">A</div>
                    <span className="text-[10px] text-rose-400 font-semibold">High</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2 card-shadow-hover cursor-pointer">
                  <span className="px-2 py-0.5 text-[10px] w-fit rounded-md bg-emerald-500/10 text-emerald-400 font-semibold">Research</span>
                  <p className="text-xs font-bold text-slate-200">Đọc tài liệu TanStack</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white">M</div>
                    <span className="text-[10px] text-emerald-400 font-semibold">Low</span>
                  </div>
                </div>
              </div>

              {/* Progress Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang làm (1)</span>
                </div>
                <div className="p-4 rounded-xl bg-indigo-900/15 border border-indigo-500/30 flex flex-col gap-2 shadow-lg shadow-indigo-500/5 cursor-pointer">
                  <span className="px-2 py-0.5 text-[10px] w-fit rounded-md bg-violet-500/10 text-violet-400 font-semibold">Backend</span>
                  <p className="text-xs font-bold text-slate-200">Tích hợp Socket.IO</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">Đồng bộ thay đổi danh sách khi kéo thả...</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-950/20">
                    <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] text-white">S</div>
                    <span className="text-[10px] text-amber-400 font-semibold">Medium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative z-10 w-full border-t border-slate-800/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Tính năng
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tính năng nổi bật
            </h2>
            <p className="mt-3 text-slate-400 text-sm max-w-lg mx-auto">
              Mọi thứ bạn cần để quản lý dự án nhóm một cách chuyên nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold mb-2">⚡</div>
              <h3 className="text-lg font-bold text-slate-200">Đồng bộ Real-time</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Mọi thay đổi từ di chuyển task, sửa tên list đến viết comment được gửi tức thì tới tất cả thành viên trong nhóm qua Socket.IO.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-violet-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold mb-2">🛡️</div>
              <h3 className="text-lg font-bold text-slate-200">Phân quyền chi tiết</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hệ thống Role-based Access Control (RBAC) với các quyền OWNER, ADMIN, MEMBER giúp kiểm soát bảo mật tuyệt đối cho workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-emerald-500/30 transition-colors duration-300">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-2">📝</div>
              <h3 className="text-lg font-bold text-slate-200">Lịch sử Hoạt động</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Lưu giữ mọi nhật ký công việc từ thời điểm khởi tạo tới khi hoàn thành giúp nhóm dễ dàng theo dõi tiến độ dự án.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DEMO GUIDE SECTION ===== */}
      <section id="demo-guide" className="relative z-10 w-full border-t border-slate-800/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Hướng dẫn
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hướng dẫn sử dụng
            </h2>
            <p className="mt-3 text-slate-400 text-sm max-w-lg mx-auto">
              Bắt đầu chỉ trong vài phút với quy trình đơn giản.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors duration-300">
              <span className="text-indigo-400 font-extrabold text-3xl">01</span>
              <h4 className="text-base font-bold text-slate-200">Đăng ký tài khoản</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Tạo tài khoản và đăng nhập nhanh chóng để bắt đầu thiết lập không gian làm việc.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-violet-500/30 transition-colors duration-300">
              <span className="text-violet-400 font-extrabold text-3xl">02</span>
              <h4 className="text-base font-bold text-slate-200">Tạo Workspace & Bảng</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Thiết lập Workspace nhóm của bạn, tạo các bảng Kanban tương thích dự án.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-purple-500/30 transition-colors duration-300">
              <span className="text-purple-400 font-extrabold text-3xl">03</span>
              <h4 className="text-base font-bold text-slate-200">Kéo thả & Cộng tác</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Kéo thả tasks trực quan, bình luận và phân vai trò cho thành viên đồng bộ tức thì.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3 hover:border-emerald-500/30 transition-colors duration-300">
              <span className="text-emerald-400 font-extrabold text-3xl">04</span>
              <h4 className="text-base font-bold text-slate-200">Lịch sử & Notifications</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Theo dõi mọi thay đổi qua drawer lịch sử và nhận notification real-time khi được giao việc.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Bắt đầu miễn phí
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 transition-all duration-200"
            >
              Đã có tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} TaskFlow. Build with passion for CV Showcase.
      </footer>

      {/* ===== FLOATING BACK TO TOP BUTTON ===== */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          aria-label="Về đầu trang"
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-sm border border-indigo-500/30 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
          </svg>
          Về đầu trang
        </button>
      )}
    </div>
  );
}
