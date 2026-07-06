import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import dayjs from "dayjs";
import FileViewerModal from "./FileViewerModal";
import { jsPDF } from "jspdf";
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
                  e.preventDefault();
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

function ScanPrescriptionFromTheDoctor() {
  const [activeTab, setActiveTab] = useState("Not Scheduled");
  const [metrics, setMetrics] = useState({
    todayTotal: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
    createdToday: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    last3Months: 0,
  });
  const [pendingScans, setPendingScans] = useState([]);

  // Modal Hooks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [patients, setPatients] = useState([]);
  console.log(patients);
  
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    PHN_ID: "",
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
    date: "",
    time: "",
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const userStr = sessionStorage.getItem("user");
        console.log(userStr);

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
        console.log(patRes);

        console.log("testing");

        console.log(patRes);

        let patArray =
          patRes.data?.patients ||
          patRes.data?.data ||
          (Array.isArray(patRes.data) ? patRes.data : []);
        setPatients(
          patArray.map((p) => {
            const pb = p.patientBasic || p;
            const name =
              `${pb.firstName || ""} ${pb.lastName || ""}`.trim() ||
              p.patientName;
            const pid = pb.patientId || pb._id || p.patientId;
            const PHN_ID = pb.PHN_ID;
            return {
              label: `${name} (${pid})`,
              value: pid,
              name: name,
              ptNo: pid,
              PHN_ID: PHN_ID,
              phone: pb.patientPhone || p.patientPhone,
            };
          }),
        );

        let docArray =
          docRes.data?.users ||
          docRes.data?.data ||
          docRes.data?.doctors ||
          (Array.isArray(docRes.data)
            ? docRes.data
            : [docRes.data].filter(Boolean));
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

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreatePrescription = async (e) => {
    console.log("function is trigred");
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const pdfBase64 = generatePrescriptionPDF(formData, false);
      const payload = { ...formData, pdfBase64 };
      console.log(payload, "data testing for phn id in creating prescription");
      if (formData.date && formData.time) {
        payload.appointmentDateTime = dayjs(
          `${formData.date}T${formData.time}`,
        ).toISOString();
        payload.status = "Scheduled";
      } else {
        payload.status = "Not Scheduled";
      }

      await AxiosInstance.post("/scan-prescription", payload);
      setIsModalOpen(false);
      message.success("Scan Prescription Created Successfully and Sent to Patient!");
      setFormData({
        ...formData,
        PHN_ID: "",
        patientId: "",
        ptrName: "",
        ptNo: "",
        doctorId: "",
        drName: "",
        scanType: "MRI Brain",
        scanCenter: "Internal",
        priority: "Medium",
        prescriptionId: "PR-" + Math.floor(Math.random() * 10000),
        date: "",
        time: "",
      });
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Failed to create scan prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, scansRes] = await Promise.all([
        AxiosInstance.get("/scan-prescription/stats").catch(() => ({})),
        AxiosInstance.post("/scan-prescription/by-status", {
          statuses: ["Not Scheduled", "Missing", "Completed"],
        }).catch(() => ({})), // Mapping Missed to Missing in backend
      ]);
      if (statsRes.data?.data) setMetrics(statsRes.data.data);
      if (scansRes.data?.data) {
        setPendingScans(
          scansRes.data.data.map((d) => ({
            ...d,
            status: d.status === "Missing" ? "Missed" : d.status,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await AxiosInstance.delete(`/scan-prescription/${id}`);
          message.success("Deleted successfully");
          fetchData();
        } catch (e) {
          console.error(e);
          message.error("Failed to delete");
        }
      }
    });
  };

  const generatePrescriptionPDF = (row, shouldSave = true) => {
    try {
      const doc = new jsPDF("p", "mm", "a5");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CLINIC PRESCRIPTION", pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Official Medical Order", pageWidth / 2, 21, {
        align: "center",
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(10, 26, pageWidth - 10, 26);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Prescription ID:`, 10, 35);
      doc.setFont("helvetica", "normal");
      doc.text(`${row.prescriptionId || "N/A"}`, 40, 35);

      doc.setFont("helvetica", "bold");
      doc.text(`Date Issued:`, pageWidth - 50, 35);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${dayjs(row.createdAt || new Date()).format("DD-MMM-YYYY")}`,
        pageWidth - 25,
        35,
      );

      // Patient Details
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, 42, pageWidth - 20, 25, 3, 3, "FD");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text("PATIENT NAME", 15, 50);
      doc.text("PATIENT ID", 80, 50);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${row.ptrName}`, 15, 56);
      doc.text(`${row.ptNo}`, 80, 56);

      // Order Details
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Requested Diagnostics:", 10, 80);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Scan Type:", 10, 90);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(`${row.scanType}`, 35, 90);

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text("Priority:", 10, 98);
      doc.setFont("helvetica", "bold");
      doc.text(`${row.priority}`, 35, 98);

      doc.setFont("helvetica", "normal");
      doc.text("Preferred Center:", 10, 106);
      doc.setFont("helvetica", "bold");
      doc.text(`${row.scanCenter}`, 45, 106);

      // Signatures
      doc.setDrawColor(150, 150, 150);
      doc.line(pageWidth - 60, 150, pageWidth - 10, 150);
      doc.setFontSize(9);
      doc.text(`Dr. ${row.drName}`, pageWidth - 35, 155, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("Prescribing Physician Signature", pageWidth - 35, 159, {
        align: "center",
      });

      if (shouldSave) {
        doc.save(
          `Prescription_${row.ptNo}_${dayjs(row.createdAt || new Date()).format("YYYYMMDD")}.pdf`,
        );
      }
      return doc.output("datauristring");
    } catch (err) {
      console.error(err);
      if (shouldSave) message.error("Failed to generate PDF download.");
      return null;
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    bgGradient,
    iconBg,
    iconColor,
  }) => (
    <div
      className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}
    >
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${color}`}
      />
      <div className="p-5 flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </span>
          <span className="text-3xl font-black text-slate-800">{value}</span>
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}
        >
          <Icon icon={icon} className="text-2xl" />
        </div>
      </div>
    </div>
  );

  const filteredData = pendingScans.filter((p) => p.status === activeTab);

  return (
    <div className="flex flex-col gap-8 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px] transition-all duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">
            Scan center <span className="text-blue-500">status & dashboard</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Manage and track X-Ray, CT, and MRI orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all hover:scale-105 uppercase tracking-widest"
          >
            <Icon icon="solar:file-send-bold-duotone" className="text-lg" />{" "}
            Create Prescription
          </button>
          {/* <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-black shadow-sm hover:text-blue-600 flex items-center gap-2 transition-colors uppercase tracking-widest h-full w-[150px]">
            <Icon icon="solar:export-bold-duotone" /> Export Lists
          </button> */}
        </div>
      </div>

      {/* Row 1: Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Today's Total"
          value={metrics.createdToday}
          icon="solar:clipboard-list-bold-duotone"
          color="bg-blue-500"
          bgGradient="from-blue-500/10 to-indigo-500/10"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Morning (M)"
          value={metrics.morning}
          icon="solar:sun-2-bold-duotone"
          color="bg-amber-500"
          bgGradient="from-amber-500/10 to-orange-500/10"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Afternoon (A)"
          value={metrics.afternoon}
          icon="solar:clouds-bold-duotone"
          color="bg-sky-500"
          bgGradient="from-sky-500/10 to-cyan-500/10"
          iconBg="bg-sky-500/10"
          iconColor="text-sky-600"
        />
        <StatCard
          title="Evening (E)"
          value={metrics.evening}
          icon="solar:moon-bold-duotone"
          color="bg-indigo-500"
          bgGradient="from-indigo-500/10 to-violet-500/10"
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Row 2: Historic Stats */}
      <h2 className="text-xl font-black text-slate-800 mt-2 border-t border-slate-200 pt-6">
        Historic & Pipeline Tracking
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Yesterday"
          value={metrics.yesterday}
          icon="solar:calendar-date-bold-duotone"
          color="bg-slate-500"
          bgGradient="from-slate-500/10 to-gray-500/10"
          iconBg="bg-slate-500/10"
          iconColor="text-slate-600"
        />
        <StatCard
          title="This Week"
          value={metrics.thisWeek}
          icon="solar:calendar-mark-bold-duotone"
          color="bg-emerald-500"
          bgGradient="from-emerald-500/10 to-teal-500/10"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="This Month"
          value={metrics.thisMonth}
          icon="solar:calendar-bold-duotone"
          color="bg-purple-500"
          bgGradient="from-purple-500/10 to-fuchsia-500/10"
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Last 3 Months"
          value={metrics.last3Months}
          icon="solar:chart-square-bold-duotone"
          color="bg-rose-500"
          bgGradient="from-rose-500/10 to-pink-500/10"
          iconBg="bg-rose-500/10"
          iconColor="text-rose-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mt-6">
        {["Not Scheduled", "Missed", "Completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Patient
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Scan Type
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Doctor
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Created Date
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Appt Date & Time
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">
                  Center
                </th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-right">
                  Task
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
                    <td className="px-6 py-4 font-bold text-slate-600 text-sm">
                      {row.drName}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500 text-sm">
                      {dayjs(row.createdAt).format("YYYY-MM-DD")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500 text-sm">
                      {row.appointmentDateTime
                        ? dayjs(row.appointmentDateTime).format(
                            "YYYY-MM-DD h:mm A",
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.scanCenter === "Internal" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}
                      >
                        {row.scanCenter}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">

                        {row.status === "Completed" &&
                          (row.finalReportFileUrl || row.finalReportNotes) && (
                            <button
                              onClick={() => {
                                if (row.finalReportFileUrl) {
                                  const formattedPath =
                                    row.finalReportFileUrl.replace(
                                      /^\/upload\//,
                                      "/uploads/",
                                    );
                                  const url = formattedPath.startsWith("http")
                                    ? formattedPath
                                    : `${AxiosInstance.defaults.baseURL}${formattedPath}`;
                                  setPreviewUrl(url);
                                  } else if (row.finalReportNotes) {
                                  Modal.info({
                                    title: "Final Diagnostic Notes",
                                    content: row.finalReportNotes,
                                  });
                                }
                              }}
                              className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider"
                              title="View Final Report"
                            >
                              <Icon
                                icon="solar:document-bold-duotone"
                                className="text-sm"
                              />{" "}
                              View Doc
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
                        <button
                          onClick={() => generatePrescriptionPDF(row)}
                          className="flex items-center gap-1 w-8 h-8 justify-center rounded-lg text-slate-600 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:scale-110 transition-all"
                          title="Download PDF"
                        >
                          <Icon icon="solar:printer-bold-duotone" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Icon
                        icon="solar:folder-open-bold-duotone"
                        className="text-4xl opacity-50"
                      />
                      <span className="font-medium">
                        No scan prescriptions found for status "{activeTab}".
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                      PHN_ID:opt.PHN_ID
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


      {previewUrl && (
        <FileViewerModal
          fileUrl={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}

export default ScanPrescriptionFromTheDoctor;
