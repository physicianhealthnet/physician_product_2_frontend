import React, { useEffect, useRef, useState } from "react";
import { DayPilot, DayPilotMonth } from "@daypilot/daypilot-lite-react";
import dayjs from "dayjs";
import { Modal, Tag, message } from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  TagsFilled,
  SolutionOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  AxiosInstance,
  AxiosInstanceSecondryServer,
} from "../../../../utilities/AxiosInstance";
import { useNavigate } from "react-router-dom";
import Button from "../../../../component/ui/Button";

export default function MonthView({
  startDate,
  selectedGroup,
  refreshTrigger,
  stateChange,
  setStateChange,
}) {
  const navigate = useNavigate();
  const monthRef = useRef();
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const dpDate =
    startDate instanceof Date
      ? new DayPilot.Date(startDate)
      : new DayPilot.Date(`${startDate}-01`);

  const convertTo24H = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;
  };

  const format12H = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getStatusTime = (appt, status) => {
    switch (status) {
      case "Checked-in":
        return appt.checkedInAt
          ? dayjs(appt.checkedInAt).format("DD-MM-YYYY hh:mm A")
          : "-";
      case "Engaged":
        return appt.engagedStartAt
          ? dayjs(appt.engagedStartAt).format("DD-MM-YYYY hh:mm A")
          : "-";
      case "Completed":
        return appt.completedAt
          ? dayjs(appt.completedAt).format("DD-MM-YYYY hh:mm A")
          : "-";
      case "Checked-out":
        return appt.checkedOutAt
          ? dayjs(appt.checkedOutAt).format("DD-MM-YYYY hh:mm A")
          : "-";
      default:
        return "-";
    }
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [internalRes, webRes] = await Promise.allSettled([
          AxiosInstance.get(
            `/appointments/month?month=${dpDate.toString("yyyy-MM")}`,
          ),
          AxiosInstanceSecondryServer.get(
            `user-appointment/clinic-appointments/${sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user"))?.cid : ""}`,
          ),
        ]);

        let filteredAppts =
          internalRes.status === "fulfilled" ? internalRes.value.data.data : [];
        let webAppts =
          webRes.status === "fulfilled" ? webRes.value.data.data || [] : [];

        // Filter Web appointments by month
        webAppts = webAppts.filter((appt) => {
          if (!appt.appointmentDate) return false;
          return (
            dayjs(appt.appointmentDate).format("YYYY-MM") ===
            dpDate.toString("yyyy-MM")
          );
        });

        // Map web appts to match internal schema for the modal and common mapping
        webAppts = webAppts.map((appt) => {
          return {
            ...appt,
            isWebAppointment: true,
            date: appt.appointmentDate,
            startTime: appt.selectedSlot
              ? appt.selectedSlot.split("-")[0].trim()
              : "TBD",
            endTime:
              appt.selectedSlot && appt.selectedSlot.includes("-")
                ? appt.selectedSlot.split("-")[1].trim()
                : "TBD",
            doctor: appt.docName,
            // Map web status to internal visual states
            mappedStatus: (function () {
              const s = appt.status?.toLowerCase();
              if (s === "pending") return "Booked";
              if (s === "approve" || s === "approved") return "Booked";
              if (s === "reject" || s === "cancelled") return "Cancelled";
              return "Booked";
            })(),
          };
        });

        // Filter out web appts that are already synced locally
        const syncedWebIds = new Set(filteredAppts.map(l => l.webAppointmentId).filter(Boolean));
        webAppts = webAppts.filter(w => !syncedWebIds.has(w._id));

        const combinedAppts = [...filteredAppts, ...webAppts];

        let finalAppts = combinedAppts;
        // Filter by selectedGroup (Doctor)
        if (selectedGroup?._id) {
          finalAppts = finalAppts.filter(
            (appt) => appt?.doctor === selectedGroup?.userName,
          );
        }

        const colorMap = {
          Booked: "#3b82f6", // Blue 500
          "Checked-in": "#8b5cf6", // Violet 500
          Engaged: "#f59e0b", // Amber 500
          Completed: "#10b981", // Emerald 500
          "Checked-out": "#64748b", // Slate 500
        };

        const mapped = finalAppts.map((appt) => {
          const apptDate = dayjs(appt.date);

          const startIso = `${apptDate.format("YYYY-MM-DD")}T${convertTo24H(
            appt.startTime,
          )}`;
          const endIso =
            appt.endTime && appt.endTime !== "TBD"
              ? `${apptDate.format("YYYY-MM-DD")}T${convertTo24H(appt.endTime)}`
              : dayjs(startIso).add(30, "minute").format("YYYY-MM-DDTHH:mm:ss");

          const usedStatus = appt.mappedStatus || appt.status;
          const backColor = colorMap[usedStatus] || "#94a3b8";

          return {
            id: appt._id,
            text: `${appt.isWebAppointment ? "🌐 " : ""}${format12H(convertTo24H(appt.startTime))} | ${appt.patientName}`,
            start: new DayPilot.Date(startIso),
            end: new DayPilot.Date(endIso),
            backColor,
            barColor: backColor,
            raw: appt,
            cssClass: `shadow-sm hover:shadow-md transition-all ${appt.status === "Cancelled" ? "line-through grayscale opacity-50" : ""}`,
          };
        });

        setEvents(mapped);
      } catch (err) {
        console.error(err);
      }
    }
    fetchEvents();
  }, [dpDate, selectedGroup, refreshTrigger, stateChange]); // re-fetch when selectedGroup changes

  const updateStatus = async (appt, status) => {
    try {
      let appointmentId = appt._id;

      if (appt.isWebAppointment) {
        try {
          const syncData = {
            patientName: appt.patientName,
            patientId: appt.patientId || appt.PHN_ID,
            phoneNumber: appt.phoneNumber || appt.patientPhone || appt.patientPhno,
            doctor: appt.doctor || appt.docName,
            category: appt.category || "Consultation",
            date: appt.appointmentDate || appt.date,
            startTime: appt.startTime,
            endTime: appt.endTime,
            clinicId: appt.clinicId || appt.cid || (sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user"))?.cid : ""),
            status: "Booked",
            webAppointmentId: appt._id,
          };
          const createRes = await AxiosInstance.post("/appointments/", syncData);
          appointmentId = createRes.data.appointment._id;
        } catch (createErr) {
          if (createErr.response?.status === 400 && createErr.response?.data?.appointment) {
            appointmentId = createErr.response.data.appointment._id;
          } else { throw createErr; }
        }
      }

      await AxiosInstance.put(`/appointments/${appointmentId}`, { status });

      // 🔄 Sync status back to Hub if it's a web-booked appointment
      if (appt.isWebAppointment || appt.webAppointmentId) {
        const hubId = appt.webAppointmentId || appt._id;
        try {
          await AxiosInstanceSecondryServer.patch(`/user-appointment/status/${hubId}`, {
            status: status.toLowerCase()
          });
        } catch (hubErr) {
          console.error("Failed to sync status to Hub:", hubErr);
        }
      }

      message.success(`Status updated to ${status}`);
      setStateChange(status + Date.now());
    } catch (err) {
      console.error(err);
      message.error("Failed to update status");
    }
  };

  const handleEventClick = (args) => {
    setSelectedAppt(args.e.data.raw);
    setModalVisible(true);
  };

  return (
    <div className="w-full">
      <DayPilotMonth
        ref={monthRef}
        startDate={dpDate}
        events={events}
        theme={"month_modern"}
        weekStarts={1}
        eventHeight={50}
        width="100%"
        onEventClick={handleEventClick}
      />

      <Modal
        open={modalVisible}
        title={
          <span className="text-xl font-bold text-slate-800 ">
            Appointment Details
          </span>
        }
        footer={[
          selectedAppt && (selectedAppt.mappedStatus || selectedAppt.status) === "Booked" && (
            <Button
              key="checkin"
              onClick={() => {
                updateStatus(selectedAppt, "Checked-in");
                setModalVisible(false);
              }}
            >
              Check In
            </Button>
          ),
          selectedAppt && (selectedAppt.mappedStatus || selectedAppt.status) === "Checked-in" && (
            <Button
              key="engage"
              onClick={() => {
                updateStatus(selectedAppt, "Engaged");
                setModalVisible(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              Engage
            </Button>
          ),
          selectedAppt && (selectedAppt.mappedStatus || selectedAppt.status) === "Engaged" && (
            <Button
              key="complete"
              onClick={() => {
                updateStatus(selectedAppt, "Completed");
                setModalVisible(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              Complete
            </Button>
          ),
          selectedAppt && (selectedAppt.mappedStatus || selectedAppt.status) === "Completed" && (
            <Button
              key="checkout"
              onClick={() => {
                updateStatus(selectedAppt, "Checked-out");
                setModalVisible(false);
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white border-0"
            >
              Check Out
            </Button>
          ),
          <Button
            key="close"
            variant="secondary"
            onClick={() => setModalVisible(false)}
            className="mr-2"
          >
            Close
          </Button>,
          <Button
            key="details"
            onClick={() =>
              navigate(`/patient-details/${selectedAppt.patientId}`)
            }
          >
            Full Profile
          </Button>,
        ]}
        onCancel={() => setModalVisible(false)}
        width={600}
        centered
        className="dark-modal"
        styles={{
          mask: { backdropFilter: "blur(4px)" },
          content: { padding: "24px", borderRadius: "16px" },
        }}
      >
        {selectedAppt && (
          <div className="flex flex-col gap-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 ">
                  <CheckCircleOutlined className="text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Appointment ID
                    </span>
                    <span className="font-semibold">
                      {selectedAppt.appointmentId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <UserOutlined className="text-green-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient Name
                    </span>
                    <span className="font-semibold">
                      {selectedAppt.patientName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <IdcardOutlined className="text-purple-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Aadhaar
                    </span>
                    <span className="font-semibold">
                      {selectedAppt.aadhaarNumber || "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <PhoneOutlined className="text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </span>
                    <span className="font-semibold">
                      {selectedAppt.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 ">
                  <TagsFilled className="text-orange-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </span>
                    <span className="font-semibold">
                      {selectedAppt.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <SolutionOutlined className="text-pink-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Doctor
                    </span>
                    <span className="font-semibold">{selectedAppt.doctor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <CalendarOutlined className="text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Date
                    </span>
                    <span className="font-semibold">
                      {dayjs(selectedAppt.date).format("DD MMM YYYY")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 ">
                  <ClockCircleOutlined className="text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Time
                    </span>
                    <span className="font-semibold">
                      {format12H(convertTo24H(selectedAppt.startTime))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50  border border-slate-100 ">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700   border border-blue-100 ">
                  {selectedAppt.mappedStatus || selectedAppt.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Checked-in:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Checked-in")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Engaged:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Engaged")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Completed")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Checked-out:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Checked-out")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
