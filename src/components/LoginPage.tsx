import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { UserItem, AuthSession } from '../types';
import { ORG_NAME } from '../data/initialData';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const users = StorageService.getUsers();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้ใช้งาน หรืออีเมล');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('กรุณาระบุรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await AuthService.login(identifier, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: UserItem) => {
    const session = AuthService.quickLoginAsUser(user);
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-between text-slate-800 p-4 sm:p-6 md:p-8">
      {/* Top Bar Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2.5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006853] text-white flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-wide text-base sm:text-lg flex items-center gap-2">
              <span className="text-[#006853]">{ORG_NAME}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#006853] border border-emerald-300 font-mono whitespace-nowrap font-bold">
                E-PLAN 2571-2575
              </span>
            </div>
            <div className="text-xs text-slate-500">ระบบสารสนเทศเพื่อการบริหารและจัดทำแผนพัฒนาท้องถิ่น</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#006853] shrink-0" />
          <span className="whitespace-nowrap font-semibold">ระบบรักษาความปลอดภัยระดับองค์กร (RBAC)</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left column: Overview & Roles explanation */}
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#006853] text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#006853]" />
            <span>ระบบจัดเก็บและบริหารจัดการแผนเทศบาลเมืองศิลา</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
              เข้าสู่ระบบบริหาร <br />
              <span className="text-[#006853]">
                แผนพัฒนาท้องถิ่น <span className="whitespace-nowrap">(พ.ศ. 2571-2575)</span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
              ศูนย์รวมการจัดทำแผนพัฒนาท้องถิ่น 5 ปี, การเพิ่มเติม เปลี่ยนแปลง แก้ไข, การอนุมัติข้อบัญญัติงบประมาณ
              ตลอดจนระบบติดตามและประเมินผลโครงการตามระเบียบกระทรวงมหาดไทย
            </p>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006853] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#006853]" /> บัญชีทดสอบระบบแยกตามระดับสิทธิ์ (Demo Roles)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">คลิกเพื่อเข้าสู่ระบบทันที</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {users.slice(0, 4).map((u) => {
                const isAdm = u['สิทธิ์การใช้งาน'] === 'ผู้ดูแลระบบ';
                const isExec = u['สิทธิ์การใช้งาน'] === 'ผู้บริหาร/ผู้อนุมัติ';
                return (
                  <button
                    key={u.ID}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200 hover:border-[#00A878] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-[#006853] transition-colors">
                        {u['ชื่อ-สกุล']}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                          isAdm
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isExec
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {u['สิทธิ์การใช้งาน']}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 truncate">
                      {u['ตำแหน่ง']} • {u['หน่วยงาน/กอง']}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)] space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                <Lock className="w-5 h-5 text-[#006853]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">ลงชื่อเข้าสู่ระบบ</h2>
              <p className="text-xs text-slate-500">กรุณาระบุข้อมูลเพื่อเข้าสู่ระบบงานราชการ</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน หรือ อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="เช่น somsak.s@sila.go.th หรือ admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-150 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">รหัสผ่าน</label>
                  <span className="text-[11px] text-slate-500 font-medium">รหัสผ่านเริ่มต้น: admin1234 / user1234</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านเข้าใช้งาน"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 focus:border-[#006853] focus:ring-2 focus:ring-[#006853]/20 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-150 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#006853] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00A878] hover:bg-[#00BD87] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบปฏิบัติงาน</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500">
              ระบบนี้บันทึกข้อมูลและประวัติการเข้าใช้งาน (Audit Trail) ตามมาตรฐานความมั่นคงปลอดภัยสารสนเทศ
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center py-3 text-xs text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear() + 543} {ORG_NAME} • ฝ่ายแผนงานและงบประมาณ กองยุทธศาสตร์และงบประมาณ
      </div>
    </div>
  );
};
