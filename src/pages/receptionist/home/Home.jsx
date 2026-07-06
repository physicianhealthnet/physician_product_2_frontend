import React from "react";
import HeroSection from "../../../component/hero/HeroSection";
import PatientInfoTable from "../../../component/tables/PatientInfoTable";
import TodayAppointmentsTable from "../../../component/tables/TodayAppointmentsTable";
import DoctorDashboard from "../../../pages/doctor/home/DoctorDashboard";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

const Home = () => {
  let userType = null;
  try {
    const userSession = sessionStorage.getItem("user");
    const role = sessionStorage.getItem("master");
    const masterRole = role ? JSON.parse(role) : null;
    const userData = userSession ? JSON.parse(userSession) : null;
    userType = userData?.userType || masterRole?.userType;
  } catch (err) {
    console.error("Failed to parse user role in Home:", err);
  }

  const user = JSON.parse(sessionStorage.getItem("master"));

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-8">
        {/* Headers */}
        <StaggerItem>
          {user?.userType === "master" ? (
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-slate-800 text-4xl tracking-tight">
                Patient <span className="text-blue-500">Registry</span>
              </h1>
              <p className="text-slate-500 font-medium">
                Comprehensive patient database and management system
              </p>
            </div>
          ) : (
            <HeroSection role={"receptionist"} />
          )}
        </StaggerItem>

        {/* Today's Appointments Table */}
        <StaggerItem>
          <TodayAppointmentsTable />
        </StaggerItem>

        {/* patient table */}
        <StaggerItem>
          <div className="max-w-full overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
            <PatientInfoTable />
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default Home;
