import React from "react";
import DoctorDashboard from "../pages/doctor/home/DoctorDashboard";
import ReceptionistDashboard from "../pages/receptionist/home/ReceptionistDashboard";

const DashboardWrapper = () => {
    let userType = null;
    try {
        const userSession = sessionStorage.getItem("user");
        const role = sessionStorage.getItem("master");
        const masterRole = role ? JSON.parse(role) : null;
        const userData = userSession ? JSON.parse(userSession) : null;
        userType = userData?.userType || masterRole?.userType;
    } catch (err) {
        console.error("Failed to parse user role in DashboardWrapper:", err);
    }

    const normalizedRole = userType?.toLowerCase();
    if (normalizedRole === "receptionist" || normalizedRole === "staff") {
        return <ReceptionistDashboard />;
    }

    // Default to Doctor Dashboard for doctors/masters
    return <DoctorDashboard />;
};

export default DashboardWrapper;
