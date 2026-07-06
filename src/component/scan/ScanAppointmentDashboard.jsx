import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

function ScanAppointmentDashboard() {
  const [metrics, setMetrics] = useState({
    todayTotal: 0, morning: 0, afternoon: 0, evening: 0,
    notScheduled: 0, missing: 0, reportNotReady: 0, notReviewed: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await AxiosInstance.get('/scan-prescription/stats');
        if (res.data?.data) setMetrics(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);
  const StatCard = ({ title, value, icon, color, bgGradient, iconBg, iconColor }) => (
    <div className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}>
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
      <div className="p-5 flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <span className="text-3xl font-black text-slate-800">{value}</span>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon icon={icon} className="text-2xl" />
        </div>
      </div>
    </div>
  );

  const PipelineBucket = ({ title, count, description, icon, color }) => (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col gap-5 relative overflow-hidden">
      <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('bg-', 'text-')}`}>
        <Icon icon={icon} className="text-8xl" />
      </div>
      <div className="flex justify-between items-start z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 border border-white shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon icon={icon} className={`text-2xl ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-5xl font-black text-slate-800 tracking-tight">{count}</span>
      </div>
      <div className="flex flex-col z-10">
        <h3 className="text-lg font-black text-slate-700 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 font-bold leading-relaxed pr-6 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-8 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* Header Section */}
        <StaggerItem>
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
            <h1 className="font-black text-slate-800 text-4xl tracking-tight">
              Appointment <span className="text-blue-500">Dashboard</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm tracking-wide">Daily summary of scan center appointments and operational buckets</p>
          </div>
        </StaggerItem>

        {/* Row 1: Current Stats */}
        <StaggerItem>
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Today's Appointment Traffic</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              <StatCard title="Today Total" value={metrics.todayTotal} icon="solar:clipboard-list-bold-duotone" color="bg-blue-500" bgGradient="from-blue-500/10 to-indigo-500/10" iconBg="bg-blue-500/10" iconColor="text-blue-600" />
              <StatCard title="Morning (M)" value={metrics.morning} icon="solar:sun-2-bold-duotone" color="bg-amber-500" bgGradient="from-amber-500/10 to-orange-500/10" iconBg="bg-amber-500/10" iconColor="text-amber-600" />
              <StatCard title="Afternoon (A)" value={metrics.afternoon} icon="solar:clouds-bold-duotone" color="bg-sky-500" bgGradient="from-sky-500/10 to-cyan-500/10" iconBg="bg-sky-500/10" iconColor="text-sky-600" />
              <StatCard title="Evening (E)" value={metrics.evening} icon="solar:moon-bold-duotone" color="bg-indigo-500" bgGradient="from-indigo-500/10 to-violet-500/10" iconBg="bg-indigo-500/10" iconColor="text-indigo-600" />
            </div>
          </div>
        </StaggerItem>

        {/* Row 2: Pipeline Buckets */}
        <StaggerItem>
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mt-4 border-t border-slate-200 pt-6">Operation Buckets & Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PipelineBucket title="Not Scheduled" count={metrics.notScheduled} description="Prescriptions waiting for an assigned slot." icon="solar:calendar-broken-bold-duotone" color="bg-orange-500" />
              <PipelineBucket title="Missing" count={metrics.missing} description="Patients who did not show up for scans." icon="solar:user-cross-bold-duotone" color="bg-red-500" />
              <PipelineBucket title="Report Not Ready" count={metrics.reportNotReady} description="Scans completed but pending final report." icon="solar:document-text-bold-duotone" color="bg-purple-500" />
              <PipelineBucket title="Not Reviewed" count={metrics.notReviewed} description="Reports ready but pending doctor review." icon="solar:eye-broken-bold-duotone" color="bg-pink-500" />
            </div>
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}

export default ScanAppointmentDashboard;