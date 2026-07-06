import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import dayjs from "dayjs";
import { message, Modal } from "antd";

const SearchPicker = ({ label, options, value, onChange, placeholder }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );
  const selectedObj = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-2 relative text-left">
      <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(true)}
        className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-text flex justify-between items-center text-sm font-bold text-slate-700 shadow-inner h-[46px]"
      >
        {isOpen ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none w-full placeholder:text-slate-300"
            placeholder="Type to search..."
            onBlur={() => setTimeout(() => setIsOpen(false), 250)}
          />
        ) : (
          <span
            className={
              selectedObj ? "text-slate-800" : "text-slate-400 font-medium"
            }
          >
            {selectedObj ? selectedObj.label : placeholder}
          </span>
        )}
        <Icon
          icon="solar:alt-arrow-down-bold-duotone"
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 hide-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents input blur
                  e.stopPropagation();
                  onChange(opt);
                  setQuery("");
                  setIsOpen(false);
                }}
                className="px-5 py-2.5 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-700 transition-colors duration-100"
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-5 py-3 text-sm text-slate-400 font-medium text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function ScanAppointmentCreateForm() {
  const [activeTab, setActiveTab] = useState("Not Scheduled");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ptrName: "",
    ptNo: "",
    drName: "",
    doctorId: "",
    scanType: "MRI Brain",
    scanCenter: "Internal",
    priority: "Medium",
    status: "Not Scheduled",
    prescriptionId: "PR-" + Math.floor(Math.random() * 10000),
    patientId: "",
    clinicId: "C-1",
    PHN_ID: "",
    date: "",
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const userStr = sessionStorage.getItem("user");
        const userObj = userStr ? JSON.parse(userStr) : {};
        const clinicId = userObj?.clinicId || "C-1";

        const [patRes, docRes] = await Promise.all([
          AxiosInstance.get(`/patient/get-all-by-clinic/${clinicId}`).catch(
            () => ({ data: [] }),
          ),
          AxiosInstance.get(`/user/get-doctor?clinicId=${clinicId}`).catch(
            () => ({ data: [] }),
          ),
        ]);

        let patArray = [];
        if (patRes.data?.patients) patArray = patRes.data.patients;
        else if (patRes.data?.data) patArray = patRes.data.data;
        else if (Array.isArray(patRes.data)) patArray = patRes.data;

        setPatients(
          patArray.map((p) => {
            const pb = p.patientBasic || p;
            const name =
              `${pb.firstName || ""} ${pb.lastName || ""}`.trim() ||
              p.patientName;
            const pid = pb.patientId || pb._id || p.patientId;
            const phnid = p.PHN_ID || pb.PHN_ID || "";
            return {
              label: `${name} (${pid})`,
              value: pid,
              name: name,
              ptNo: pid,
              PHN_ID: phnid,
            };
          }),
        );

        let docArray = [];
        if (docRes.data?.users) docArray = docRes.data.users;
        else if (docRes.data?.data) docArray = docRes.data.data;
        else if (docRes.data?.doctors) docArray = docRes.data.doctors;
        else if (Array.isArray(docRes.data)) docArray = docRes.data;
        else if (docRes.data) docArray = [docRes.data];

        setDoctors(
          docArray.map((d) => ({
            label: d.userName || d.name || "Unknown",
            value: d._id,
            name: d.userName || d.name,
          })),
        );
        setFormData((prev) => ({ ...prev, clinicId }));
      } catch (err) {
        console.error("Failed to load select targets", err);
      }
    };
    if (isModalOpen) fetchDropdownData();
  }, [isModalOpen]);

  // Live Database Fetcher
  const [pendingScans, setPendingScans] = useState([]);

  const fetchActiveScans = async () => {
    try {
      const res = await AxiosInstance.post("/scan-prescription/by-status", {
        statuses: ["Not Scheduled", "Missing", "Not Reviewed"],
      });
      if (res.data?.data) {
        setPendingScans(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch live scan data", err);
    }
  };

  useEffect(() => {
    fetchActiveScans();
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure you want to delete this scan prescription?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await AxiosInstance.delete(`/scan-prescription/${id}`);
          fetchActiveScans();
        } catch (e) {
          console.error(e);
          message.error("Failed to delete.");
        }
      }
    });
  };

  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState({ date: "", time: "" });

  const confirmSchedule = async () => {
    if (!scheduleDate.date || !scheduleDate.time) {
      message.warning("Please select both a date and time to schedule.");
      return;
    }
    try {
      const appointmentDateTime = dayjs(
        `${scheduleDate.date}T${scheduleDate.time}`,
      ).toISOString();
      await AxiosInstance.put(`/scan-prescription/${schedulingId}/status`, {
        status: "Scheduled",
        appointmentDateTime,
      });
      message.success("Successfully Scheduled!");
      setSchedulingId(null);
      setScheduleDate({ date: "", time: "" });
      fetchActiveScans();
    } catch (e) {
      console.error(e);
      message.error("Failed to schedule.");
    }
  };

  const filteredData = pendingScans.filter((p) => p.status === activeTab);

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      message.warning("Date and Time are mandatory for creating appointments.");
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentDateTime = dayjs(
        `${formData.date}T${formData.time}`,
      ).toISOString();
      const payload = { ...formData, appointmentDateTime, status: "Scheduled" };

      await AxiosInstance.post("/scan-prescription", payload);
      setIsModalOpen(false);
      message.success("Scan Appointment Created & Scheduled Successfully!");
      setFormData({
        ...formData,
        patientId: "",
        ptrName: "",
        ptNo: "",
        doctorId: "",
        drName: "",
        PHN_ID: "",
        scanType: "MRI Brain",
        scanCenter: "Internal",
        priority: "Medium",
        prescriptionId: "PR-" + Math.floor(Math.random() * 10000),
        date: "",
        time: "",
      });
      fetchActiveScans(); // Refresh table
    } catch (error) {
      console.error("Failed to create scan prescription", error);
      message.error("Failed to create scan prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 text-red-600 border border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "Low":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px] transition-all duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-black text-slate-800 text-4xl tracking-tight">
              Scan <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-slate-500 font-medium text-[20px] mt-10">
              Schedule an Appointment
            </p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all hover:scale-105 uppercase tracking-widest"
              >
                <Icon icon="solar:file-send-bold-duotone" className="text-lg" />{" "}
                Create Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mt-2">
          {["Not Scheduled", "Missing", "Not Reviewed"].map((tab) => {
            const isActive = activeTab === tab;
            const count = pendingScans.filter((p) => p.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
              >
                {tab}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] ${isActive ? "bg-white/20" : "bg-slate-200"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                    Patient Details
                  </th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                    Requested Scan
                  </th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                    Added Date
                  </th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                    Priority
                  </th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((row, i) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                            {row.ptrName}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            {row.ptNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black tracking-tight text-blue-600 text-sm">
                        {row.scanType}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-500 text-sm">
                        {dayjs(row.createdAt || row.appointmentDateTime).format(
                          "YYYY-MM-DD",
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityColor(row.priority)}`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {row.status === "Not Scheduled" && (
                            <button
                              onClick={() => setSchedulingId(row._id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all shadow-md shadow-blue-500/20"
                              title="Schedule Now"
                            >
                              <Icon
                                icon="solar:calendar-add-bold-duotone"
                                className="text-sm"
                              />{" "}
                              Schedule
                            </button>
                          )}
                          <button
                            onClick={() => message.info("Edit modal placeholder")}
                            className="flex items-center gap-1 w-8 h-8 justify-center rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-110 transition-all"
                            title="Edit"
                          >
                            <Icon icon="solar:pen-bold-duotone" />
                          </button>
                          <button
                            onClick={() => handleDelete(row._id)}
                            className="flex items-center gap-1 w-8 h-8 justify-center rounded-lg text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:scale-110 transition-all"
                            title="Delete"
                          >
                            <Icon icon="solar:trash-bin-trash-bold-duotone" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Icon
                          icon="solar:folder-open-bold-duotone"
                          className="text-4xl opacity-50"
                        />
                        <span className="font-medium">
                          No actions pending for status "{activeTab}".
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/50">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                New <span className="text-blue-600">Scan Prescription</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
              >
                <Icon
                  icon="solar:close-circle-bold-duotone"
                  className="text-2xl"
                />
              </button>
            </div>

            <form
              onSubmit={handleCreatePrescription}
              className="p-8 flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-20 relative">
                <SearchPicker
                  label="Select Patient"
                  options={patients}
                  value={formData.patientId}
                  placeholder="Search Patient..."
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      patientId: opt.value,
                      ptrName: opt.name,
                      ptNo: opt.ptNo,
                      PHN_ID: opt.PHN_ID,
                    })
                  }
                />

                <SearchPicker
                  label="Select Requesting Doctor"
                  options={doctors}
                  value={formData.doctorId}
                  placeholder="Search Doctor..."
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      doctorId: opt.value,
                      drName: opt.name,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                    Scan Type
                  </label>
                  <select
                    name="scanType"
                    value={formData.scanType}
                    onChange={handleInputChange}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-black text-blue-600 transition-all shadow-inner tracking-tight"
                  >
                    <option value="MRI Brain">MRI Brain</option>
                    <option value="MRI Spine">MRI Spine</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="CT Abdomen">CT Abdomen</option>
                    <option value="X-Ray Chest">X-Ray Chest</option>
                    <option value="Ultrasound">Ultrasound</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    required
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-black text-rose-500 transition-all shadow-inner tracking-tight"
                  >
                    <option value="High">High</option>
                    <option value="Medium" className="text-amber-500">
                      Medium
                    </option>
                    <option value="Low" className="text-emerald-500">
                      Low
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 uppercase tracking-widest disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? "Creating..." : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Schedule Confirmation Modal */}
      {schedulingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 scale-in">
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4 border-b border-slate-100 pb-4">
              Set <span className="text-blue-600">Schedule</span>
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate.date}
                  onChange={(e) =>
                    setScheduleDate({ ...scheduleDate, date: e.target.value })
                  }
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleDate.time}
                  onChange={(e) =>
                    setScheduleDate({ ...scheduleDate, time: e.target.value })
                  }
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setSchedulingId(null);
                  setScheduleDate({ date: "", time: "" });
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSchedule}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:scale-105 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/30"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ScanAppointmentCreateForm;
