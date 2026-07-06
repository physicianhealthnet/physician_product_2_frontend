import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

const ReceptionistDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [clinicId, setClinicId] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const userSession = sessionStorage.getItem("user");
        const userData = userSession ? JSON.parse(userSession) : null;
        const cid = userData?.clinicId || "";
        setClinicId(cid);

        if (cid) {
          const res = await AxiosInstance.get(`/user/get-doctor?clinicId=${cid}`);
          if (res.data && res.data.users) {
            setDoctors(res.data.users);
            // Default to first doctor if available
            if (res.data.users.length > 0) {
              setSelectedDoctor(res.data.users[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch doctors", error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  if (loadingDoctors) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Icon icon="solar:spinner-linear" className="animate-spin text-blue-500 text-5xl" />
          <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Initializing Clinic Systems...</span>
        </div>
      </div>
    );
  }

  return (
    <StaggerContainer>
      <div className="p-4 md:p-10 bg-slate-50 min-h-screen">
        <StaggerItem>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-slate-800 text-4xl tracking-tight leading-none">
                Clinic <span className="text-blue-500">Reception</span>
              </h1>
              <p className="text-slate-500 font-medium mt-2">
                Unified management portal for physician schedules and patient flows
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Switch View</label>
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                {doctors.map((doc) => (
                  <button
                    key={doc.userId}
                    onClick={() => handleDoctorSelect(doc)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                      selectedDoctor?.userId === doc.userId
                        ? "bg-white shadow-md text-blue-600 scale-105"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      selectedDoctor?.userId === doc.userId ? "bg-blue-500 text-white" : "bg-slate-300 text-slate-600"
                    }`}>
                      {doc.userName.charAt(0)}
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight">{doc.userName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </StaggerItem>

        {selectedDoctor ? (
          <StaggerItem>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <DoctorDashboardOverride doctor={selectedDoctor} clinicId={clinicId} />
            </div>
          </StaggerItem>
        ) : (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border border-slate-200 border-dashed gap-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" width={60} className="text-slate-200" />
              </div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm text-center px-10">
                Please select a physician to access the clinical dashboard
              </p>
            </div>
          </StaggerItem>
        )}
      </div>
    </StaggerContainer>
  );
};

const DoctorDashboardOverride = ({ doctor, clinicId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await AxiosInstance.get(
          `/business-tool/dashboard-v2?clinicId=${clinicId}&doctorId=${doctor._id}&doctorName=${doctor.userName}`,
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
  }, [doctor, clinicId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 bg-white/50 backdrop-blur-xl rounded-[40px] border border-slate-200">
        <Icon icon="solar:spinner-linear" className="animate-spin text-blue-500 text-5xl" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Clinical Records for {doctor.userName}...</span>
      </div>
    );
  }

  return <DoctorDashboardContent dashboardData={dashboardData} doctorName={doctor.userName} />;
};

const DoctorDashboardContent = ({ dashboardData, doctorName }) => {
  const patientStats = dashboardData?.patientStats || {};
  const morningAppointments = dashboardData?.morningAppointments || [];
  const afternoonAppointments = dashboardData?.afternoonAppointments || [];
  const eveningAppointments = dashboardData?.eveningAppointments || [];

  return (
    <div className="flex flex-col gap-10">
      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Total"
          subValue={patientStats?.todayCompletedAppointments || 0}
          total={patientStats?.todayTotalAppointments || 0}
          icon="solar:clipboard-list-bold-duotone"
          color="bg-blue-500"
          bgGradient="from-blue-500/10 to-indigo-500/10"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Morning Shift"
          subValue={patientStats?.morning?.completed || 0}
          total={patientStats?.morning?.total || 0}
          icon="solar:sun-2-bold-duotone"
          color="bg-amber-500"
          bgGradient="from-amber-500/10 to-orange-500/10"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Afternoon Shift"
          subValue={patientStats?.afternoon?.completed || 0}
          total={patientStats?.afternoon?.total || 0}
          icon="solar:clouds-bold-duotone"
          color="bg-sky-500"
          bgGradient="from-sky-500/10 to-cyan-500/10"
          iconBg="bg-sky-500/10"
          iconColor="text-sky-600"
        />
        <StatCard
          title="Evening Shift"
          subValue={patientStats?.evening?.completed || 0}
          total={patientStats?.evening?.total || 0}
          icon="solar:moon-bold-duotone"
          color="bg-indigo-500"
          bgGradient="from-indigo-500/10 to-violet-500/10"
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Appointment Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PatientListColumn
          title="Morning Appointments"
          appointments={morningAppointments}
          icon="solar:sun-2-bold-duotone"
          accentColor="bg-amber-500"
        />
        <PatientListColumn
          title="Afternoon Appointments"
          appointments={afternoonAppointments}
          icon="solar:clouds-bold-duotone"
          accentColor="bg-sky-500"
        />
        <PatientListColumn
          title="Evening Appointments"
          appointments={eveningAppointments}
          icon="solar:moon-bold-duotone"
          accentColor="bg-indigo-600"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, subValue, total, icon, color, bgGradient, iconBg, iconColor }) => (
  <div className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-3xl hover:scale-[1.02] transition-all duration-300 shadow-sm`}>
    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
    <div className="p-8 flex items-center justify-between z-10 relative">
      <div className="flex flex-col gap-2 flex-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-800">{subValue}</span>
          <span className="text-sm font-medium text-slate-400 opacity-80">/ {total}</span>
        </div>
        <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-2 overflow-hidden shadow-inner">
          <div className={`h-full ${color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`} style={{ width: `${total > 0 ? (subValue / total) * 100 : 0}%` }} />
        </div>
      </div>
      <div className={`w-16 h-16 ml-4 shrink-0 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon icon={icon} className="text-3xl" />
      </div>
    </div>
  </div>
);

const PatientListColumn = ({ title, appointments, icon, accentColor }) => (
  <div className="flex flex-col h-full bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-3 mb-8">
      <div className={`p-2.5 rounded-xl ${accentColor} bg-opacity-10`}>
        <Icon icon={icon} className={accentColor.replace("bg-", "text-")} width={20} />
      </div>
      <h4 className="text-slate-800 font-black text-sm uppercase tracking-tight">{title}</h4>
      <span className="ml-auto bg-slate-50 px-3 py-1 rounded-lg text-[11px] font-black text-slate-500 border border-slate-100 shadow-inner">
        {appointments?.length || 0}
      </span>
    </div>
    <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
      {appointments?.length > 0 ? (
        appointments.map((apt, i) => (
          <div key={apt._id || i} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
              <Icon icon="solar:user-circle-bold-duotone" className="text-slate-300 text-4xl" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-slate-800 text-sm font-black truncate">{apt.name}</span>
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">{apt.time || "Ongoing"}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${["Completed", "Checked-out"].includes(apt.status) ? "bg-emerald-400 shadow-emerald-500/20" : "bg-blue-400 shadow-blue-500/20"}`} />
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-slate-200 gap-4">
          <Icon icon="solar:calendar-minimalistic-linear" width={48} className="opacity-30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">No scheduled activities</span>
        </div>
      )}
    </div>
  </div>
);

export default ReceptionistDashboard;
