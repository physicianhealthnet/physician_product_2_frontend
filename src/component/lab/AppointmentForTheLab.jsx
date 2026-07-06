import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import dayjs from "dayjs";
import FileViewerModal from "../scan/FileViewerModal";
import AIGaugeReport from "../ui/AIGaugeReport";
import { jsPDF } from 'jspdf';
import { message, Modal } from "antd";

function AppointmentForTheLab() {
  const [activeTab, setActiveTab] = useState("Scheduled");
  const [metrics, setMetrics] = useState({
    todayTotal: 0, morning: 0, afternoon: 0, evening: 0
  });
  const [pendingLabs, setPendingLabs] = useState([]);
  
  // Final Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [selectedLabType, setSelectedLabType] = useState("");
  const [reportRemarks, setReportRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedReportNotes, setSelectedReportNotes] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState({});
  const [customPrompt, setCustomPrompt] = useState("");
  const [ultrasoundFile, setUltrasoundFile] = useState(null);
  
  // Dynamic Form States
  const [reportSampleType, setReportSampleType] = useState("Blood");
  const [reportFields, setReportFields] = useState([{ name: "", value: "", unit: "", referenceRange: "" }]);
  const [activePatient, setActivePatient] = useState(null);

  const getDefaultDateTime = () => {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const time = now.toTimeString().substring(0, 5);
    return { date, time };
  };

  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(getDefaultDateTime());

  const confirmSchedule = async () => {
    if (!scheduleDate.date || !scheduleDate.time) {
      message.warning("Please select both a date and time to schedule.");
      return;
    }
    try {
      const appointmentDateTime = dayjs(`${scheduleDate.date}T${scheduleDate.time}`).toISOString();
      await AxiosInstance.put(`/lab-prescription/${schedulingId}/status`, { 
        status: "Scheduled", 
        appointmentDateTime 
      });
      message.success("Successfully Scheduled!");
      setSchedulingId(null);
      setScheduleDate(getDefaultDateTime());
      fetchData();
    } catch (e) {
      console.error(e);
      message.error("Failed to schedule.");
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, labsRes] = await Promise.all([
        AxiosInstance.get('/lab-prescription/stats').catch(()=>({})),
        AxiosInstance.post('/lab-prescription/by-status', { statuses: ["Scheduled", "Not Scheduled", "Missing", "Report Not Ready", "Completed"] }).catch(()=>({}))
      ]);
      if (statsRes.data?.data) setMetrics(statsRes.data.data);
      if (labsRes.data?.data) {
        const now = new Date();
        const formattedLabs = labsRes.data.data.map(lab => {
          let computedStatus = lab.status;
          if (computedStatus === "Scheduled" && lab.appointmentDateTime) {
            const aptDate = new Date(lab.appointmentDateTime);
            if (aptDate < now) {
              computedStatus = "Missing";
            }
          }
          return { ...lab, status: computedStatus };
        });
        setPendingLabs(formattedLabs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkArrived = async (id) => {
    try {
      await AxiosInstance.put(`/lab-prescription/${id}/status`, { status: "Report Not Ready" });
      fetchData();
    } catch(e) { console.error(e); }
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await AxiosInstance.delete(`/lab-prescription/${id}`);
          fetchData();
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const openReportModal = (row) => {
    setUltrasoundFile(null);
    setSelectedLabId(row._id);
    setSelectedLabType(row.labType);
    setActivePatient({ name: row.ptrName, ptNo: row.ptNo, doctor: row.drName, date: dayjs(row.createdAt).format("DD-MMM-YYYY") });
    setReportSampleType("Blood");
    
    // Auto-populate some fields based on type
    let initialFields = [{ name: "", value: "", unit: "", referenceRange: "" }];
    const labTypeNorm = row.labType ? row.labType.toLowerCase().trim() : "";
    console.log("Opening report modal. labType:", row.labType, " | labTypeNorm:", labTypeNorm);
    
    if (labTypeNorm === "complete blood count (cbc)" || labTypeNorm === "blood test" || labTypeNorm === "blood" || labTypeNorm === "cbc") {
      initialFields = [
        { name: "Hemoglobin", value: "", unit: "g/dL", referenceRange: "13.0 - 17.0" },
        { name: "WBC Count", value: "", unit: "cells/mcL", referenceRange: "4,500 - 11,000" },
        { name: "Platelet Count", value: "", unit: "/mcL", referenceRange: "150,000 - 450,000" }
      ];
    } else if (labTypeNorm === "lipid profile" || labTypeNorm === "lipid panel") {
      initialFields = [
        { name: "Total Cholesterol", value: "", unit: "mg/dL", referenceRange: "< 200" },
        { name: "LDL Cholesterol", value: "", unit: "mg/dL", referenceRange: "< 100" },
        { name: "HDL Cholesterol", value: "", unit: "mg/dL", referenceRange: "> 40" },
        { name: "Triglycerides", value: "", unit: "mg/dL", referenceRange: "< 150" }
      ];
    } else if (labTypeNorm === "thyroid panel" || labTypeNorm === "tft" || labTypeNorm === "thyroid profile") {
      initialFields = [
        { name: "TSH", value: "", unit: "mIU/L", referenceRange: "0.4 - 4.0" },
        { name: "Free T4", value: "", unit: "ng/dL", referenceRange: "0.8 - 1.8" },
        { name: "Free T3", value: "", unit: "pg/mL", referenceRange: "2.3 - 4.2" }
      ];
    } else if (labTypeNorm === "liver function test (lft)" || labTypeNorm === "lft" || labTypeNorm === "liver function test") {
      initialFields = [
        { name: "Total Bilirubin", value: "", unit: "mg/dL", referenceRange: "0.1 - 1.2" },
        { name: "SGPT (ALT)", value: "", unit: "U/L", referenceRange: "7 - 56" },
        { name: "SGOT (AST)", value: "", unit: "U/L", referenceRange: "5 - 40" },
        { name: "Alkaline Phosphatase", value: "", unit: "U/L", referenceRange: "44 - 147" },
        { name: "Total Protein", value: "", unit: "g/dL", referenceRange: "6.0 - 8.3" }
      ];
    } else if (labTypeNorm === "kidney function test (kft)" || labTypeNorm === "kft" || labTypeNorm === "renal profile") {
      initialFields = [
        { name: "Blood Urea Nitrogen (BUN)", value: "", unit: "mg/dL", referenceRange: "7 - 20" },
        { name: "Serum Creatinine", value: "", unit: "mg/dL", referenceRange: "0.6 - 1.2" },
        { name: "Uric Acid", value: "", unit: "mg/dL", referenceRange: "3.5 - 7.2" },
        { name: "Calcium", value: "", unit: "mg/dL", referenceRange: "8.5 - 10.2" }
      ];
    } else if (labTypeNorm === "urine test" || labTypeNorm === "urine analysis" || labTypeNorm === "urine routine") {
      setReportSampleType("Urine");
      initialFields = [
        { name: "Color", value: "", unit: "-", referenceRange: "Pale Yellow" },
        { name: "pH", value: "", unit: "-", referenceRange: "4.5 - 8.0" },
        { name: "Specific Gravity", value: "", unit: "-", referenceRange: "1.005 - 1.030" },
        { name: "Protein", value: "", unit: "-", referenceRange: "Negative" },
        { name: "Glucose", value: "", unit: "-", referenceRange: "Negative" }
      ];
    } else if (labTypeNorm === "hba1c" || labTypeNorm === "glycosylated hemoglobin") {
      initialFields = [
        { name: "HbA1c", value: "", unit: "%", referenceRange: "< 5.7" },
        { name: "Estimated Average Glucose", value: "", unit: "mg/dL", referenceRange: "< 117" }
      ];
    } else if (labTypeNorm === "fasting blood sugar (fbs)" || labTypeNorm === "fbs" || labTypeNorm === "blood sugar") {
      initialFields = [
        { name: "Fasting Blood Sugar", value: "", unit: "mg/dL", referenceRange: "70 - 100" }
      ];
    }
    
    setReportFields(initialFields);
    setReportRemarks("");
    setCustomPrompt("");
    setIsReportModalOpen(true);
  }

  const handleFieldChange = (index, field, value) => {
    const updated = [...reportFields];
    updated[index][field] = value;
    setReportFields(updated);
  }

  const addFieldRow = () => {
    setReportFields([...reportFields, { name: "", value: "", unit: "", referenceRange: "" }]);
  }

  const handleAIGenerate = async () => {
    const validResults = reportFields.filter(f => f.name && f.value);
    if (validResults.length === 0) {
      message.warning("Please enter at least one test result value to analyze.");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const res = await AxiosInstance.post('/analyze-lab', {
        results: validResults,
        labType: selectedLabType,
        customPrompt: customPrompt
      });
      
      if (res.data?.report) {
        setReportRemarks(res.data.report);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to generate AI interpretation.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleGenerateAIReport = async (id) => {
    setIsGeneratingAI(prev => ({ ...prev, [id]: true }));
    try {
      const strictJSONPrompt = `
You are a medical AI. Return the analysis STRICTLY as a JSON array. DO NOT use markdown blocks or extra text.
Format EXACTLY like this:
[
  {
    "test_name": "Hemoglobin",
    "value": "12.5",
    "unit": "g/dL",
    "reference": "13.0 - 17.0",
    "flag": "low", 
    "impression": "Mild anemia observed.",
    "patient_solution": "Increase iron-rich foods in diet.",
    "treatment_suggestion": "Iron supplements daily."
  }
]
IMPORTANT: "flag" MUST be one of: "low", "normal", "high", "critical".
`;
      const finalPrompt = customPrompt ? strictJSONPrompt + "\nUser Instructions: " + customPrompt : strictJSONPrompt;
      const res = await AxiosInstance.post(`/lab-prescription/${id}/generate-ai-report`, {
        customPrompt: finalPrompt
      });
      if (res.data?.success) {
        message.success("AI Report Generated successfully!");
        fetchData();
        // Optionally show it immediately
        if (res.data.data?.finalReportNotes) {
          setSelectedReportNotes(res.data.data.finalReportNotes);
        }
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Failed to generate AI report.");
    } finally {
      setIsGeneratingAI(prev => ({ ...prev, [id]: false }));
    }
  }

  const removeFieldRow = (index) => {
    setReportFields(reportFields.filter((_, i) => i !== index));
  }

  const handleCompleteReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CLINIC LAB REPORT", pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Official Diagnostic Results", pageWidth / 2, 26, { align: 'center' });
      
      // Meta Info
      doc.setFontSize(10);
      doc.text(`Date: ${dayjs().format('DD-MMM-YYYY')}`, pageWidth - 15, 35, { align: 'right' });
      doc.text(`Lab Provider: Internal Setup`, pageWidth - 15, 41, { align: 'right' });
      
      // Patient Block
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 48, pageWidth - 30, 25, 3, 3, 'FD');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text("PATIENT NAME", 20, 56);
      doc.text("PRESCRIBING DOCTOR", 80, 56);
      doc.text("TEST REQUESTED", 140, 56);
      
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`${activePatient?.name} (${activePatient?.ptNo})`, 20, 62);
      doc.text(`${activePatient?.doctor}`, 80, 62);
      doc.setTextColor(37, 99, 235); // blue
      doc.text(`${selectedLabType}`, 140, 62);
      
      // Table Header
      let y = 85;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Diagnostic Parameters", 15, y);
      
      y += 5;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, pageWidth - 30, 8, 'F');
      doc.setFontSize(9);
      doc.text("Parameter / Test", 20, y + 6);
      doc.text("Result Value", 80, y + 6);
      doc.text("Unit", 130, y + 6);
      doc.text("Ref. Range", 160, y + 6);
      
      y += 14;
      doc.setFont("helvetica", "normal");
      reportFields.forEach((field) => {
        if (y > 270) {
           doc.addPage();
           y = 20;
        }
        doc.setTextColor(50, 50, 50);
        doc.text(field.name || '-', 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(field.value || '-', 80, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(field.unit || '-', 130, y);
        doc.text(field.referenceRange || '-', 160, y);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(15, y + 3, pageWidth - 15, y + 3);
        y += 10;
      });
      
      // Footer
      y += 30;
      if (y > 270) {
         doc.addPage();
         y = 30;
      }
      doc.setDrawColor(150, 150, 150);
      doc.line(pageWidth - 70, y, pageWidth - 15, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Authorized Signature", pageWidth - 42.5, y + 6, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("LAB DEPARTMENT", pageWidth - 42.5, y + 10, { align: 'center' });

      // Generate File Payload
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `${selectedLabType.replace(/\s+/g, '_')}_Report.pdf`, { type: 'application/pdf' });

      const payload = new FormData();
      payload.append("status", "Completed");
      payload.append("finalReportNotes", reportRemarks || "Dynamically Generated PDF Report.");
      payload.append("labReportFile", pdfFile);
      
      // Store structured results for future AI analysis
      payload.append("testResults", JSON.stringify(reportFields.filter(f => f.name && f.value)));

      if (ultrasoundFile) {
        payload.append("ultrasoundFile", ultrasoundFile);
      }

      await AxiosInstance.put(`/lab-prescription/${selectedLabId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      message.success("Final Report Generated, PDF Saved & Request Completed!");
      setUltrasoundFile(null);
      setIsReportModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Failed to generate report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const StatCard = ({ title, subValue, total, icon, color, bgGradient, iconBg, iconColor }) => (
    <div className={`group relative overflow-hidden bg-linear-to-br ${bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-2xl hover:scale-[1.02] transition-all duration-300`}>
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
      <div className="p-6 flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{subValue}</span>
            <span className="text-sm font-medium text-slate-400 opacity-80">/ {total}</span>
          </div>
          <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-1 overflow-hidden shadow-inner">
            <div className={`h-full ${color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`} style={{ width: `${total > 0 ? (subValue / total) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className={`w-16 h-16 ml-4 shrink-0 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon icon={icon} className="text-3xl" />
        </div>
      </div>
    </div>
  );

  const filteredAppts = pendingLabs.filter(a => a.status === activeTab);

  return (
    <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px] transition-all duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">
            Lab <span className="text-blue-500">Operation Room</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] mt-2">
            Today's Lab Roster & Missing Pipeline
          </p>
        </div>
      </div>

      {/* Row 1: Doctor-like Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Today's Appointments" subValue={metrics.todayTotal} total={metrics.todayTotal || 0} icon="solar:clipboard-list-bold-duotone" color="bg-blue-500" bgGradient="from-blue-500/10 to-indigo-500/10" iconBg="bg-blue-500/10" iconColor="text-blue-600" />
        <StatCard title="Morning (M)" subValue={metrics.morning} total={metrics.todayTotal || 0} icon="solar:sun-2-bold-duotone" color="bg-amber-500" bgGradient="from-amber-500/10 to-orange-500/10" iconBg="bg-amber-500/10" iconColor="text-amber-600" />
        <StatCard title="Afternoon (A)" subValue={metrics.afternoon} total={metrics.todayTotal || 0} icon="solar:clouds-bold-duotone" color="bg-sky-500" bgGradient="from-sky-500/10 to-cyan-500/10" iconBg="bg-sky-500/10" iconColor="text-sky-600" />
        <StatCard title="Evening (E)" subValue={metrics.evening} total={metrics.todayTotal || 0} icon="solar:moon-bold-duotone" color="bg-indigo-500" bgGradient="from-indigo-500/10 to-violet-500/10" iconBg="bg-indigo-500/10" iconColor="text-indigo-600" />
      </div>

      {/* Main Workspace Table */}
      <div className="flex flex-col">
        {/* Modern Tab Selector */}
        <div className="flex items-center p-2 bg-slate-50/50 border-b border-slate-200 overflow-x-auto shadow-inner w-full hide-scrollbar">
          {["Scheduled", "Not Scheduled", "Missing", "Report Not Ready", "Completed"].map(tab => {
            const count = pendingLabs.filter(a => a.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === tab ? "text-white shadow-lg bg-linear-to-r from-blue-600 to-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center justify-center ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden bg-white border border-slate-200 shadow-sm mt-4 rounded-xl">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">Patient</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">Lab Type</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">Referral Doctor</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">Time / Slot</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppts.length > 0 ? filteredAppts.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600">{row.ptrName}</span>
                      <span className="text-xs text-slate-400 font-bold">{row.ptNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-blue-600 tracking-tight text-sm">{row.labType}</td>
                  <td className="px-6 py-4 font-bold text-slate-600 text-sm">{row.drName}</td>
                  <td className="px-6 py-4 font-bold text-slate-500 text-sm">{row.appointmentDateTime ? dayjs(row.appointmentDateTime).format('DD MMM YYYY, h:mm A') : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {row.status === "Scheduled" && (
                        <button onClick={() => handleMarkArrived(row._id)} className="flex items-center justify-center gap-1 w-8 h-8 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-110 transition-all" title="Mark Arrived">
                          <Icon icon="solar:check-circle-bold-duotone" />
                        </button>
                      )}
                      {(row.status === "Not Scheduled" || row.status === "Missing") && (
                        <button onClick={() => setSchedulingId(row._id)} className="flex items-center gap-1 w-8 h-8 justify-center rounded-lg text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:scale-110 transition-all" title="Schedule Appointment">
                          <Icon icon="solar:calendar-add-bold-duotone" />
                        </button>
                      )}
                      {row.status === "Report Not Ready" && (
                        <button onClick={() => openReportModal(row)} className="flex items-center justify-center gap-2 px-3 h-8 rounded-lg text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-wider" title="Write Final Report">
                          <Icon icon="solar:document-add-bold-duotone" className="text-sm" /> Add Report
                        </button>
                      )}
                      {row.status === "Completed" && (
                        <div className="flex items-center gap-2">
                          {row.finalReportFileUrl && (
                            <button onClick={() => {
                              const url = row.finalReportFileUrl.startsWith('http') 
                                ? row.finalReportFileUrl 
                                : `${AxiosInstance.defaults.baseURL}${row.finalReportFileUrl}`;
                              setPreviewUrl(url);
                            }} className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider" title="View PDF Report">
                              <Icon icon="solar:document-bold-duotone" className="text-sm" /> View Doc
                            </button>
                          )}
                          {row.ultrasoundImgUrl && (
                            <button onClick={() => {
                              const url = row.ultrasoundImgUrl.startsWith('http') 
                                ? row.ultrasoundImgUrl 
                                : `${AxiosInstance.defaults.baseURL}${row.ultrasoundImgUrl}`;
                              setPreviewUrl(url);
                            }} className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider" title="View Ultrasound Image">
                              <Icon icon="solar:gallery-bold-duotone" className="text-sm" /> View Ultrasound
                            </button>
                          )}
                          {row.finalReportNotes && row.finalReportNotes !== "Dynamically Generated PDF Report." ? (
                            <button onClick={() => setSelectedReportNotes(row.finalReportNotes)} className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider" title="View AI Interpretation">
                              <Icon icon="solar:magic-stick-3-bold-duotone" className="text-sm" /> AI Report
                            </button>
                          ) : (
                            <button 
                              disabled={isGeneratingAI[row._id]}
                              onClick={() => handleGenerateAIReport(row._id)} 
                              className={`flex items-center gap-2 px-3 h-8 justify-center rounded-lg transition-all font-black text-[10px] uppercase tracking-wider ${isGeneratingAI[row._id] ? 'bg-slate-100 text-slate-400' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-105'}`} 
                              title="Generate AI Report"
                            >
                              <Icon icon={isGeneratingAI[row._id] ? "line-md:loading-twotone-loop" : "solar:magic-stick-3-bold-duotone"} className="text-sm" /> 
                              {isGeneratingAI[row._id] ? "Generating..." : "Generate AI Report"}
                            </button>
                          )}
                        </div>
                      )}
                      {row.status !== "Completed" && (
                        <button onClick={() => handleDelete(row._id)} className="flex items-center justify-center gap-1 w-8 h-8 rounded-lg text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:scale-110 transition-all" title="Delete">
                          <Icon icon="solar:trash-bin-trash-bold-duotone" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Icon icon="solar:calendar-broken-bold-duotone" className="text-4xl opacity-50" />
                      <span className="font-medium">No appointments currently registered for "{activeTab}".</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Final Report Modal Dialog */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/50">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Final Diagnostics <span className="text-blue-600">Report</span></h2>
              <button disabled={isSubmitting} onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                <Icon icon="solar:close-circle-bold-duotone" className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleCompleteReport} className="flex flex-col">
              {/* PDF Container */}
              <div className="p-8 max-h-[65vh] overflow-y-auto bg-slate-100 hide-scrollbar">
                <div id="pdf-report-content" className="bg-white p-10 min-h-[297mm] shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-sm mx-auto" style={{width: '210mm'}}>
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-slate-800">CLINIC LAB REPORT</h1>
                      <p className="text-sm font-bold text-slate-500 mt-1">Official Diagnostic Results</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">Date: {dayjs().format('DD-MMM-YYYY')}</p>
                      <p className="text-sm font-bold text-slate-700">Lab Provider: Internal Setup</p>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Patient Name</p>
                      <p className="font-bold text-slate-800">{activePatient?.name} ({activePatient?.ptNo})</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Prescribing Doctor</p>
                      <p className="font-bold text-slate-800">{activePatient?.doctor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Test Requested</p>
                      <p className="font-bold text-blue-600">{selectedLabType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Sample Type</p>
                      <select value={reportSampleType} onChange={(e)=>setReportSampleType(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold mt-1">
                        <option value="Blood">Blood</option>
                        <option value="Urine">Urine</option>
                        <option value="Swab">Swab</option>
                        <option value="Sputum">Sputum</option>
                        <option value="Tissue">Tissue</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Test Parameters Table */}
                  <div className="mb-8 relative z-10 w-full overflow-hidden">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-2 mb-4">Diagnostic Parameters</h3>
                    <table className="w-full text-left" style={{tableLayout: 'fixed'}}>
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
                          <th className="p-3 rounded-l-lg w-[30%]">Parameter / Test</th>
                          <th className="p-3 w-[20%]">Result Value</th>
                          <th className="p-3 w-[20%]">Unit</th>
                          <th className="p-3 w-[20%]">Ref. Range</th>
                          <th className="p-3 rounded-r-lg w-[10%] text-center" data-html2canvas-ignore="true">Act</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportFields.map((field, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-2"><input type="text" value={field.name} onChange={(e)=>handleFieldChange(i, 'name', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-slate-300 rounded px-1 py-1 outline-none font-bold text-slate-700 text-sm placeholder:text-transparent focus:placeholder:text-slate-300" placeholder="e.g. Hemoglobin" /></td>
                            <td className="p-2"><input type="text" value={field.value} onChange={(e)=>handleFieldChange(i, 'value', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded px-2 py-1 outline-none font-black text-blue-600 text-sm placeholder:text-transparent focus:placeholder:text-blue-300" placeholder="e.g. 14.5" /></td>
                            <td className="p-2"><input type="text" value={field.unit} onChange={(e)=>handleFieldChange(i, 'unit', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-slate-300 rounded px-1 py-1 outline-none font-medium text-slate-500 text-sm placeholder:text-transparent focus:placeholder:text-slate-300" placeholder="g/dL" /></td>
                            <td className="p-2"><input type="text" value={field.referenceRange} onChange={(e)=>handleFieldChange(i, 'referenceRange', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-slate-300 rounded px-1 py-1 outline-none font-medium text-slate-500 text-sm placeholder:text-transparent focus:placeholder:text-slate-300" placeholder="13.0 - 17.0" /></td>
                            <td className="p-2 text-center" data-html2canvas-ignore="true">
                              <button type="button" onClick={() => removeFieldRow(i)} className="text-rose-400 hover:text-rose-600 bg-rose-50 p-1.5 rounded-lg transition-colors"><Icon icon="solar:trash-bin-trash-bold" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={addFieldRow} className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors" data-html2canvas-ignore="true">
                      <Icon icon="solar:add-circle-bold-duotone" /> Add Parameter Row
                    </button>
                  </div>

                  {/* Remarks */}
                  <div className="relative">
                    <div className="flex flex-col gap-2 mb-4" data-html2canvas-ignore="true">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ultrasound Image / Scan (Optional)</label>
                      <input 
                        type="file"
                        accept="image/*"
                        disabled={isSubmitting}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 shadow-inner focus:border-blue-300 transition-all"
                        onChange={(e) => setUltrasoundFile(e.target.files[0])}
                      />
                    </div>

                    <div className="flex flex-col gap-2 mb-4" data-html2canvas-ignore="true">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Additional Instructions for AI (Optional)</label>
                      <textarea 
                        rows={2}
                        disabled={isSubmitting || isAnalyzing}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 shadow-inner focus:border-blue-300 transition-all placeholder:font-medium placeholder:text-slate-300 resize-none"
                        placeholder="e.g., Focus on hemoglobin levels, compare with standard ranges for athletes, etc."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                      <h3 className="text-md font-black text-slate-800">Doctor/Technician Notes (Optional)</h3>
                      <button
                        type="button"
                        disabled={isAnalyzing || isSubmitting}
                        onClick={handleAIGenerate}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 hover:scale-105'}`}
                        data-html2canvas-ignore="true"
                      >
                        {isAnalyzing ? (
                          <><Icon icon="solar:magic-stick-3-bold-duotone" className="animate-pulse" /> Analyzing...</>
                        ) : (
                          <><Icon icon="solar:magic-stick-3-bold-duotone" /> {reportRemarks ? "Re-Generate AI" : "AI Interpretation"}</>
                        )}
                      </button>
                    </div>
                    <textarea 
                      value={reportRemarks} onChange={(e)=>setReportRemarks(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-400 transition-colors font-medium text-slate-700 resize-none text-sm placeholder:text-slate-300 shadow-inner"
                      placeholder={isAnalyzing ? "AI is analyzing results..." : "Enter additional findings, recommendations, or qualitative assessments..."}
                    />
                  </div>
                  
                  {/* Footer Signature */}
                  <div className="mt-16 pt-8 border-t-2 border-slate-100 flex justify-end">
                    <div className="text-center">
                      <div className="h-10 border-b border-slate-400 w-48 mb-2"></div>
                      <p className="text-sm font-bold text-slate-700">Authorized Signature</p>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Lab Department</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/80 border-t border-slate-200 flex justify-end gap-3 z-10 relative shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <button type="button" disabled={isSubmitting} onClick={() => setIsReportModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 uppercase tracking-widest disabled:opacity-50">
                  {isSubmitting ? "Generating PDF..." : "Generate PDF File & Complete"} <Icon icon="solar:document-medicine-bold-duotone" className="text-lg" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Report View Modal */}
      {selectedReportNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300 no-print" data-html2canvas-ignore="true">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Icon icon="solar:magic-stick-3-bold-duotone" className="text-xl" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">AI Lab <span className="text-emerald-600">Interpretation</span></h2>
              </div>
              <button onClick={() => setSelectedReportNotes(null)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                <Icon icon="solar:close-circle-bold-duotone" className="text-2xl" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">
              {(() => {
                let parsedData = null;
                try {
                  // Try to clean up any markdown blocks if the AI messed up
                  let cleanString = selectedReportNotes.trim();
                  if (cleanString.startsWith('\`\`\`json')) {
                    cleanString = cleanString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                  }
                  parsedData = JSON.parse(cleanString);
                } catch (e) {
                  parsedData = null;
                }

                if (parsedData && Array.isArray(parsedData)) {
                  // Standardize the fields for AIGaugeReport
                  const mappedItems = parsedData.map(item => ({
                    title: item.test_name || "Lab Value",
                    value: item.value || "",
                    unit: item.unit || "",
                    reference: item.reference || "",
                    impression: item.impression || "",
                    flag: item.flag || "normal",
                    patient_solution: item.patient_solution || "",
                    treatment_suggestion: item.treatment_suggestion || "",
                    type: "lab"
                  }));
                  return (
                    <AIGaugeReport 
                      items={mappedItems} 
                      color="indigo" 
                      icon="solar:test-tube-bold-duotone" 
                    />
                  );
                }

                // Fallback to legacy markdown rendering
                return (
                  <div className="prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                      {selectedReportNotes}
                    </pre>
                  </div>
                );
              })()}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1 uppercase tracking-wider">
                  <Icon icon="solar:danger-bold-duotone" width={16} />
                  <span>Clinical Disclaimer</span>
                </div>
                <p className="text-[11px] text-amber-600 leading-tight">
                  This interpretation is AI-generated based on the provided lab values. It must be correlated with clinical findings and validated by a pathologist or treating physician.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <button onClick={() => setSelectedReportNotes(null)} className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-black hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Schedule Confirmation Modal */}
      {schedulingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 scale-in">
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4 border-b border-slate-100 pb-4">Set <span className="text-blue-600">Schedule</span></h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">Date</label>
                <input type="date" value={scheduleDate.date} onChange={e => setScheduleDate({...scheduleDate, date: e.target.value})} className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 pl-1">Time</label>
                <input type="time" value={scheduleDate.time} onChange={e => setScheduleDate({...scheduleDate, time: e.target.value})} className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-bold text-slate-700 transition-all shadow-inner tracking-tight" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button onClick={() => { setSchedulingId(null); setScheduleDate(getDefaultDateTime()); }} className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest transition-colors">Cancel</button>
              <button onClick={confirmSchedule} className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:scale-105 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/30">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal wrapper */}
      {previewUrl && (
        <FileViewerModal fileUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

    </div>
  );
}

export default AppointmentForTheLab;
