import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";
import PatientDetailsTable from "../../../component/dashboard/PatientDetailsTable";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        const clinicId = user?.clinicId || "";
        const doctorId = user?._id || "";
        const doctorName = user?.userName || "";
        const res = await AxiosInstance.get(
          `/business-tool/dashboard-v2?clinicId=${clinicId}&doctorId=${doctorId}&doctorName=${doctorName}`,
        );
        if (res.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currentDate = new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const patientStats = dashboardData?.patientStats || null;
  const nextPatient = dashboardData?.nextPatient || null;
  const morningAppointments = dashboardData?.morningAppointments || [];
  const afternoonAppointments = dashboardData?.afternoonAppointments || [];
  const eveningAppointments = dashboardData?.eveningAppointments || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-screen bg-[#F4F7FF]">
        <div className="flex flex-col items-center gap-4">
          <Icon
            icon="solar:spinner-linear"
            className="animate-spin text-[#2952E3] text-5xl"
          />
          <span className="text-slate-500 text-lg font-medium animate-pulse">
            Curating your dashboard...
          </span>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, subValue, total, icon, color, bgGradient, iconBg, iconColor }) => (
    <div
      className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-2xl hover:scale-[1.02] transition-all duration-300`}
    >
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />

      <div className="p-6 flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{subValue}</span>
            <span className="text-sm font-medium text-slate-400 opacity-80">
              / {total}
            </span>
          </div>
          <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-1 overflow-hidden shadow-inner">
            <div
              className={`h-full ${color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`}
              style={{ width: `${total > 0 ? (subValue / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        <div className={`w-16 h-16 ml-4 shrink-0 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon icon={icon} className="text-3xl" />
        </div>
      </div>
    </div>
  );

  const PatientListColumn = ({ title, appointments, icon, accentColor }) => (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm rounded-3xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={`p-1.5 rounded-lg ${accentColor} bg-opacity-10`}>
          <Icon
            icon={icon}
            className={accentColor.replace("bg-", "text-")}
            width={18}
          />
        </div>
        <h4 className="text-slate-700 font-bold text-sm">{title}</h4>
        <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100">
          {appointments.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar max-h-80">
        {appointments.length > 0 ? (
          appointments.map((apt, i) => (
            <div
              key={apt._id || i}
              onClick={() => navigate(`/patient-details/${apt.patientId}`)}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-50 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <Icon
                  icon="solar:user-circle-bold-duotone"
                  className="text-slate-300 text-3xl"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-slate-800 text-[13px] font-bold truncate">
                  {apt.name}
                </span>
                <span className="text-slate-400 text-[11px] truncate">
                  {apt.time || "Ongoing"}
                </span>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  ["Completed", "Checked-out"].includes(apt.status)
                    ? "bg-green-400"
                    : "bg-blue-400"
                }`}
              ></div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
            <Icon icon="solar:calendar-minimalistic-linear" width={32} />
            <span className="text-xs font-medium">No appointments</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* HEADER SECTION */}
        <StaggerItem>
          <div className="flex flex-col lg:flex-row justify-between rounded items-start lg:items-center gap-8">
            <div className="flex flex-col">
              <h1 className="font-black text-slate-800 text-4xl tracking-tight">
                Appointment Status <span className="text-blue-500">Dashboard</span>
              </h1>
              <h1 className="font-black text-slate-800 text-xl tracking-tight">
                Doctor Dashboard
              </h1>
              <p className="text-slate-500 font-medium mt-2 tracking-wide uppercase text-[10px]">
                Welcome back! Here's what's happening today,{" "}
                <span className="text-[#2040B0] font-bold">{currentDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-200 shadow-inner rounded w-fit">
              <h1 className="text-slate-500 text-[10px] uppercase font-black tracking-widest pl-2 pr-1">
                Quick Links:
              </h1>
              <button
                onClick={() => navigate("/book-appointment")}
                className="px-5 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 bg-white shadow-sm text-slate-800 border border-slate-200 hover:text-blue-600"
              >
                Internal Appointment
              </button>
              <button
                onClick={() => navigate("/PHNAppointments")}
                className="px-5 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 bg-white shadow-sm text-slate-800 border border-slate-200 hover:text-blue-600"
              >
                Web Appointment
              </button>
              <button
                onClick={() => navigate("/next-review")}
                className="px-5 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 bg-white shadow-sm text-slate-800 border border-slate-200 hover:text-blue-600"
              >
                Next Review & Apt
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* ROW 1: PERFORMANCE CARDS */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title="Today's Appointment Total"
              subValue={patientStats?.todayCompletedAppointments || 0}
              total={patientStats?.todayTotalAppointments || 0}
              icon="solar:clipboard-list-bold-duotone"
              color="bg-blue-500"
              bgGradient="from-blue-500/10 to-indigo-500/10"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Morning Appointments"
              subValue={patientStats?.morning?.completed || 0}
              total={patientStats?.morning?.total || 0}
              icon="solar:sun-2-bold-duotone"
              color="bg-amber-500"
              bgGradient="from-amber-500/10 to-orange-500/10"
              iconBg="bg-amber-500/10"
              iconColor="text-amber-600"
            />
            <StatCard
              title="Afternoon Appointments"
              subValue={patientStats?.afternoon?.completed || 0}
              total={patientStats?.afternoon?.total || 0}
              icon="solar:clouds-bold-duotone"
              color="bg-sky-500"
              bgGradient="from-sky-500/10 to-cyan-500/10"
              iconBg="bg-sky-500/10"
              iconColor="text-sky-600"
            />
            <StatCard
              title="Evening Appointments"
              subValue={patientStats?.evening?.completed || 0}
              total={patientStats?.evening?.total || 0}
              icon="solar:moon-bold-duotone"
              color="bg-indigo-500"
              bgGradient="from-indigo-500/10 to-violet-500/10"
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-600"
            />
          </div>
        </StaggerItem>

        {/* ROW 2: MAIN WORKSPACE */}
        <StaggerItem>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[40px] p-8 text-slate-800 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden h-full min-h-112.5">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      Next Patient
                    </span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      #{nextPatient?.patientId?.slice(-6) || "ID"}
                    </span>
                  </div>

                  {nextPatient ? (
                    <>
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 p-1 shadow-sm overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                          {nextPatient.photo ? (
                            <img
                              src={nextPatient.photo}
                              className="w-full h-full object-cover rounded-[20px]"
                              alt=""
                            />
                          ) : (
                            <Icon
                              icon="solar:user-circle-bold-duotone"
                              className="text-slate-300 text-6xl"
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                            {nextPatient.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-blue-600 font-bold text-sm">
                              {nextPatient.time}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span className="text-slate-500 font-medium text-sm truncate max-w-37.5">
                              {nextPatient.diagnosis}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-4xl p-6 mb-8 border border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            Gender
                          </span>
                          <span className="font-bold text-slate-700 text-sm">
                            {nextPatient.profile?.sex || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            Status
                          </span>
                          <span className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            {nextPatient.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            History
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {nextPatient.profile?.historyTags?.length > 0 ? (
                              nextPatient.profile.historyTags
                                .slice(0, 3)
                                .map((tag, i) => (
                                  <span
                                    key={i}
                                    className="bg-white text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-200 shadow-sm"
                                  >
                                    {tag}
                                  </span>
                                ))
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                No history recorded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-4">
                        <button
                          onClick={() =>
                            navigate(`/patient-details/${nextPatient?.patientId}`)
                          }
                          className="bg-white text-slate-700 border border-slate-200 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() =>
                            window.open(
                              `https://wa.me/${nextPatient.profile?.phone}`,
                              "_blank",
                            )
                          }
                          className="bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#20bd5c] transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Icon icon="ic:baseline-whatsapp" width={20} />
                          WhatsApp
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-blue-200/50 gap-4 mt-10">
                      <Icon
                        icon="solar:user-block-bold-duotone"
                        width={64}
                        className="opacity-20"
                      />
                      <span className="font-medium">
                        No more patients scheduled
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-100">
              <PatientListColumn
                title="Morning"
                appointments={morningAppointments}
                icon="solar:sun-2-bold-duotone"
                accentColor="bg-amber-500"
              />
              <PatientListColumn
                title="Afternoon"
                appointments={afternoonAppointments}
                icon="solar:clouds-bold-duotone"
                accentColor="bg-sky-500"
              />
              <PatientListColumn
                title="Evening"
                appointments={eveningAppointments}
                icon="solar:moon-bold-duotone"
                accentColor="bg-indigo-600"
              />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mt-4">
            {[
              { label: "Tomorrow", count: patientStats?.tomorrowCount || 0, icon: "solar:calendar-mark-linear", color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
              { label: "This Week", count: patientStats?.thisWeekCount || 0, icon: "solar:calendar-bold-duotone", color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
              { label: "Next Week", count: patientStats?.nextWeekCount || 0, icon: "solar:calendar-line-duotone", color: "bg-orange-500", bgGradient: "from-orange-500/10 to-amber-500/10", iconBg: "bg-orange-500/10", iconColor: "text-orange-600" },
              { label: "This Month", count: patientStats?.thisMonthCount || 0, icon: "solar:chart-square-bold-duotone", color: "bg-rose-500", bgGradient: "from-rose-500/10 to-pink-500/10", iconBg: "bg-rose-500/10", iconColor: "text-rose-600" },
            ].map((c, i) => (
              <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}>
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
                <div className="p-5 flex items-center justify-between z-10 relative">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                    <span className="text-3xl font-black text-slate-800">{c.count}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} group-hover:scale-110 transition-transform`}>
                    <Icon icon={c.icon} className="text-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="mt-8">
            <h2 className="text-xl font-black text-slate-800 mb-4">Web Appointments</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
              {[
                { label: "Today", count: patientStats?.webTodayCount || 0, icon: "solar:calendar-date-bold-duotone", color: "bg-purple-500", bgGradient: "from-purple-500/10 to-fuchsia-500/10", iconBg: "bg-purple-500/10", iconColor: "text-purple-600" },
                { label: "Tomorrow", count: patientStats?.webTomorrowCount || 0, icon: "solar:calendar-mark-linear", color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
                { label: "This Week", count: patientStats?.webThisWeekCount || 0, icon: "solar:calendar-bold-duotone", color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
                { label: "Next Week", count: patientStats?.webNextWeekCount || 0, icon: "solar:calendar-line-duotone", color: "bg-orange-500", bgGradient: "from-orange-500/10 to-amber-500/10", iconBg: "bg-orange-500/10", iconColor: "text-orange-600" },
                { label: "This Month", count: patientStats?.webThisMonthCount || 0, icon: "solar:chart-square-bold-duotone", color: "bg-rose-500", bgGradient: "from-rose-500/10 to-pink-500/10", iconBg: "bg-rose-500/10", iconColor: "text-rose-600" },
              ].map((c, i) => (
                <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}>
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
                  <div className="p-4 flex items-center justify-between z-10 relative">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                      <span className="text-2xl font-black text-slate-800">{c.count}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon icon={c.icon} className="text-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* ROW 4: PATIENT DETAILS TABLE */}
        <StaggerItem>
           <PatientDetailsTable 
             todayAppointments={dashboardData?.todayAppointments || []} 
             futureAppointments={dashboardData?.futureAppointments || []} 
           />
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};


export default DoctorDashboard;
