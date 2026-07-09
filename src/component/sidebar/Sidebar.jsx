import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

import PHNChat from "../chat/PHNChat";
import { toggleChat } from "../../redux/slices/chatSlice";
import Button from "../ui/Button";

// Map menu text to icons
const ICONS = {
  Dashboard: "solar:widget-5-bold-duotone",
  "Patient Information": "solar:users-group-two-rounded-bold-duotone",
  "Today Patients": "solar:user-id-bold-duotone",
  "Patient Registration": "solar:user-check-rounded-bold-duotone",
  Billing: "solar:bill-list-bold-duotone",
  "IN Appointments": "solar:calendar-bold-duotone",
  Inventory: "solar:bedside-table-4-bold-duotone",
  "Doctor & Staff's": "solar:stethoscope-bold-duotone",
  Expenditure: "solar:ticket-sale-bold-duotone",
  Supplier: "solar:dumbbells-bold-duotone",
  Feedbacks: "solar:star-circle-bold-duotone",
  "Upcomming Review's": "solar:chat-square-arrow-bold-duotone",
  "Pharmacy & Prescription": "solar:checklist-line-duotone",
  "Web Appointments": "material-symbols:event-upcoming",
  "Patient Chat": "solar:chat-round-line-duotone",
  "Pharmacy Management": "solar:pill-bold-duotone",
  "Scan Center": "solar:scanner-bold-duotone",
  "AI X-Ray Analysis": "solar:magic-stick-3-bold-duotone",
  "Video Consult": "solar:videocamera-record-bold-duotone",
  Administration: "solar:shield-keyhole-bold-duotone",
};

const SidebarItem = ({ text, route, isOpen, hasSubMenu, isExpanded }) => {
  const location = useLocation();
  const isSelected = route ? location.pathname === route : false;
  const ICON = ICONS[text] || "solar:widget-5-bold-duotone";

  return (
    <div
      className={`relative group flex items-center px-6 py-4 cursor-pointer transition-all duration-200 border-b border-[#f0f0f0]
      ${isSelected || (hasSubMenu && isExpanded) ? "bg-[#f0f0f5]" : "bg-white hover:bg-gray-50"}`}
    >
      {/* Active Tab Blue Indicator */}
      {(isSelected || (hasSubMenu && isExpanded)) && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
      )}

      <div
        className={`flex items-center justify-center transition-colors duration-200 ${isSelected || (hasSubMenu && isExpanded) ? "text-primary-600" : "text-[#666] group-hover:text-[#333]"}`}
      >
        <Icon icon={ICON} width={24} height={24} />
      </div>

      <div
        className={`overflow-hidden flex items-center justify-between transition-all duration-300 ease-in-out ${isOpen ? "w-auto opacity-100 ml-3 flex-1" : "w-0 opacity-0"}`}
      >
        <span
          className={`text-[15px] whitespace-nowrap ${isSelected || (hasSubMenu && isExpanded) ? "text-[#333] font-medium" : "text-[#666]"}`}
        >
          {text}
        </span>
        {hasSubMenu && isOpen && (
          <Icon
            icon="solar:alt-arrow-down-bold-duotone"
            className={`text-[#666] transition-transform duration-300 ${isExpanded ? "rotate-180 text-primary-600" : ""}`}
          />
        )}
      </div>
    </div>
  );
};

