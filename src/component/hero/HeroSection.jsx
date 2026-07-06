import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import Card from "../ui/Card";

const HeroSection = () => {
  const user = JSON.parse(sessionStorage?.getItem("user"))?.userName;
  const master = JSON.parse(sessionStorage.getItem("master"));
  const userName = master ? master?.userName : user;
  const clinicId = JSON.parse(sessionStorage.getItem("user"))?.clinicId;

  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const route = clinicId
          ? `/patient/get-all-by-clinic/${clinicId}`
          : "/patient/get-all";
        const response = await AxiosInstance.get(route);
        const patients = response.data.patients || [];
        console.log(patients);
        

        const dashboardRes = await AxiosInstance.get(`/business-tool/dashboard-v2?clinicId=${clinicId}`);
        const dashboardData = dashboardRes.data || {};

        // Calculate stats
        setStats({
          totalPatients: dashboardData.patientStats?.total || patients.length,
          todayAppointments: dashboardData.todayAppointments?.length || 0,
          pendingReviews: 0, 
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clinicId]);

  const statCards = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: "tabler:users-group",
      color: "blue",
      bgGradient: "from-blue-500/10 to-indigo-500/10",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 ",
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
      icon: "tabler:calendar-event",
      color: "emerald",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 ",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: "tabler:clock-hour-4",
      color: "amber",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 ",
    },
  ];

  return (
    <div className="flex flex-col gap-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-slate-800  text-4xl tracking-tight">
            Welcome back, <span className="text-blue-500">{userName}</span>!
          </h1>
          <p className="text-slate-500  font-medium text-lg">
            Here's what's happening with your clinic today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-slate-100  border border-slate-200  flex items-center gap-2">
            <Icon icon="tabler:calendar" className="text-slate-500 " />
            <span className="text-sm font-semibold text-slate-700 ">
              {new Date().toLocaleDateString("en-US", {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden bg-linear-to-br ${stat.bgGradient} backdrop-blur-xl border-slate-200/60  hover:scale-[1.02] transition-all duration-300`}
          >
            {/* Glow Effect */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 bg-${stat.color}-500`} />

            <div className="p-6 flex items-center justify-between z-10">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400  uppercase tracking-widest">
                  {stat.label}
                </span>
                {loading ? (
                  <div className="w-16 h-10 bg-slate-200  rounded-lg animate-pulse" />
                ) : (
                  <span className="text-4xl font-black text-slate-800 ">
                    {stat.value}
                  </span>
                )}
              </div>
              <div className={`w-16 h-16 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                <Icon icon={stat.icon} className="text-3xl" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
