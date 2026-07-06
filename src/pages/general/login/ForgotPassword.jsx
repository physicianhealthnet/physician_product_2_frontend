import React, { useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { message } from "antd";
import AuthHero from "./AuthHero";
import Button from "../../../component/ui/Button";
import Input from "../../../component/ui/Input";
import Card from "../../../component/ui/Card";

function ForgotPassword({ setForgotPassSwaper }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await AxiosInstance.post(
        "/user/forgot-password",
        formData
      );
      message.success(response.data.message);
      setForgotPassSwaper(false);
      setFormData({});
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to reset password");
      setForgotPassSwaper(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50  transition-colors duration-300 h-screen overflow-hidden">
      {/* Left Panel - Hero/Brand Info */}
      <AuthHero />

      {/* Right Panel - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 ">
              Reset Password
            </h2>
            <p className="mt-2 text-slate-600 ">
              Enter your details to create a new password.
            </p>
          </div>

          <Card className="p-8 backdrop-blur-sm bg-white/80  border-slate-200  shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Username"
                name="userName"
                value={formData?.userName || ""}
                onChange={handleInputChange}
                placeholder="Enter username"
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData?.email || ""}
                onChange={handleInputChange}
                placeholder="name@company.com"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData?.password || ""}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData?.confirmPassword || ""}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700  mb-1.5">
                  User Type
                </label>
                <select
                  name="userType"
                  value={formData?.userType || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900  h-[42px]"
                >
                  <option value="">Select Role</option>
                  {[
                    "master",
                    "doctor",
                    "accountant",
                    "generalManager",
                    "receptionist",
                  ].map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full shadow-lg shadow-primary-500/25"
                  size="lg"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setForgotPassSwaper(false)}
                className="font-semibold text-sm text-slate-600  hover:text-slate-900 :text-white"
              >
                ← Back to Login
              </button>
            </div>
          </Card>

          <div className="text-center pt-8 border-t border-slate-200 ">
            <p className="text-xs text-slate-400 ">© 2025 Physician Clinic. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
