import React, { useEffect, useRef, useState } from "react";
import { DayPilotCalendar, DayPilot } from "@daypilot/daypilot-lite-react";
import { AxiosInstance } from "../../../../utilities/AxiosInstance";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
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
import { useNavigate } from "react-router-dom";
import Button from "../../../../component/ui/Button";
import { AxiosInstanceSecondryServer } from "../../../../utilities/AxiosInstance";
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function WeekView({
  startDate,
  selectedDoctor,
  refreshTrigger,
  stateChange,
  setStateChange,
}) {
  const navigate = useNavigate();
  const calendarRef = useRef();
  const [columns, setColumns] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Convert AM/PM -> 24h
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
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":").map(Number);
    let h = hours % 12 || 12;
    let ampm = hours >= 12 ? "PM" : "AM";
    return `${h.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  const getStatusTime = (appt, status) => {
    return (
      appt?.statusTimestamps?.[status] &&
      dayjs(appt.statusTimestamps[status]).format("hh:mm A")
    );
  };

  // Get start of ISO week
  const getWeekStartDate = (week) => {
    if (!week) return dayjs().startOf("isoWeek").format("YYYY-MM-DD");
    if (week.includes("-W")) {
      const [year, weekNum] = week.split("-W").map(Number);
      return dayjs()
        .year(year)
        .isoWeek(weekNum)
        .startOf("isoWeek")
        .format("YYYY-MM-DD");
    }
    return dayjs(week).startOf("isoWeek").format("YYYY-MM-DD");
  };

  const weekStartDate = getWeekStartDate(startDate);

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        if (!startDate) return;
        const [internalRes, webRes] = await Promise.allSettled([
          AxiosInstance.get(
            `/appointments/week?week=${encodeURIComponent(startDate)}`,
          ),
          AxiosInstanceSecondryServer.get(
            `user-appointment/clinic-appointments/${sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user"))?.cid : ""}`,
          ),
        ]);

        let appts =
          internalRes.status === "fulfilled"
            ? internalRes.value.data.data || []
            : [];
        let webAppts =
          webRes.status === "fulfilled" ? webRes.value.data.data || [] : [];

        // Filter Web appointments by week
        webAppts = webAppts.filter((appt) => {
          if (!appt.appointmentDate) return false;
          const apptDate = dayjs(appt.appointmentDate);
          const startOfWeek = dayjs(weekStartDate);
          const endOfWeek = startOfWeek.add(6, "day");
          return (
            apptDate.isSameOrAfter(startOfWeek, "day") &&
            apptDate.isSameOrBefore(endOfWeek, "day")
          );
        });

        // Map web appts to match internal schema
        webAppts = webAppts.map((appt) => {
          return {
            ...appt,
            isWebAppointment: true,
            startDateTime:
              appt.appointmentDate && appt.selectedSlot
                ? `${dayjs(appt.appointmentDate).format("YYYY-MM-DD")}T${convertTo24H(appt.selectedSlot.split("-")[0].trim())}`
                : null,
            startTime: appt.selectedSlot
              ? appt.selectedSlot.split("-")[0].trim()
              : "TBD",
            patientName: appt.patientName,
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
        const syncedWebIds = new Set(appts.map(l => l.webAppointmentId).filter(Boolean));
        webAppts = webAppts.filter(w => !syncedWebIds.has(w._id));

        const combinedAppts = [...appts, ...webAppts];

        const colorMap = {
          Booked: "#3b82f6", // Blue 500
          "Checked-in": "#8b5cf6", // Violet 500
          Engaged: "#f59e0b", // Amber 500
          Completed: "#10b981", // Emerald 500
          "Checked-out": "#64748b", // Slate 500
        };

        let filteredAppts = combinedAppts;
        // Apply Doctor filter
        if (selectedDoctor?._id) {
          filteredAppts = combinedAppts.filter(
            (appt) => appt.doctor === selectedDoctor.userName,
          );
        }

        const dayPilotEvents = filteredAppts
          .map((appt) => {
            if (!appt.startDateTime) return null;

            const startDP = new DayPilot.Date(appt.startDateTime);
            const endDP = startDP.addMinutes(30);

            const usedStatus = appt.mappedStatus || appt.status;

            return {
              id: appt._id,
              text: `${appt.isWebAppointment ? "🌐 " : ""}${appt.startTime} | ${appt.patientName}`,
              start: startDP,
              end: endDP,
              resource: appt.doctor || "dummy",
              backColor: colorMap[usedStatus] || "#94a3b8",
              raw: appt,
              cssClass: `shadow-md hover:shadow-lg transition-all ${appt.status === "Cancelled" ? "line-through grayscale opacity-50" : ""}`,
            };
          })
          .filter(Boolean);

        setEvents(dayPilotEvents);
      } catch (err) {
        console.error(err);
        setEvents([]);
      }
    }
    fetchEvents();
  }, [startDate, selectedDoctor, refreshTrigger, stateChange]);

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
    const appt = args.e.data.raw;
    setSelectedAppt(appt);
    setModalVisible(true);
  };

  return (
    <>
      <DayPilotCalendar
        ref={calendarRef}
        viewType="Week"
        startDate={weekStartDate}
        columns={columns}
        events={events}
        theme={"calendar_modern"}
        onEventClick={handleEventClick}
        headerHeight={40}
        cellHeight={38}
        cellDuration={60}
        durationBarVisible={false}
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
                      {dayjs(
                        selectedAppt.date || selectedAppt.appointmentDate,
                      ).format("DD MMM YYYY")}
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
                      {selectedAppt.isWebAppointment
                        ? selectedAppt.startTime
                        : format12H(convertTo24H(selectedAppt.startTime))}
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
    </>
  );
}
