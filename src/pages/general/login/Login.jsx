import React, { useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance.js";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import ForgotPassword from "./ForgotPassword";
import AuthHero from "./AuthHero";
import Button from "../../../component/ui/Button";
import Input from "../../../component/ui/Input";
import Card from "../../../component/ui/Card";

const Login = ({ initialTab = "login" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [forgotPassSwaper, setForgotPassSwaper] = useState(false);

  // Login State
  const [u_vEmail, setEmail] = useState("");
  const [u_vPassword, setPassword] = useState("");
  const [u_vUserType, setUserType] = useState("master");
  const [department, setDepartment] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  // const [regClinicId, setRegClinicId] = useState("");
  const [regUserType, setRegUserType] = useState("Doctor");
  const [regDepartment, setRegDepartment] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const departmentList = [
    "General Physician",
    "Dentist",
    "Dermatologist",
    "ENT Specialist",
    "Ophthalmologist",
    "Cardiologist",
    "Orthopedic",
    "Gynecologist",
    "Pediatrician",
    "Endocrinologist",
    "Psychiatrist",
  ];

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const payload = {
        email: u_vEmail,
        password: u_vPassword,
        userType: u_vUserType,
      };

      if (u_vUserType === "doctor") {
        if (!department) {
          message.error("Please select a department!");
          setLoginLoading(false);
          return;
        }
        payload.department = department;
      }

      const response = await AxiosInstance.post("/user/login", payload);
      console.log(response);

      const activeUserType = response.data.user.userType;

      if (activeUserType === "master") {
        sessionStorage.setItem(
          "master",
          JSON.stringify({
            ...response.data.user,
            cid: "PHN-C-0001",
            clinicId: "PHN-C-0001",
          }),
        );
      } else {
        sessionStorage.setItem(
          "user",
          JSON.stringify({
            ...response.data.user,
            cid: "PHN-C-0001",
            clinicId: "PHN-C-0001",
          }),
        );
      }

      const redirectUrl = sessionStorage.getItem("redirectUrl");
      if (redirectUrl) {
        sessionStorage.removeItem("redirectUrl");
        navigate(redirectUrl);
      } else {
        const routes = {
          receptionist: "/book-appointment",
          accountant: "/bill",
          doctor: "/book-appointment",
          generalManager: "/home",
          master: "/book-appointment",
          patient: "/home",
        };
        navigate(routes[activeUserType] || "/login");
      }
      message.success("Welcome back!");
    } catch (error) {
      console.error("Login Error:", error);
      message.error(
        error.response?.data?.message ||
          "Invalid credentials or account not found!",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);

    if (regUserType === "Doctor" && !regDepartment) {
      message.error("Please select a department!");
      setRegisterLoading(false);
      return;
    }

    try {
      const payload = {
        userName: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        userType: regUserType.toLowerCase(),
        clinicId: "PHN-C-0001",
      };

      if (regUserType === "Doctor") {
        payload.department = regDepartment;
      }

      const response = await AxiosInstance.post("/user/add", payload);

      if (response.status === 201 || response.status === 200) {
        message.success("Registration successful! Please login.");
        setActiveTab("login");
        // Clear form
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setRegDepartment("");
      }
    } catch (error) {
      console.error("Register Error:", error);
      message.error(error.response?.data?.message || "Registration failed!");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Render Forgot Password
  if (forgotPassSwaper) {
    return <ForgotPassword setForgotPassSwaper={setForgotPassSwaper} />;
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 transition-colors duration-300 h-screen overflow-hidden">
      <AuthHero />

      <div className="flex-1 flex flex-col items-center pt-8 p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Tabs */}
          <div className="flex gap-16 border-b border-gray-200 mb-8 w-full justify-center">
            <button
              onClick={() => setActiveTab("login")}
              className={`pb-4 px-2 text-[15px] font-semibold transition-colors ${activeTab === "login" ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500 hover:text-gray-800"}`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`pb-4 px-2 text-[15px] font-semibold transition-colors ${activeTab === "register" ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-500 hover:text-gray-800"}`}
            >
              Register
            </button>
          </div>

          {/* Form Container */}
          <Card className="p-8 backdrop-blur-sm bg-white/80 border-slate-200 shadow-xl">
            {activeTab === "login" && (
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-5 animate-in fade-in duration-300"
              >
                <Input
                  label="Mobile Number / Email ID"
                  type="text"
                  value={u_vEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type="password"
                    value={u_vPassword}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setForgotPassSwaper(true)}
                      className="text-[13px] font-medium text-primary-500 hover:text-primary-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] text-gray-500 font-semibold mb-1.5 block">
                    Role
                  </label>
                  <select
                    value={u_vUserType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 font-medium h-[42px]"
                  >
                    <option value="master">Master Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="accountant">Accountant</option>
                    <option value="generalManager">General Manager</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
                {u_vUserType === "doctor" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] text-gray-500 font-semibold mb-1.5 block">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 font-medium h-[42px]"
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentList.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 accent-primary-500 cursor-pointer"
                    defaultChecked
                  />
                  <label
                    htmlFor="remember"
                    className="text-[13px] text-gray-500 cursor-pointer"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  loading={loginLoading}
                >
                  Login
                </Button>
              </form>
            )}

            {activeTab === "register" && (
              <form
                onSubmit={handleRegisterSubmit}
                className="space-y-5 animate-in fade-in duration-300"
              >
                <Input
                  label="Full Name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Dr. John Doe"
                  required
                />

                <Input
                  label="Email ID"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />

                <Input
                  label="Mobile Number"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {/* <Input
                  label="Clinic ID"
                  type="text"
                  value={regClinicId}
                  onChange={(e) => setRegClinicId(e.target.value)}
                  placeholder="e.g. PHN-C-0001"
                  required
                /> */}

                <div>
                  <label className="text-[13px] text-gray-500 font-semibold mb-1.5 block">
                    Role
                  </label>
                  <select
                    value={regUserType}
                    onChange={(e) => setRegUserType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 font-medium h-[42px]"
                  >
                    <option value="master">Master Admin</option>
                    <option value="Doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="accountant">Accountant</option>
                    <option value="generalManager">General Manager</option>
                  </select>
                </div>

                {regUserType === "Doctor" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] text-gray-500 font-semibold mb-1.5 block">
                      Department
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 font-medium h-[42px]"
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentList.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  loading={registerLoading}
                >
                  Register
                </Button>
              </form>
            )}
          </Card>

          <div className="text-center pt-8">
            <p className="text-xs text-slate-400">
              © 2025 Physician Clinic. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
