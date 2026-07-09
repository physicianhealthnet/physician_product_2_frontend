import React, { useState, useEffect } from "react";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";
import { useNavigate } from "react-router-dom";
import { AxiosInstanceSecondryServer, AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import { message, Select, DatePicker, ConfigProvider, theme, Modal, TimePicker, Input } from "antd";
import { useSelector } from "react-redux";
import { TableSkeleton } from "../../../component/ui/Skeleton";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { sendTemplateWhatsApp } from "../../../component/whatsApp/sendTemplateWhatsApp";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const localizer = momentLocalizer(moment);

function PHNAppointments() {
  const navigate = useNavigate();
  const currentTheme = useSelector((state) => state.theme.theme);
  const [selectedButton, setSelectedButton] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [syncedPatients, setSyncedPatients] = useState(new Set());
  const [dateFilter, setDateFilter] = useState("this_week");
  const [customRange, setCustomRange] = useState([]);

  // Reschedule State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    appointmentId: null,
    currentDate: null,
    currentSlot: null,
  });
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Approve State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveData, setApproveData] = useState({
    appointmentId: null,
    currentDoctorName: "",
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);

  const tabs = [
    { label: "Appointment Pending", icon: "tabler:clock-hour-4", color: "blue" },
    { label: "Approved", icon: "tabler:circle-check", color: "emerald" },
    { label: "Cancelled", icon: "tabler:circle-x", color: "red" },
  ];

  const dateTabs = [
    { label: "All", value: "all", icon: "tabler:calendar-event" },
    { label: "Yesterday", value: "yesterday", icon: "tabler:arrow-narrow-left" },
    { label: "Today", value: "today", icon: "tabler:calendar-check" },
    { label: "Tomorrow", value: "tomorrow", icon: "tabler:arrow-narrow-right" },
    { label: "This Week", value: "this_week", icon: "tabler:calendar-stats" },
    { label: "This Month", value: "this_month", icon: "tabler:calendar-month" },
    { label: "Next Month", value: "next_month", icon: "tabler:calendar-plus" },
    { label: "Custom", value: "custom", icon: "tabler:calendar-search" },
  ];
  const selectedStatus = tabs[selectedButton].label.toLowerCase();

  const userData = JSON.parse(sessionStorage.getItem("user"));
  const cid = userData?.cid;

  const fetchAppointments = async () => {
    if (!cid) return;
    try {
      setLoading(true);
      setError(null);

      const res = await AxiosInstanceSecondryServer.get(
        `user-appointment/clinic-appointments/${cid}`
      );

      const result = res.data;

      console.log(result);


      if (result?.message?.includes("successfully")) {
        setAppointments(result.data || []);
      } else {
        setError(result?.message || "Failed to load appointments");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Network error"
      );
    } finally {
      setLoading(false);
    }
  };

  const converToInternalPatient = async (patientBasic) => {
    try {
      const response = await AxiosInstance.post("/patient/create", {
        ...patientBasic,
        clinicId: cid,
        PHN_ID: patientBasic?._id,
      });
      console.log(response, cid);

      message.success("Patient created successfully");
      setSyncedPatients(prev => new Set(prev).add(patientBasic._id));
    }
    catch (err) {
      message.error("Failed to create patient");
      console.error(err);

    }
  }

  const fetchDoctors = async () => {
    try {
      const res = await AxiosInstance.get(`/user/get-doctor?clinicId=${cid}`);
      setDoctors(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    if (cid) fetchDoctors();
  }, [cid]);

  const openApproveModal = (appt) => {
    setApproveData({
      appointmentId: appt._id,
      currentDoctorName: appt.docName,
    });
    // Try to find if the current doctor is in our list
    const existingDoc = doctors.find(d => d.userName === appt.docName);
    setSelectedDoctorId(existingDoc?.userId || (doctors.length > 0 ? doctors[0].userId : null));
    setIsApproveModalOpen(true);
  };

  const checkDate = (appointmentDate) => {
    if (dateFilter === "all") return true;
    if (!appointmentDate) return false;

    const date = dayjs(appointmentDate);
    const today = dayjs();

    switch (dateFilter) {
      case "yesterday":
        return date.isSame(today.subtract(1, "day"), "day");
      case "today":
        return date.isSame(today, "day");
      case "tomorrow":
        return date.isSame(today.add(1, "day"), "day");
      case "this_week":
        return date.isSameOrAfter(today.startOf("week")) && date.isSameOrBefore(today.endOf("week"));
      case "this_month":
        return date.isSame(today, "month");
      case "next_month":
        return date.isSame(today.add(1, "month"), "month");
      case "custom":
        if (!customRange || customRange.length !== 2) return true;
        return date.isBetween(customRange[0], customRange[1], "day", "[]");
      default:
        return true;
    }
  };

  const filteredAppointments = appointments.filter(
    (appt) => {
      const status = appt.status?.toLowerCase();
      const isDateMatch = checkDate(appt.appointmentDate);

      // Tab filtering logic
      let isStatusMatch = false;
      if (selectedStatus === 'appointment pending') {
        isStatusMatch = status === 'pending' || status === 'doctor_rescheduled';
      } else if (selectedStatus === 'approved') {
        isStatusMatch = status === 'approve' || status === 'approved';
      } else if (selectedStatus === 'cancelled') {
        isStatusMatch = status === 'reject' || status === 'cancelled';
      }

      return isStatusMatch && isDateMatch;
    }
  );

  const handleAction = async (appointmentId, action, extraData = {}) => {
    const endpointMap = {
      approve: `user-appointment/${appointmentId}/approve`,
      reject: `user-appointment/${appointmentId}/reject`,
    };

    if (!endpointMap[action]) return;

    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));

    try {
      const res = await AxiosInstanceSecondryServer.patch(
        endpointMap[action].replace(/^\//, ""),
        extraData
      );

      // WhatsApp Notification
      const appt = appointments.find((a) => a._id === appointmentId);
      if (appt && appt.phoneNumber) {
        const docName = extraData.docName || appt.docName;
        if (action === "approve") {
          sendTemplateWhatsApp(appt.phoneNumber, "appointment_success", [
            appt.patientName,
            appt.clinicName,
            docName,
            dayjs(appt.appointmentDate).format("DD MMM YYYY"),
            appt.selectedSlot || "N/A",
          ]);
        } else if (action === "reject") {
          sendTemplateWhatsApp(appt.phoneNumber, "appointment_cancel", [
            appt.patientName,
            appt.clinicName,
            appt.docName,
            dayjs(appt.appointmentDate).format("DD MMM YYYY"),
            appt.selectedSlot || "N/A",
            appt.clinicNumber || "our clinic",
          ]);
        }
      }

      // Update status locally
      setAppointments((prev) =>
        prev.map((appt) =>
          appt._id === appointmentId
            ? { ...appt, status: "approve", docName: extraData.docName || appt.docName, doctorId: extraData.doctorId || appt.doctorId }
            : appt
        )
      );

      message.success(`Appointment ${action}d successfully`);
    } catch (err) {
      message.error(
        err.response?.data?.message || err.message || "Action failed"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleApproveConfirm = async () => {
    const selectedDoc = doctors.find(d => d.userId === selectedDoctorId);
    if (!selectedDoc && doctors.length > 0) {
      message.error("Please select a doctor");
      return;
    }

    setApproveLoading(true);
    await handleAction(approveData.appointmentId, "approve", {
      docName: selectedDoc?.userName || approveData.currentDoctorName,
      doctorId: selectedDoc?.userId || selectedDoctorId
    });
    setApproveLoading(false);
    setIsApproveModalOpen(false);
  };

  const openRescheduleModal = (appt) => {
    setRescheduleData({
      appointmentId: appt._id,
      currentDate: appt.appointmentDate,
      currentSlot: appt.selectedSlot,
    });
    setNewDate(dayjs(appt.appointmentDate));

    // Parse current slot to set initial time if possible
    if (appt.selectedSlot) {
      try {
        const timeStr = appt.selectedSlot.split("-")[0].trim();
        const initialTime = dayjs(timeStr, "h:mm A");
        setNewTime(initialTime);
      } catch (e) {
        setNewTime(null);
      }
    } else {
      setNewTime(null);
    }

    setRescheduleReason("");
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime) {
      message.error("Please select both new date and time");
      return;
    }

    try {
      setRescheduleLoading(true);

      // Format slot: "10:00 AM - 10:30 AM"
      const startTimeStr = newTime.format("h:mm A");
      const endTimeStr = newTime.add(30, "minute").format("h:mm A");
      const newSlot = `${startTimeStr} - ${endTimeStr}`;

      const payload = {
        appointmentDate: newDate.format("YYYY-MM-DD"),
        selectedSlot: startTimeStr,
        reason: rescheduleReason,
        rescheduledBy: "Clinic" // Added field for doctor reschedule flow
      };

      await AxiosInstanceSecondryServer.patch(
        `user-appointment/${rescheduleData.appointmentId}/reschedule`,
        payload
      );

      // WhatsApp Notification
      const appt = appointments.find((a) => a._id === rescheduleData.appointmentId);
      if (appt && appt.phoneNumber) {
        sendTemplateWhatsApp(appt.phoneNumber, "appointment_rescheduled", [
          appt.patientName,
          appt.clinicName,
          appt.docName,
          newDate.format("DD MMM YYYY"),
          newSlot,
          appt.clinicNumber || "our clinic",
        ]);
      }

      message.success("Appointment rescheduled successfully");
      setIsRescheduleModalOpen(false);
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to reschedule appointment");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const counts = {
    today: 0,
    tomorrow: 0,
    this_week: 0,
    next_week: 0,
    this_month: 0,
  };

  const today = dayjs();
  const startOfNextWeek = today.add(1, "week").startOf("week");
  const endOfNextWeek = today.add(1, "week").endOf("week");

  appointments.forEach((appt) => {
    const status = appt.status?.toLowerCase() || "";
    if (["completed", "checked-out", "cancelled", "reject"].includes(status)) return;
    
    const date = dayjs(appt.appointmentDate);
    if (!date.isValid()) return;

    if (date.isSame(today, "day")) counts.today++;
    if (date.isSame(today.add(1, "day"), "day")) counts.tomorrow++;
    if (date.isSameOrAfter(today.startOf("week")) && date.isSameOrBefore(today.endOf("week"))) counts.this_week++;
    if (date.isSameOrAfter(startOfNextWeek) && date.isSameOrBefore(endOfNextWeek)) counts.next_week++;
    if (date.isSame(today, "month")) counts.this_month++;
  });

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* Header Section */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-slate-800  text-4xl tracking-tight">
                Web <span className="text-blue-500">Appointments</span>
              </h1>
              <p className="text-slate-500  font-medium">
                Manage and process digital health network appointment requests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setViewMode(prev => prev === 'table' ? 'calendar' : 'table')}
                className="rounded px-4 py-2 flex items-center gap-2 border-slate-200 shadow-sm hover:bg-white"
              >
                <Icon icon={viewMode === 'table' ? "tabler:calendar" : "tabler:table"} />
                {viewMode === 'table' ? "Show in Calendar Format" : "Show in Table Format"}
              </Button>
              <Button
                variant="secondary"
                onClick={fetchAppointments}
                className="rounded px-4 py-2 flex items-center gap-2 border-slate-200 shadow-sm hover:bg-white"
                disabled={loading}
              >
                <Icon icon="tabler:refresh" className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
        </StaggerItem>


      {/* ROW: WEB APPOINTMENT STATS */}
      <StaggerItem>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
        {[
          {
            label: "Today",
            count: counts.today,
            icon: "solar:calendar-date-bold-duotone",
            color: "bg-purple-500",
            bgGradient: "from-purple-500/10 to-fuchsia-500/10",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600",
          },
          {
            label: "Tomorrow",
            count: counts.tomorrow,
            icon: "solar:calendar-mark-linear",
            color: "bg-blue-500",
            bgGradient: "from-blue-500/10 to-indigo-500/10",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
          },
          {
            label: "This Week",
            count: counts.this_week,
            icon: "solar:calendar-bold-duotone",
            color: "bg-emerald-500",
            bgGradient: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
          },
          {
            label: "Next Week",
            count: counts.next_week,
            icon: "solar:calendar-line-duotone",
            color: "bg-orange-500",
            bgGradient: "from-orange-500/10 to-amber-500/10",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-600",
          },
          {
            label: "This Month",
            count: counts.this_month,
            icon: "solar:chart-square-bold-duotone",
            color: "bg-rose-500",
            bgGradient: "from-rose-500/10 to-pink-500/10",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-600",
          },
        ].map((c, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}
          >
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
            
            <div className="p-4 flex items-center justify-between z-10 relative">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {c.label}
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {c.count}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} group-hover:scale-110 transition-transform`}>
                <Icon icon={c.icon} className="text-xl" />
              </div>
            </div>
          </div>
        ))}
          </div>
        </StaggerItem>

      {/* Refactored Date Filter Section */}
      <StaggerItem>
        <div className="flex flex-col gap-4 bg-slate-50/50 p-6 rounded border border-slate-200 shadow-inner mb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Time Horizon</h3>
            <p className="text-xs text-slate-500 font-medium">Filter appointments by specific date ranges</p>
          </div>

          <div className="flex flex-wrap items-center justify-center p-2 bg-white/50 backdrop-blur-md border border-slate-200 rounded w-fit shadow-sm">
            {dateTabs.map((tab) => {
              const isActive = dateFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setDateFilter(tab.value)}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-black transition-all duration-300 uppercase tracking-widest
                    ${isActive
                      ? "bg-white shadow-sm text-blue-600 border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }
                  `}
                >
                  <Icon icon={tab.icon} className="text-base" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex justify-center md:justify-end animate-in fade-in slide-in-from-top-2 duration-500 pt-4 border-t border-slate-200/50 ">
            <ConfigProvider
              theme={{
                algorithm: currentTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
              }}
            >
              <DatePicker.RangePicker
                onChange={(dates) => {
                  if (dates) {
                    setCustomRange([dayjs(dates[0]), dayjs(dates[1])]);
                  } else {
                    setCustomRange([]);
                  }
                }}
                className="w-full md:w-[400px] h-12 rounded border-slate-200 shadow-sm"
              />
            </ConfigProvider>
          </div>
        )}
        </div>
      </StaggerItem>


      {/* Modern Tab Selector */}
      <StaggerItem>
        <div className="flex items-center p-2 bg-slate-50/50 border-b border-slate-200 overflow-x-auto shadow-inner w-full mb-4 hide-scrollbar">
        {tabs.map((tab, index) => {
          const isActive = selectedButton === index;
          return (
            <button
              key={tab.label}
              onClick={() => setSelectedButton(index)}
              className={`
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest
                ${isActive
                  ? "text-white shadow-lg shadow-blue-500/20 bg-linear-to-r from-blue-600 to-indigo-600"
                  : "text-slate-500  hover:text-slate-700 :text-slate-200"
                }
              `}
            >
              <Icon icon={tab.icon} className="text-lg" />
              {tab.label}
              {(() => {
                const count = appointments.filter(a => {
                  const status = a.status?.toLowerCase();
                  let isMatch = false;
                  const tabLabelLower = tab.label.toLowerCase();
                  if (tabLabelLower === 'appointment pending') isMatch = status === 'pending' || status === 'doctor_rescheduled';
                  else if (tabLabelLower === 'approved') isMatch = status === 'approve' || status === 'approved';
                  else if (tabLabelLower === 'cancelled') isMatch = status === 'reject' || status === 'cancelled';
                  return isMatch && checkDate(a.appointmentDate);
                }).length;

                if (count > 0) {
                  return (
                    <span className={`
                      ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black
                      ${isActive ? "bg-white/20" : "bg-slate-200 "}
                    `}>
                      {count}
                    </span>
                  );
                }
                return null;
              })()}
            </button>
          );
        })}
        </div>
      </StaggerItem>

      {/* List Container */}
      <StaggerItem>
        <div className="min-h-[400px]">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-red-50/50 border border-red-200 shadow-inner rounded">
            <Icon icon="tabler:alert-triangle" className="text-5xl text-red-500 opacity-50" />
            <div className="text-center">
              <h3 className="font-black text-slate-800  text-xl">Service Interruption</h3>
              <p className="text-red-500 font-medium max-w-md mx-auto">{error}</p>
            </div>
            <Button variant="outline" className="mt-4 border-red-500/20 text-red-600" onClick={fetchAppointments}>
              Attempt Reconnect
            </Button>
          </div>
        ) : filteredAppointments.length === 0 && viewMode === 'table' ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-slate-50/50 border border-slate-200 shadow-inner rounded">
            <div className="w-20 h-20 rounded-full bg-slate-100  flex items-center justify-center text-slate-400 opacity-50">
              <Icon icon={tabs[selectedButton].icon} className="text-4xl" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <h3 className="text-2xl font-black text-slate-800 ">
                Inbox Empty
              </h3>
              <p className="text-slate-500  font-medium">
                No <strong>{tabs[selectedButton].label}</strong> appointment requests at this time
              </p>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="h-[700px] bg-white/50 backdrop-blur-md p-6 rounded border border-slate-200 shadow-xl">
            <Calendar
              localizer={localizer}
              events={appointments.map(appt => {
                let start, end;
                try {
                  const datePart = new Date(appt.appointmentDate).toISOString().split('T')[0];
                  // Attempt to parse slot like "10:00 AM" or "10:00 AM - 10:30 AM"
                  // This is a basic assumption, might need refinement based on exact data format
                  if (appt.selectedSlot) {
                    const times = appt.selectedSlot.split('-');
                    const startTimeStr = times[0].trim();
                    const endTimeStr = times[1] ? times[1].trim() : null;

                    start = moment(`${datePart} ${startTimeStr}`, 'YYYY-MM-DD h:mm A').toDate();
                    end = endTimeStr
                      ? moment(`${datePart} ${endTimeStr}`, 'YYYY-MM-DD h:mm A').toDate()
                      : moment(start).add(30, 'minutes').toDate();
                  } else {
                    start = new Date(appt.appointmentDate);
                    end = new Date(appt.appointmentDate);
                  }
                } catch (e) {
                  start = new Date(appt.appointmentDate);
                  end = new Date(appt.appointmentDate);
                }

                return {
                  id: appt._id,
                  title: `${appt.patientName} (${appt.selectedSlot || 'No Slot'})`,
                  start: start,
                  end: end,
                  resource: appt,
                  status: appt.status
                }
              })}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={(event) => {
                let backgroundColor = '#3b82f6';
                if (event.status?.toLowerCase() === 'pending') backgroundColor = '#3b82f6';
                if (event.status?.toLowerCase() === 'approve') backgroundColor = '#10b981';
                if (event.status?.toLowerCase() === 'reject') backgroundColor = '#ef4444';
                return { style: { backgroundColor } }
              }}
              onSelectEvent={(event) => {
                message.info(`Appointment for ${event.title}`);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/50 rounded-xl">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50/90 backdrop-blur-md text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-200 shadow-sm">
                  <th className="p-4 pl-6">Doctor</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
                <tbody>
                  {filteredAppointments.map((appt) => {
                    const isLoading = actionLoading[appt._id];
                    const isPending = appt.status?.toLowerCase() === "pending";
                    const isApproved = appt.status?.toLowerCase() === "approve";

                    return (
                      <tr key={appt._id} className="hover:bg-slate-50/80 border-b border-slate-100/50 transition-colors duration-200 group">
                        <td className="p-4 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                              {appt.docName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{appt.clinicName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-800 text-sm tracking-tight">
                            {appt.patientName}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-600 text-xs">
                              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                <Icon icon="solar:calendar-mark-bold-duotone" className="w-3 h-3" />
                              </div>
                              <span className="font-bold">
                                {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-500 tracking-widest">{appt.selectedSlot}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-600 text-sm">
                            {appt.clinicNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border
                                ${isPending ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                                ${isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                                ${!isPending && !isApproved ? 'bg-red-50 text-red-700 border-red-100' : ''}
                             `}>
                            <Icon icon={
                              isPending ? 'tabler:clock' :
                                isApproved ? 'tabler:circle-check' : 'tabler:circle-x'
                            } className="scale-110" />
                            {(() => {
                              if (appt.status === "doctor_rescheduled") return "Doctor Rescheduled";
                              if (appt.status === "reject") return "Doctor Cancelled";
                              if (appt.status === "cancelled") return "Patient Cancelled";
                              if (appt.status === "pending") {
                                if (appt.reschedules?.length > 0 && appt.reschedules[appt.reschedules.length - 1].rescheduledBy === "Patient") {
                                  return "Patient Rescheduled";
                                }
                                return "Pending";
                              }
                              return appt.status;
                            })()}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => openApproveModal(appt)}
                                  disabled={isLoading}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:scale-110 transition-all p-0 border border-emerald-100  "
                                  title="Approve"
                                >
                                  {isLoading ? <Icon icon="tabler:loader-2" className="animate-spin" /> : <Icon icon="tabler:check" />}
                                </button>
                                <button
                                  onClick={() => handleAction(appt._id, "reject")}
                                  disabled={isLoading}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 hover:scale-110 transition-all p-0 border border-red-100  "
                                  title="Reject"
                                >
                                  {isLoading ? <Icon icon="tabler:loader-2" className="animate-spin" /> : <Icon icon="tabler:x" />}
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => converToInternalPatient(appt)}
                              disabled={syncedPatients.has(appt._id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center p-0 transition-all ${syncedPatients.has(appt._id)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed  "
                                : "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:scale-110 border border-blue-100  "
                                }`}
                              title={syncedPatients.has(appt._id) ? "Already synced" : "Add to Internal Patient"}
                            >
                              <Icon icon={syncedPatients.has(appt._id) ? "tabler:check" : "tabler:user-plus"} />
                            </button>


                            <button
                              onClick={() => openRescheduleModal(appt)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 hover:bg-violet-100 hover:scale-110 transition-all p-0 border border-violet-100"
                              title="Reschedule"
                            >
                              <Icon icon="tabler:calendar-time" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </StaggerItem>

    {/* Approve and Select Doctor Modal */}
    <Modal
        title="Approve Appointment"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        confirmLoading={approveLoading}
        onOk={handleApproveConfirm}
        okText="Confirm Approval"
        okButtonProps={{ className: "bg-emerald-600" }}
      >
        <div className="flex flex-col gap-4 py-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-sm font-medium text-emerald-800">
              You are about to approve this appointment. Please confirm or select the doctor who will be attending.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Doctor</label>
            <Select
              className="w-full h-12"
              placeholder="Select a doctor"
              value={selectedDoctorId}
              onChange={setSelectedDoctorId}
              options={doctors.map(doc => ({
                value: doc.userId,
                label: (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-black text-blue-600 border border-blue-500/20">
                        {doc.userName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700">{doc.userName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{doc.department || "Staff"}</span>
                      </div>
                    </div>
                    <span className={`
                      px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest
                      ${doc.userType === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {doc.userType}
                    </span>
                  </div>
                )
              }))}
            />
            {doctors.length === 0 && (
              <p className="text-[10px] text-amber-600 font-medium">
                <Icon icon="tabler:alert-triangle" className="inline mr-1" />
                No doctors found in your clinic. Please add doctors in the Doctor & Staff section.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Patient Preference</span>
            <div className="text-sm font-bold text-slate-700">
              {approveData.currentDoctorName || "No preference"}
            </div>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Appointment"
        open={isRescheduleModalOpen}
        onCancel={() => setIsRescheduleModalOpen(false)}
        confirmLoading={rescheduleLoading}
        onOk={handleRescheduleSubmit}
        okText="Reschedule"
        okButtonProps={{ className: "bg-blue-600" }}
      >
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">Current Schedule</span>
            <div className="p-3 bg-slate-50  rounded-lg text-sm border border-slate-200 ">
              <span className="font-bold text-slate-700 ">
                {rescheduleData.currentDate ? dayjs(rescheduleData.currentDate).format("DD MMM YYYY") : "-"}
              </span>
              <span className="mx-2 text-slate-400">|</span>
              <span className="text-blue-600 font-medium">{rescheduleData.currentSlot || "-"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase">New Date</label>
              <DatePicker
                value={newDate}
                onChange={setNewDate}
                format="DD-MM-YYYY"
                className="w-full"
                minDate={dayjs()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase">New Time</label>
              <TimePicker
                value={newTime}
                onChange={setNewTime}
                format="h:mm A"
                use12Hours
                minuteStep={15}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Reason (Optional)</label>
            <Input.TextArea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              rows={3}
              placeholder="Why is it being rescheduled?"
            />
          </div>
        </div>
      </Modal>
      </div>
    </StaggerContainer>
  );
}

export default PHNAppointments;