const MENU_ITEMS = {
  receptionist: [
    { text: "Dashboard", route: "/dashboard" },
    { text: "Patient Information", route: "/home" },
    { text: "Patient Registration", route: "/enquiry-registration" },
    { text: "IN Appointments", route: "/book-appointment" },
    { text: "Upcomming Review's", route: "/next-review" },
    { text: "Billing", route: "/bill" },
    { text: "Feedbacks", route: "/feedback" },
    { text: "Pharmacy & Prescription", route: "/pre-load-prescription" },
    { text: "Web Appointments", route: "/PHNAppointments" },
    { text: "Pharmacy Management", route: "/pharmacy" },
    {
      text: "Administration",
      subMenu: [{ text: "Identicards", route: "/administration/identicards" }],
    },
  ],
  doctor: [
    { text: "Dashboard", route: "/dashboard" },
    { text: "IN Appointments", route: "/book-appointment" },
    { text: "Web Appointments", route: "/PHNAppointments" },
    { text: "Upcomming Review's", route: "/next-review" },
    { text: "Patient Registration", route: "/enquiry-registration" },
    { text: "Patient Information", route: "/home" },
    { text: "Pharmacy & Prescription", route: "/pre-load-prescription" },
    { text: "Pharmacy Management", route: "/pharmacy" },
    { text: "Billing", route: "/bill" },
    { text: "Patient Chat", route: "/patient-chat" },
    { text: "Video Consult", route: "/video-consult" },
    {
      text: "Scan Center",
      subMenu: [
        {
          text: "For Doctor",
          route: "/scan-prescription-from-the-doctor",
        },
        {
          text: "For Technician",
          route: "/appointment-for-the-scan",
        },
      ],
    },
    {
      text: "Lab",
      subMenu: [
        {
          text: "For Doctor",
          route: "/lab-prescription-from-the-doctor",
        },
        {
          text: "For Technician",
          route: "/appointment-for-the-lab",
        },
      ],
    },
    {
      text: "Administration",
      subMenu: [{ text: "Identicards", route: "/administration/identicards" }],
    },
  ],
  accountant: [
    { text: "Billing", route: "/bill" },
    { text: "Supplier", route: "/supplier" },
    { text: "Expenditure", route: "/expenditure" },
    { text: "Pharmacy Management", route: "/pharmacy" },
  ],
  generalManager: [
    { text: "Patient Information", route: "/home" },
    { text: "Billing", route: "/bill" },
    { text: "Inventory", route: "/inventory" },
    { text: "Expenditure", route: "/expenditure" },
    { text: "Doctor & Staff's", route: "/master/doctor-and-staffs" },
    { text: "Pharmacy Management", route: "/pharmacy" },
    {
      text: "Administration",
      subMenu: [{ text: "Identicards", route: "/administration/identicards" }],
    },
  ],
  master: [
    { text: "Dashboard", route: "/dashboard" },
    { text: "IN Appointments", route: "/book-appointment" },
    { text: "Patient Information", route: "/home" },
    { text: "Billing", route: "/bill" },
    { text: "Doctor & Staff's", route: "/master/doctor-and-staffs" },
    { text: "Inventory", route: "/inventory" },
    { text: "Supplier", route: "/supplier" },
    { text: "Expenditure", route: "/expenditure" },
    { text: "Upcomming Review's", route: "/next-review" },
    { text: "Feedbacks", route: "/feedback" },
    { text: "Pharmacy & Prescription", route: "/pre-load-prescription" },
    { text: "Web Appointments", route: "/PHNAppointments" },
    { text: "Patient Chat", route: "/patient-chat" },
    { text: "Video Consult", route: "/video-consult" },
    { text: "Pharmacy Management", route: "/pharmacy" },
    { text: "AI X-Ray Analysis", route: "/xray-analysis" },
    {
      text: "Administration",
      subMenu: [{ text: "Identicards", route: "/administration/identicards" }],
    },
    {
      text: "Analytics",
      subMenu: [
        { text: "Revenue", route: "/revenue" },
      ],
    },
  ],
};

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.toggle.isOpen);
  const { isOpen: chatIsOpen, unreadCount } = useSelector(
    (state) => state.chat,
  );

  // Get role of user
  let userType = null;
  try {
    const user = sessionStorage.getItem("user");
    const role = sessionStorage.getItem("master");
    const masterRole = role ? JSON.parse(role) : null;
    const userData = user ? JSON.parse(user) : null;
    userType = userData?.userType || masterRole?.userType;
  } catch (error) {
    console.error("Failed to parse user role:", error);
  }

  const menuItems = MENU_ITEMS[userType] || [];

  const location = useLocation();

  const toggleSubmenu = (text) => {
    setExpandedMenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const handleChatToggle = () => {
    dispatch(toggleChat());
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 lg:relative h-screen bg-white flex flex-col border-r border-[#e0e0e0] transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-xl lg:shadow-none z-30 shrink-0
      ${isOpen ? "w-65 translate-x-0" : "w-17 -translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand/Logo Area */}
        <div className="h-16.25 flex items-center justify-center border-b border-[#e0e0e0] shrink-0">
          {isOpen ? (
            <div className="text-slate-800 font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="font-bold text-[28px] text-[#28328c] tracking-tight m-0 leading-tight">
                PHN
              </span>
            </div>
          ) : (
            <span className="font-bold text-[20px] text-[#28328c] tracking-tight m-0 leading-tight">
              PHN
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden hover:overflow-y-auto py-0">
          <div className="flex flex-col">
            {menuItems.map((item, index) => {
              if (item.subMenu) {
                const isExpanded = expandedMenus[item.text];
                return (
                  <div
                    key={`menu-${index}-${item.text}`}
                    className="flex flex-col"
                  >
                    <div onClick={() => toggleSubmenu(item.text)}>
                      <SidebarItem
                        text={item.text}
                        route={item.route}
                        isOpen={isOpen}
                        hasSubMenu={true}
                        isExpanded={isExpanded}
                      />
                    </div>
                    <AnimatePresence>
                      {isExpanded && isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="flex flex-col bg-[#fbfbfc] border-y border-gray-100/50 overflow-hidden"
                        >
                          {item.subMenu.map((subItem) => {
                            const isSubSelected =
                              location.pathname === subItem.route;
                            return (
                              <Link
                                key={subItem.route}
                                to={subItem.route}
                                className="block no-underline"
                              >
                                <div
                                  className={`pl-16 pr-6 py-3 text-[13.5px] transition-all duration-200 border-l-[3px] border-transparent ${isSubSelected ? "text-primary-600 font-bold bg-[#f4f4f9] border-l-primary-500" : "text-gray-500 hover:text-primary-600 hover:bg-white hover:border-l-primary-400"}`}
                                >
                                  {subItem.text}
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={`link-${index}-${item.route || item.text}`}
                  to={item.route}
                  className="block no-underline"
                >
                  <SidebarItem
                    text={item.text}
                    route={item.route}
                    isOpen={isOpen}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* PHN Chat Button */}
        <div className="p-4 border-t border-[#e0e0e0]">
          <Button
            onClick={handleChatToggle}
            className="w-full flex items-center gap-3 px-3 py-3 bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200 shadow-md shadow-primary-500/30 relative"
          >
            <div className="flex items-center justify-center">
              <Icon icon="tabler:headset" width={24} height={24} />
            </div>

            {isOpen && <span>Clinic Support</span>}

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </Button>
        </div>

        {/* Footer / Version */}
        <div className="p-4 border-t border-[#e0e0e0] text-xs text-slate-500 text-center">
          {isOpen ? (
            <div className="flex flex-col gap-1">
              <span>v2.0 Beta</span>
            </div>
          ) : (
            <span>v2.0</span>
          )}
        </div>
      </div>

      {/* PHN Chat Component */}
      <PHNChat isOpen={chatIsOpen} onClose={handleChatToggle} />
    </>
  );
};

export default Sidebar;
