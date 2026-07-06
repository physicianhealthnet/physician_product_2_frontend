import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import dayjs from "dayjs";
import FileViewerModal from "./FileViewerModal";
import AIGaugeReport from "../ui/AIGaugeReport";
import { message, Modal } from "antd";

function AppointmentForTheScan() {
  const [activeTab, setActiveTab] = useState("Scheduled");
  const [metrics, setMetrics] = useState({
    todayTotal: 0, morning: 0, afternoon: 0, evening: 0
  });
  const [pendingScans, setPendingScans] = useState([]);
  
  // Final Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportFiles, setReportFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedReportNotes, setSelectedReportNotes] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState({});
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);

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
      const appointmentDateTime = dayjs(
        `${scheduleDate.date}T${scheduleDate.time}`,
      ).toISOString();
      await AxiosInstance.put(`/scan-prescription/${schedulingId}/status`, {
        status: "Scheduled",
        appointmentDateTime,
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
      const [statsRes, scansRes] = await Promise.all([
        AxiosInstance.get('/scan-prescription/stats').catch(()=>({})),
        AxiosInstance.post('/scan-prescription/by-status', { statuses: ["Scheduled", "Not Scheduled", "Missing", "Report Not Ready", "Completed"] }).catch(()=>({}))
      ]);
      if (statsRes.data?.data) setMetrics(statsRes.data.data);
      if (scansRes.data?.data) {
        const now = new Date();
        const formattedScans = scansRes.data.data.map(scan => {
          let computedStatus = scan.status;
          if (computedStatus === "Scheduled" && scan.appointmentDateTime) {
            const aptDate = new Date(scan.appointmentDateTime);
            if (aptDate < now) {
              computedStatus = "Missing";
            }
          }
          return { ...scan, status: computedStatus };
        });
        setPendingScans(formattedScans);
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
      await AxiosInstance.put(`/scan-prescription/${id}/status`, { status: "Report Not Ready" });
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
          await AxiosInstance.delete(`/scan-prescription/${id}`);
          fetchData();
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const openReportModal = (scan) => {
    setSelectedScanId(scan._id);
    setSelectedScan(scan);
    setReportText(scan.finalReportNotes || "");
    setReportFiles([]);
    setCustomPrompt("");
    setIsReportModalOpen(true);
  }

  const handleAIGenerate = async () => {
    if (reportFiles.length === 0) {
      message.warning("Please attach a report document first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      // Send only the first file for AI analysis for now
      formData.append("xray", reportFiles[0]);
      formData.append("customPrompt", customPrompt);
      
      const res = await AxiosInstance.post('/analyze-xray', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data?.report) {
        setReportText(res.data.report);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to generate AI report. Ensure the file is a valid image or DICOM.");
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
    "test_name": "Diagnostic Scan",
    "value": "WARNING",
    "unit": "",
    "reference": "",
    "flag": "warning", 
    "impression": "Findings indicate...",
    "patient_solution": "Patient guide...",
    "treatment_suggestion": "Treatment suggestions..."
  }
]
IMPORTANT: "flag" MUST be one of: "low", "normal", "high", "critical", "warning".
`;
      const finalPrompt = customPrompt ? strictJSONPrompt + "\nUser Instructions: " + customPrompt : strictJSONPrompt;
      const res = await AxiosInstance.post(`/scan-prescription/${id}/generate-ai-report`, {
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
      message.error("Failed to generate AI report.");
    } finally {
      setIsGeneratingAI(prev => ({ ...prev, [id]: false }));
    }
  }

  const handleCompleteReport = async (e) => {
    e.preventDefault();
    if (!reportText.trim() && reportFiles.length === 0) {
      message.warning("Please enter the diagnostic findings or attach a report document.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("status", "Completed");
      payload.append("finalReportNotes", reportText);
      if (reportFiles.length > 0) {
        reportFiles.forEach(file => {
          payload.append("scanReportFiles", file);
        });
      }

      await AxiosInstance.put(`/scan-prescription/${selectedScanId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      message.success("Final Report Submitted & Scan Completed!");
      setIsReportModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Failed to submit report.");
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

  const filteredAppts = pendingScans.filter(a => a.status === activeTab);

  return (
    <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px] transition-all duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">
            Scanner <span className="text-blue-500">Operation Room</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] mt-2">
            Today's Scanner Roster & Missing Pipeline
          </p>
        </div>
      </div>

      {/* Row 1: Doctor-like Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Today's Appointments" subValue={metrics.todayTotal} total={9} icon="solar:clipboard-list-bold-duotone" color="bg-blue-500" bgGradient="from-blue-500/10 to-indigo-500/10" iconBg="bg-blue-500/10" iconColor="text-blue-600" />
        <StatCard title="Morning (M)" subValue={metrics.morning} total={2} icon="solar:sun-2-bold-duotone" color="bg-amber-500" bgGradient="from-amber-500/10 to-orange-500/10" iconBg="bg-amber-500/10" iconColor="text-amber-600" />
        <StatCard title="Afternoon (A)" subValue={metrics.afternoon} total={3} icon="solar:clouds-bold-duotone" color="bg-sky-500" bgGradient="from-sky-500/10 to-cyan-500/10" iconBg="bg-sky-500/10" iconColor="text-sky-600" />
        <StatCard title="Evening (E)" subValue={metrics.evening} total={4} icon="solar:moon-bold-duotone" color="bg-indigo-500" bgGradient="from-indigo-500/10 to-violet-500/10" iconBg="bg-indigo-500/10" iconColor="text-indigo-600" />
      </div>

      {/* Main Workspace Table */}
      <div className="flex flex-col">
        {/* Modern Tab Selector */}
        <div className="flex items-center p-2 bg-slate-50/50 border-b border-slate-200 overflow-x-auto shadow-inner w-full hide-scrollbar">
          {["Scheduled", "Not Scheduled", "Missing", "Report Not Ready", "Completed"].map(tab => {
            const count = pendingScans.filter(a => a.status === tab).length;
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
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-nowrap">Scan Type</th>
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
                  <td className="px-6 py-4 font-black text-blue-600 tracking-tight text-sm">{row.scanType}</td>
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
                          {(row.finalReportFileUrls && row.finalReportFileUrls.length > 0 ? row.finalReportFileUrls : (row.finalReportFileUrl ? [row.finalReportFileUrl] : [])).map((fileUrl, index) => {
                            const formattedPath = fileUrl.replace(/^\/upload\//, '/uploads/');
                            const url = formattedPath.startsWith('http') ? formattedPath : `${AxiosInstance.defaults.baseURL}${formattedPath}`;
                            return (
                              <button key={index} onClick={() => setPreviewUrl(url)} className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider" title={`View Uploaded Document ${index + 1}`}>
                                <Icon icon="solar:document-bold-duotone" className="text-sm" /> View Doc {index > 0 ? index + 1 : ''}
                              </button>
                            );
                          })}
                           {row.finalReportNotes ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedReportNotes(row.finalReportNotes)} className="flex items-center gap-2 px-3 h-8 justify-center rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-wider" title="View AI Generated Report">
                                <Icon icon="solar:magic-stick-3-bold-duotone" className="text-sm" /> AI Report
                              </button>
                              <button onClick={() => openReportModal(row)} className="flex items-center justify-center gap-1 w-8 h-8 rounded-lg text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:scale-110 transition-all" title="Edit Report">
                                <Icon icon="solar:pen-bold-duotone" />
                              </button>
                            </div>
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
            <form onSubmit={handleCompleteReport} className="p-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 relative">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Attach Final Report Document</label>
                  <label className="flex items-center gap-3 w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl px-5 py-4 cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Icon icon="solar:document-medicine-bold-duotone" className="text-xl" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-black text-slate-700">{reportFiles.length > 0 ? reportFiles.map(f => f.name).join(", ") : "Choose file(s)..."}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-nowrap truncate">{reportFiles.length > 0 ? `${(reportFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total` : "PDF, DOCX, ZIP, or Image files supported"}</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple
                      disabled={isSubmitting || isAnalyzing}
                      onChange={(e) => setReportFiles(Array.from(e.target.files))}
                    />
                  </label>

                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Additional Instructions for AI (Optional)</label>
                    <textarea 
                      rows={2}
                      disabled={isSubmitting || isAnalyzing}
                      className="w-full bg-slate-50 border border-slate-200 outline-hidden px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 shadow-inner focus:border-blue-300 transition-all placeholder:font-medium placeholder:text-slate-300 resize-none"
                      placeholder="e.g., Focus on fractures, compare with previous scan, etc."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>

                  {(reportFiles.length > 0 || (selectedScan && selectedScan.finalReportFileUrl)) && (
                    <button
                      type="button"
                      disabled={isAnalyzing || isSubmitting || (isGeneratingAI[selectedScanId])}
                      onClick={() => {
                        if (reportFiles.length > 0) handleAIGenerate();
                        else handleGenerateAIReport(selectedScanId);
                      }}
                      className={`mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${(isAnalyzing || isGeneratingAI[selectedScanId]) ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:scale-[1.01]'}`}
                    >
                      {(isAnalyzing || isGeneratingAI[selectedScanId]) ? (
                        <>
                          <Icon icon="line-md:loading-twotone-loop" className="text-lg" />
                          AI is Analyzing Scan...
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:magic-stick-3-bold-duotone" className="text-lg" />
                          Generate AI Diagnostic Draft
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Diagnostic Findings & Notes</label>
                  <textarea 
                    rows={8}
                    disabled={isSubmitting || isAnalyzing}
                    className="w-full bg-slate-50 border border-slate-200 outline-hidden px-5 py-4 rounded-xl text-sm font-semibold text-slate-700 shadow-inner focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:font-medium placeholder:text-slate-300 resize-none"
                    placeholder={isAnalyzing ? "AI is generating report..." : "Type the final scan findings, medical observations, or radiology report here..."}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" disabled={isSubmitting} onClick={() => setIsReportModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all hover:scale-105 uppercase tracking-widest disabled:opacity-50">
                  {isSubmitting ? "Uploading..." : "Complete Scan"} <Icon icon="solar:verified-check-bold-duotone" className="text-lg" />
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
                <h2 className="text-xl font-black text-slate-800 tracking-tight">AI Generated <span className="text-emerald-600">Report</span></h2>
              </div>
              <button onClick={() => setSelectedReportNotes(null)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                <Icon icon="solar:close-circle-bold-duotone" className="text-2xl" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">
              {(() => {
                let parsedData = null;
                try {
                  let cleanString = selectedReportNotes.trim();
                  if (cleanString.startsWith('\`\`\`json')) {
                    cleanString = cleanString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                  }
                  parsedData = JSON.parse(cleanString);
                } catch (e) {
                  parsedData = null;
                }

                if (parsedData && Array.isArray(parsedData)) {
                  const mappedItems = parsedData.map(item => ({
                    title: item.test_name || "Diagnostic Scan",
                    value: item.flag?.toUpperCase() || "NORMAL",
                    unit: "",
                    reference: item.reference || "",
                    impression: item.impression || "",
                    flag: item.flag || "normal",
                    patient_solution: item.patient_solution || "",
                    treatment_suggestion: item.treatment_suggestion || "",
                    type: "scan"
                  }));
                  return (
                    <AIGaugeReport 
                      items={mappedItems} 
                      color="emerald" 
                      icon="solar:scanner-bold-duotone" 
                    />
                  );
                }

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
                  <span>Medical Disclaimer</span>
                </div>
                <p className="text-[11px] text-amber-600 leading-tight">
                  This report is AI-generated for informational purposes. It must be reviewed and validated by a licensed medical professional before making any clinical decisions.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <button onClick={() => setSelectedReportNotes(null)} className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-black hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 uppercase tracking-widest">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Schedule Confirmation Modal */}
      {schedulingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300">
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
                  setScheduleDate(getDefaultDateTime());
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

      {/* File Viewer Modal wrapper */}
      {previewUrl && (
        <FileViewerModal fileUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

    </div>
  );
}

export default AppointmentForTheScan;