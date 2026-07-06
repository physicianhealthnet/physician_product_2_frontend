import React, { useEffect, useState } from "react";
import { message, Select, Modal, Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ClockCircleFilled,
  FolderOpenOutlined,
  IdcardOutlined,
  PhoneOutlined,
  TagsFilled,
  SolutionOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import {
  AxiosInstance,
  AxiosInstanceSecondryServer,
} from "../../../../utilities/AxiosInstance";
import Input from "../../../../component/ui/Input";
import Button from "../../../../component/ui/Button";
import Reschedule from "../Reschedule";
import { useNavigate } from "react-router-dom";
import PatientClinicalDataModal from "../../../../component/dashboard/PatientClinicalDataModal";
import { Icon } from "@iconify/react";

const { Option } = Select;

const ManageAppointments = ({
  refresh,
  setStateChange,
  stateChange,
  selectedGroup,
}) => {
  const [appointments, setAppointments] = useState([]);
  const [filterDate, setFilterDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(1000);
  const [total, setTotal] = useState(0);

  // Patient Details
  const navigate = useNavigate();
  const [patientDetails, setPatientDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, patientId: null });

  const getAppointments = async (date, pageNo = 1) => {
    try {
      const [internalRes, webRes] = await Promise.allSettled([
        AxiosInstance.get(
          `/appointments/get?date=${date}&status=${filterStatus}&search=${searchTerm}&page=${pageNo}&limit=${limit}`,
        ),
        AxiosInstanceSecondryServer.get(
          `user-appointment/clinic-appointments/${sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user"))?.cid : ""}`,
        ),
      ]);

      const internalAppts =
        internalRes.status === "fulfilled"
          ? internalRes.value.data.data || []
          : [];
      let webAppts =
        webRes.status === "fulfilled" ? webRes.value.data.data || [] : [];

      // Filter web appointments by date (matching current internal logic roughly)
      webAppts = webAppts
        .filter((appt) => {
          if (!appt.appointmentDate) return false;
          const apptDate = dayjs(appt.appointmentDate).format("YYYY-MM-DD");
          if (apptDate !== date) return false;

          // Apply search if exists
          if (
            searchTerm &&
            !appt.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return false;
          }

          // Only show approved web appointments in this view
          const webStatus = appt.status?.toLowerCase();
          if (webStatus !== "approve" && webStatus !== "approved") {
            return false;
          }

          // Apply selected status filter if exists
          if (filterStatus) {
            const searchStatusLower = filterStatus.toLowerCase();
            // Since we only have approved web appts now, they are mapped to "Completed"
            if (searchStatusLower !== "completed") {
              return false;
            }
          }

          return true;
        })
        .map((appt) => {
          // Link with local status if already synced
          const localMatch = internalAppts.find((l) => l.webAppointmentId === appt._id);
          
          return {
            ...appt,
            isWebAppointment: true,
            localAppointmentId: localMatch?._id,
            localStatus: localMatch?.status,
            // Map fields to match internal appointment format for rendering
            startTime: appt.selectedSlot
              ? appt.selectedSlot.split("-")[0].trim()
              : "TBD",
            endTime:
              appt.selectedSlot && appt.selectedSlot.includes("-")
                ? appt.selectedSlot.split("-")[1].trim()
                : "TBD",
            doctor: appt.docName,
            // Map status to internal visual states
            mappedStatus: (function () {
              if (localMatch) return localMatch.status;
              const s = appt.status?.toLowerCase();
              if (s === "pending") return "Booked";
              if (s === "approve" || s === "approved") return "Booked";
              if (s === "reject" || s === "cancelled") return "Cancelled";
              return "Booked";
            })(),
          };
        });

      // Filter out web appts that are already synced locally
      const syncedWebIds = new Set(internalAppts.map(l => l.webAppointmentId).filter(Boolean));
      webAppts = webAppts.filter(w => !syncedWebIds.has(w._id));

      const combined = [...internalAppts, ...webAppts];

      setAppointments(combined);
      setTotal(combined.length);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch appointments");
    }
  };

  useEffect(() => {
    getAppointments(filterDate, page);
  }, [
    filterDate,
    filterStatus,
    searchTerm,
    page,
    refresh,
    showRescheduleModal,
    stateChange,
  ]);

  // Fetch detailed info for patients in the current appointment list
  useEffect(() => {
    const fetchDetails = async () => {
      // Extract unique patient IDs
      const patientIds = appointments
        .map((appt) => appt.patientId || appt.PHN_ID)
        .filter(Boolean);
      
      const uniqueIds = [...new Set(patientIds)].join(",");
      if (!uniqueIds) return;

      setLoadingDetails(true);
      try {
        const res = await AxiosInstance.get(`/business-tool/dashboard-patient-list?patientIds=${uniqueIds}`);
        if (res.data && res.data.data) {
          setPatientDetails(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error("Failed to fetch patient detailed list", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (appointments.length > 0) {
      fetchDetails();
    }
  }, [appointments]);

  const updateStatus = async (appt, status) => {
    console.log(appt);
    
    try {
      let appointmentId = appt._id;

      // If it's a web appointment, we need to ensure it exists locally first
      if (appt.isWebAppointment) {
        try {
          // Try to create/sync it locally
          const syncData = {
            patientName: appt.patientName,
            patientId: appt.patientId || appt.PHN_ID,
            phoneNumber: appt.phoneNumber || appt.patientPhone || appt.patientPhno,
            doctor: appt.doctor || appt.docName,
            doctorId: appt.doctorId || appt.docId,
            category: appt.category || "Consultation",
            date: appt.appointmentDate || appt.date,
            startTime: appt.startTime,
            endTime: appt.endTime,
            clinicId: appt.clinicId || appt.cid || (sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user"))?.cid : ""),
            status: "Booked", // Initial local status
            webAppointmentId: appt._id, // Reference to Hub ID
          };
          const createRes = await AxiosInstance.post("/appointments/", syncData);
          appointmentId = createRes.data.appointment._id;
        } catch (createErr) {
          // If it fails because it already exists (400), we might need to find it
          if (createErr.response?.status === 400 && createErr.response?.data?.appointment) {
            appointmentId = createErr.response.data.appointment._id;
          } else {
            throw createErr;
          }
        }
      }

      // 🔄 Sync status back to Hub if it's a web-booked appointment
      if (appt.isWebAppointment || appt.webAppointmentId) {
        const hubId = appt.webAppointmentId || appt._id;
        try {
          // Send status in lowercase to Hub for consistency (pending, approve, completed, etc.)
          await AxiosInstanceSecondryServer.patch(`/user-appointment/status/${hubId}`, {
            status: status.toLowerCase()
          });
        } catch (hubErr) {
          console.error("Failed to sync status to Hub:", hubErr);
        }
      }

      if (status === "Cancelled") {
        const reason = prompt("Enter cancellation reason (Patient/PT):");
        if (!reason) return;
        await AxiosInstance.put(`/appointments/${appointmentId}`, {
          status,
          cancelReason: reason,
          cancelledBy: "PT",
        });
      } else {
        await AxiosInstance.put(`/appointments/${appointmentId}`, {
          status,
        });
      }
      message.success(`Status updated to ${status}`);
      getAppointments(filterDate);
      setStateChange(status);
    } catch (err) {
      console.error(err);
      message.error("Failed to update status");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Booked":
        return <ClockCircleOutlined className="text-yellow-500" />;
      case "Checked-in":
        return <UserOutlined className="text-blue-500" />;
      case "Engaged":
        return <ClockCircleFilled className="text-purple-500" />;
      case "Completed":
        return <CheckCircleOutlined className="text-green-500" />;
      case "Checked-out":
        return <CheckCircleOutlined className="text-pink-500" />;
      case "Cancelled":
        return <CloseCircleOutlined className="text-red-500" />;
      default:
        return <ClockCircleOutlined className="text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Booked":
        return "bg-yellow-50 text-yellow-700   border border-yellow-100 ";
      case "Checked-in":
        return "bg-blue-50 text-blue-700   border border-blue-100 ";
      case "Engaged":
        return "bg-purple-50 text-purple-700   border border-purple-100 ";
      case "Completed":
        return "bg-green-50 text-green-700   border border-green-100 ";
      case "Checked-out":
        return "bg-pink-50 text-pink-700   border border-pink-100 ";
      case "Cancelled":
        return "bg-red-50 text-red-700   border border-red-100 ";
      default:
        return "bg-slate-50 text-slate-700   border border-slate-100 ";
    }
  };

  const getStatusTime = (appt, status) => {
    switch (status) {
      case "Checked-in":
        return appt.checkedInAt
          ? dayjs(appt.checkedInAt).format("hh:mm A")
          : "-";
      case "Engaged":
        return appt.engagedStartAt
          ? dayjs(appt.engagedStartAt).format("hh:mm A")
          : "-";
      case "Completed":
        return appt.completedAt
          ? dayjs(appt.completedAt).format("hh:mm A")
          : "-";
      case "Checked-out":
        return appt.checkedOutAt
          ? dayjs(appt.checkedOutAt).format("hh:mm A")
          : "-";
      default:
        return "-";
    }
  };

  const openModal = (appt) => {
    setSelectedAppt(appt);
    setModalVisible(true);
  };

  const openRescheduleModal = (appt) => {
    setSelectedAppt(appt);
    setShowRescheduleModal(true);
  };

  const onClose = () => {
    setShowRescheduleModal(false);
  };

  const onSuccess = () => {
    setShowRescheduleModal(false);
  };

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-w-0 w-full bg-white p-5 border border-slate-200/50 rounded-2xl">
      {/* Filters */}
      <div className="flex flex-col gap-4 bg-slate-50/50 border border-slate-200/50  shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
        <div className="flex flex-row gap-4">
          <div className="relative group w-52">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 z-10">
              <CalendarOutlined className="text-lg" />
            </div>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full h-12 pl-12 bg-white  border-slate-200/60  rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold tracking-tight"
            />
          </div>

          <Select
            placeholder="Filter by Status"
            allowClear
            value={filterStatus || undefined}
            onChange={(val) => setFilterStatus(val || "")}
            className="w-52 h-12 custom-select-premium"
            popupClassName="  rounded-2xl shadow-2xl border-slate-700/50"
          >
            {[
              "Booked",
              "Checked-in",
              "Engaged",
              "Completed",
              "Checked-out",
              "Cancelled",
            ].map((status) => (
              <Option key={status} value={status}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(status).split(" ")[0]}`}
                  ></div>
                  {status}
                </div>
              </Option>
            ))}
          </Select>

          <div className="relative group w-52">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 z-10">
              <SearchOutlined className="text-lg" />
            </div>
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 bg-white  border-slate-200/60  rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold tracking-tight"
            />
          </div>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="overflow-x-auto custom-scrollbar max-h-[450px] border border-slate-200/50 rounded-xl">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/90 backdrop-blur-md text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-200 shadow-sm">
              <th className="p-4 pl-6 w-10"></th>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Primary Doctor</th>
              <th className="p-4">Appointment Date</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(selectedGroup
              ? appointments.filter(
                  (appt) => appt.doctor === selectedGroup.userName,
                )
              : appointments
            ).length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center opacity-60">
                  <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <div className="p-4 rounded-full bg-slate-100">
                      <FolderOpenOutlined className="text-4xl text-slate-300" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-extrabold text-sm uppercase tracking-widest">
                        No Appointments
                      </p>
                      <p className="text-xs text-slate-400">
                        Everything looks clear for now
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              (selectedGroup
                ? appointments.filter(
                    (appt) => appt.doctor === selectedGroup.userName,
                  )
                : appointments
              ).map((appt, idx) => {
                const pId = appt.patientId || appt.PHN_ID;
                const detailsObj = patientDetails[pId] || {};
                const detail = detailsObj.patientDetails || {};
                const isExpanded = expandedRows.has(appt._id);

                return (
                  <React.Fragment key={idx}>
                    <tr
                      className="hover:bg-slate-50/80 border-b border-slate-100/50 transition-colors duration-200 group cursor-pointer"
                      onClick={() => toggleRow(appt._id)}
                    >
                      <td className="p-4 pl-6">
                        <button className="text-slate-400 hover:text-blue-500 transition-colors">
                          {isExpanded ? <UpOutlined /> : <DownOutlined />}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-500">{pId || "N/A"}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {detail.photo ? (
                                <img src={detail.photo} alt={appt.patientName} className="w-full h-full object-cover" />
                              ) : (
                                <Icon icon="solar:user-bold" className="text-slate-300 text-xs" />
                              )}
                            </div>
                            <span className="font-extrabold text-slate-800 text-sm tracking-tight">
                              {appt.patientName}
                            </span>
                            {appt.isWebAppointment && (
                              <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm">
                                Web
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {appt.phoneNumber || appt.patientPhone || appt.patientPhno || "—"}
                      </td>
                      <td className="p-4 text-sm font-bold text-blue-600">
                        {appt.doctor || appt.docName || "—"}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Icon icon="solar:calendar-mark-bold-duotone" className="text-purple-500" />
                          <span className="font-bold text-slate-800">
                            {appt.appointmentDate ? dayjs(appt.appointmentDate).format("DD MMM YYYY") : dayjs(appt.date).format("DD MMM YYYY")} | {appt.startTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${getStatusColor(appt.mappedStatus || appt.status)}`}
                        >
                          <div className="scale-110">
                            {getStatusIcon(appt.mappedStatus || appt.status)}
                          </div>
                          <span className="text-indent-[0.2em]">
                            {appt.mappedStatus || appt.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {(appt.mappedStatus || appt.status) === "Booked" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateStatus(appt, "Checked-in")}
                                className="text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                              >
                                Check In
                              </Button>
                              {!appt.isWebAppointment && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => updateStatus(appt, "Cancelled")}
                                  className="text-red-600 hover:text-red-700 text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openModal(appt)}
                            className="text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                          >
                            Details
                          </Button>

                          {!appt.isWebAppointment && (appt.mappedStatus || appt.status) === "Booked" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openRescheduleModal(appt)}
                              className="text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                            >
                              Reschedule
                            </Button>
                          )}
                          {(appt.mappedStatus || appt.status) === "Checked-in" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(appt, "Engaged")}
                              className="bg-purple-600 hover:bg-purple-700 shadow-none text-white border-0 text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                            >
                              Engage
                            </Button>
                          )}
                          {(appt.mappedStatus || appt.status) === "Engaged" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(appt, "Completed")}
                              className="bg-green-600 hover:bg-green-700 shadow-none text-white border-0 text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                            >
                              Complete
                            </Button>
                          )}
                          {(appt.mappedStatus || appt.status) === "Completed" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(appt, "Checked-out")}
                              className="bg-slate-600 hover:bg-slate-700 shadow-none text-white border-0 text-[10px] px-3 py-1.5 h-auto uppercase tracking-widest"
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Collapsible Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-b border-slate-200 shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.05)]">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Demographics */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Demographics</h4>
                              <div className="flex flex-col gap-2 text-sm">
                                <span className="text-slate-600"><strong className="text-slate-800">Gender:</strong> <span className="capitalize">{detail.gender || "-"}</span></span>
                                <span className="text-slate-600"><strong className="text-slate-800">Age:</strong> {detail.age || "—"}</span>
                                <span className="text-slate-600"><strong className="text-slate-800">Location:</strong> {detail.city || detail.location || "—"}</span>
                                <span className="text-slate-600"><strong className="text-slate-800">Visited Date:</strong> {detail.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY") : "—"}</span>
                              </div>
                            </div>
                            
                            {/* Clinical Info */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Clinical Info</h4>
                              <div className="flex flex-col gap-3">
                                <div className="text-sm">
                                  <strong className="text-slate-800">Primary Complaint:</strong> 
                                  <p className="text-slate-600 mt-1 line-clamp-2" title={detailsObj?.primaryComplaint || ""}>{detailsObj?.primaryComplaint || "—"}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/assessment/${pId}`);
                                  }}
                                  className="bg-blue-100/50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-blue-200 transition-colors shadow-sm active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5 w-max mt-1"
                                >
                                  <span>Ongoing Treatment</span>
                                  <Icon icon="solar:alt-arrow-right-bold" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Attender Details */}
                            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                              <h4 className="text-[10px] uppercase font-black text-amber-600 tracking-widest">Attender Details</h4>
                              <div className="flex flex-col gap-2 text-sm">
                                <span className="text-slate-600"><strong className="text-slate-800">Name:</strong> {detailsObj.attenderName || "—"}</span>
                                <span className="text-slate-600"><strong className="text-slate-800">Phone:</strong> {detailsObj.attenderPhone || "—"}</span>
                                <span className="text-slate-600"><strong className="text-slate-800">Relationship:</strong> {detailsObj.attenderRelationship || "—"}</span>
                              </div>
                            </div>
                            
                            {/* Reports */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Reports</h4>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                                  <span className="text-xs font-bold text-slate-600">Prescriptions</span>
                                  <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, type: 'prescription', patientId: pId }); }} className="bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">
                                    {detailsObj.prescriptionsCount > 0 ? `View (${detailsObj.prescriptionsCount})` : "View"}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/50">
                                  <span className="text-xs font-bold text-slate-600">Lab Reports</span>
                                  <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, type: 'lab', patientId: pId }); }} className="bg-white border border-rose-200 text-rose-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-rose-600 hover:text-white transition-colors shadow-sm active:scale-95">
                                    {detailsObj.labReportsCount > 0 ? `View (${detailsObj.labReportsCount})` : "View"}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/50">
                                  <span className="text-xs font-bold text-slate-600">Scan Reports</span>
                                  <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, type: 'scan', patientId: pId }); }} className="bg-white border border-purple-200 text-purple-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-purple-600 hover:text-white transition-colors shadow-sm active:scale-95">
                                    {detailsObj.scanReportsCount > 0 ? `View (${detailsObj.scanReportsCount})` : "View"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Reschedule
        appt={selectedAppt}
        visible={showRescheduleModal}
        onClose={onClose}
        onSuccess={onSuccess}
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
          >
            Close
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
                      {selectedAppt.startTime} - {selectedAppt.endTime}
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
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedAppt.mappedStatus || selectedAppt.status)}`}
                >
                  {selectedAppt.mappedStatus || selectedAppt.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Checked-in:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Checked-in")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Engaged:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Engaged")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Completed:</span>
                  <span className="font-bold text-slate-700 ">
                    {getStatusTime(selectedAppt, "Completed")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
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
      
      {/* Clinical Data Modal */}
      <PatientClinicalDataModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, patientId: null })}
        type={modalConfig.type}
        patientId={modalConfig.patientId}
      />
    </div>
  );
};

export default ManageAppointments;
