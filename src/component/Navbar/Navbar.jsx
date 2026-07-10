import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toggleSidebar } from "../../redux/slices/toggleSlice";
import { toggleTheme } from "../../redux/slices/themeSlice";
import { message, Avatar, Dropdown } from "antd";
import {
  LogoutOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { motion } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useSelector((state) => state.theme.theme);

  // handle session storage
  const currUser = location.pathname === "/master-admin";

  const userInfo = JSON?.parse(
    sessionStorage.getItem(currUser ? "master" : "user"),
  );

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = () => {
    navigate("/login");
    sessionStorage.clear();
    message.success("Logged out successfully");
  };

  const userRole =
    (userInfo?.userType === "doctor" && "Doctor") ||
    (userInfo?.userType === "receptionist" && "Receptionist") ||
    (userInfo?.userType === "accountant" && "Accountant") ||
    (userInfo?.userType === "generalManager" && "General Manager") ||
    (userInfo?.userType === "master" && "CEO") ||
    "Master";

  const dropdownItems = {
    items: [
      {
        key: "1",
        label: (
          <div
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 font-medium pb-1"
          >
            <LogoutOutlined /> Logout
          </div>
        ),
      },
    ],
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between h-[65px] bg-white border-b border-gray-100 px-6 shadow-sm z-20 transition-colors duration-300"
    >
      {/* Left Side: Toggle & Title/Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="text-slate-500 hover:text-primary-600 transition-colors text-xl p-2 rounded-sm hover:bg-slate-50"
        >
          <MenuUnfoldOutlined />
        </button>

        <div
          className="hidden md:flex flex-col cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="font-bold text-[28px] text-[#28328c] tracking-tight m-0 leading-tight">
            PHN
          </h1>
        </div>
      </div>

      {/* Right Side: Profile Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <Dropdown
          menu={dropdownItems}
          trigger={["click"]}
          placement="bottomRight"
        >
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 px-3 rounded-sm transition-all border border-transparent hover:border-slate-100">
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="border border-slate-200"
            />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-semibold text-slate-700 text-sm">
                {userInfo?.userName || "User"}
                {userInfo?.userType === "doctor" && userInfo?.department && ` - ${userInfo.department}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {userRole}
                {userInfo?.userType === "doctor" && userInfo?.userId && ` - ID: ${userInfo.userId}`}
              </span>
            </div>
            <DownOutlined className="text-[10px] text-slate-400" />
          </div>
        </Dropdown>
      </div>
    </motion.div>
  );
}

export default Navbar;
