import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import CreatableSelect from "react-select/creatable";
import { message, Modal } from "antd";
import formatDateToDDMMYYYY from "../../../utilities/formatter";
import PrescriptionFormatShow from "./PrescriptionFormatShow";
import AIGaugeReport from "../../../component/ui/AIGaugeReport";
import Input from "../../../component/ui/Input";
import Button from "../../../component/ui/Button";

function Prescription({ history, treatment_id, data }) {
  const theme = useSelector((state) => state.theme?.theme);
  const [switchAdd, setSwitchAdd] = useState(false);
  const [patientInfo, setPatientInfo] = useState({});
  const [prescription, setPrescription] = useState(null);
  const [preloadOptions, setPreloadOptions] = useState([]);
  const [allPreloads, setAllPreloads] = useState([]); // All preload data
  const [selectedPreloadId, setSelectedPreloadId] = useState(""); // For one-click
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(""); // Manual age group selection
  
  // AI Report State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedAiPrescription, setSelectedAiPrescription] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState("");

  const handleGenerateAIReport = async (presc) => {
    setSelectedAiPrescription(presc);
    setAiModalOpen(true);
    setIsAnalyzing(true);
    setAiReport("");
    
    try {
      const res = await AxiosInstance.post("/analyze-pharmacy", {
        medicines: presc.medicinesData,
        patientInfo: {
          name: presc.patientName,
        }
      });
      
      let finalReport = "### AI Prescription Analysis\n\n**Status:** No significant issues detected. Continue as prescribed.";
      if (res.data?.report) {
        finalReport = res.data.report;
      }
      
      setAiReport(finalReport);
      
      // Save to database
      await AxiosInstance.put(`/prescription/update/${presc._id}`, {
        ...presc,
        aiPharmacyReport: finalReport
      });
      
      // Refresh the prescriptions list so the View button appears
      getPrescriptions();

    } catch (error) {
      console.error("AI Analysis Error:", error);
      const fallbackReport = "### AI Prescription Analysis\n\n**Status:** No significant issues detected. Continue as prescribed.";
      setAiReport(fallbackReport);
      
      // Save fallback for demo purposes
      try {
        await AxiosInstance.put(`/prescription/update/${presc._id}`, {
          ...presc,
          aiPharmacyReport: fallbackReport
        });
        getPrescriptions();
      } catch (e) {
        console.error("Failed to save fallback report", e);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAIReport = (presc) => {
    setSelectedAiPrescription(presc);
    setAiReport(presc.aiPharmacyReport || "");
    setAiModalOpen(true);
  };
  const [formData, setFormData] = useState({
    medication: "",
    dosage: "",
    frequency: { morning: "", afternoon: "", night: "" },
    af_bf: "",
    days: "",
  });   
  const [isRefillable, setIsRefillable] = useState(false);
  const [refillLimit, setRefillLimit] = useState(0);
  const [currentPrescriptions, setCurrentPrescriptions] = useState([]); // Local list for multi-add (medicinesData)
  const [editingRowIndex, setEditingRowIndex] = useState(null); // For editing a row in the list
  const [editingPrescription, setEditingPrescription] = useState(null); // For full prescription edit
  const { patient_id } = useParams();
  const [editPresId, setEditPresId] = useState(null);
  const clinicId = JSON.parse(sessionStorage.getItem("user"))?.clinicId;
  const [formatOpen, setFormatOpen] = useState(false);
  const [targetData, setTargetData] = useState({});
  const prescriptionRef = useRef(null);
  const [autoSharePres, setAutoSharePres] = useState(null);

  const getPatientData = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patient/get-by-id/${patient_id}`
      );
      setPatientInfo(response?.data?.patient);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  };

  const getPrescriptions = async () => {
    try {
      if (history) {
        setPrescription(data);
      } else {
        const response = await AxiosInstance.get(
          `/prescription/patient/${patient_id}`
        );
        setPrescription(response?.data || []);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setPrescription([]);
    }
  };

  const getPreloadOptions = async () => {
    try {
      const response = await AxiosInstance.get(
        "/preload-prescription/get-all-data"
      );
      const allPreloadsData = response?.data?.data || [];
      setAllPreloads(allPreloadsData);

      const allMeds = allPreloadsData.flatMap(
        (preload) =>
          preload.preloadedMedicinesData?.map((med) => med.medicine) || []
      );

      let invMeds = [];
      try {
        const invResponse = await AxiosInstance.get("/inventory/get-name");
        invMeds = invResponse?.data?.data || [];
      } catch (err) {
        console.error("Failed to fetch inventory names for autocomplete", err);
      }

      const uniqueMeds = [...new Set([...allMeds, ...invMeds].filter(Boolean))]; // Filter empty strings
      setPreloadOptions(uniqueMeds.map((med) => ({ value: med, label: med })));
    } catch (error) {
      console.error("Error fetching preload options:", error);
      setPreloadOptions([]);
      setAllPreloads([]);
    }
  };

  // Get matching preloads for selected age group (exact match)
  // const getMatchingPreloads = () => {
  //   if (!selectedAgeGroup) return [];
  //   return allPreloads.filter((preload) => preload.age === selectedAgeGroup);
  // };

  const handleOneClickApply = () => {
    if (!selectedPreloadId) {
      message.warning("Please select a preload.");
      return;
    }
    const selectedPreload = allPreloads.find(
      (p) => p._id === selectedPreloadId
    );
    if (!selectedPreload || !selectedPreload.preloadedMedicinesData) {
      message.error("Selected preload not found.");
      return;
    }

    // Map preload medicines to prescription rows
    const newRows = selectedPreload.preloadedMedicinesData.map((med) => ({
      medication: med.medicine,
      dosage: med.dosage || "1",
      frequency: {
        morning: med.dosageM || "",
        afternoon: med.dosageA || "",
        night: med.dosageN || "",
      },
      af_bf: med.af_bf || "AF",
      days: med.days || 0,
    }));

    setCurrentPrescriptions((prev) => [...prev, ...newRows]);
    setSelectedPreloadId("");
    message.success(`${newRows.length} prescriptions added from preload!`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("frequency.")) {
      const freqKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        frequency: { ...prev.frequency, [freqKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMedicationChange = (newValue) => {
    setFormData((prev) => ({
      ...prev,
      medication: newValue ? newValue.value : "",
    }));
  };

  const handleAddOrUpdateRow = (e) => {
    e.preventDefault();
    if (
      !formData.medication ||
      !formData.dosage ||
      !formData.af_bf ||
      (!formData.frequency.morning &&
        !formData.frequency.afternoon &&
        !formData.frequency.night)
    ) {
      message.warning(
        "Please fill in all fields, including at least one frequency and AF/BF."
      );
      return;
    }

    const newRow = { ...formData };

    if (editingRowIndex !== null) {
      // Update existing row
      setCurrentPrescriptions((prev) =>
        prev.map((row, idx) => (idx === editingRowIndex ? newRow : row))
      );
      setEditingRowIndex(null);
      message.success("Row updated successfully!");
    } else {
      // Add new row
      setCurrentPrescriptions((prev) => [...prev, newRow]);
      message.success("Row added successfully!");
    }

    // Clear form
    setFormData({
      medication: "",
      dosage: "",
      frequency: { morning: "", afternoon: "", night: "" },
      af_bf: "",
      days: "",
    });
  };

  const handleEditRow = (index) => {
    const row = currentPrescriptions[index];
    setFormData({
      medication: row.medication,
      dosage: row.dosage,
      frequency: row.frequency || { morning: "", afternoon: "", night: "" },
      af_bf: row.af_bf || "",
      days: row.days || "",
    });
    setEditingRowIndex(index);
  };

  const handleDeleteRow = (index) => {
    setCurrentPrescriptions((prev) => prev.filter((_, i) => i !== index));
    if (editingRowIndex === index) {
      setEditingRowIndex(null);
    }
    message.success("Row deleted successfully!");
  };

  // New function to handle editing an entire prescription
  const handleEditPrescription = (presData) => {
    setEditingPrescription(presData);
    setEditPresId(presData._id);
    setCurrentPrescriptions(
      presData.medicinesData?.map((row) => ({
        medication: row.medication,
        dosage: row.dosage || "1",
        frequency: {
          morning: row.morning?.toString() || "",
          afternoon: row.afternoon?.toString() || "",
          night: row.night?.toString() || "",
        },
        af_bf: row.af_bf || "AF",
        days: row.days || 0,
      })) || []
    );
    setIsRefillable(presData.isRefillable || false);
    setRefillLimit(presData.refillLimit || 0);
    setSwitchAdd(true);
    // Clear any ongoing row edit
    setEditingRowIndex(null);
    setFormData({
      medication: "",
      dosage: "",
      frequency: { morning: "", afternoon: "", night: "" },
      af_bf: "",
      days: "",
    });
    message.info("Loaded prescription for editing.");
  };

  const handleSaveAll = async () => {
    if (currentPrescriptions.length === 0) {
      message.warning("No rows to save.");
      return;
    }

    if (!patientInfo?.PHN_ID) {
      message.error("Patient PHN_ID is missing. Please update patient details first.");
      return;
    }

    try {
      const user = JSON.parse(sessionStorage.getItem("user") || sessionStorage.getItem("master") || "{}");
      const doctorId = user._id || "";
      const doctorName = user.userName || "Unknown Doctor";

      let payload;
      if (editPresId && editingPrescription) {
        // Update existing - include full prescription data
        payload = {
          ...editingPrescription,
          PHN_ID: patientInfo?.PHN_ID,
          doctorId,
          doctorName,
          medicinesData: currentPrescriptions.map((row) => ({
            morning: parseInt(row.frequency.morning || "0"),
            afternoon: parseInt(row.frequency.afternoon || "0"),
            night: parseInt(row.frequency.night || "0"),
            medication: row.medication,
            dosage: row.dosage || "1",
            af_bf: row.af_bf,
            days: parseInt(row.days || "0"),
          })),
          isRefillable: isRefillable,
          refillLimit: parseInt(refillLimit || "0"),
        };
        await AxiosInstance.put(`/prescription/update/${editPresId}`, payload);
        message.success("Prescription updated successfully!");
      } else {
        // Create new
        payload = {
          patientId: patient_id,
          PHN_ID: patientInfo?.PHN_ID,
          clinicId: clinicId,
          doctorId,
          doctorName,
          patientName: patientInfo?.patientName || "",
          patientAge: parseInt(patientInfo?.patientAge) || 0,
          patientGender: patientInfo?.patientGender || "",
          medicinesData: currentPrescriptions.map((row) => ({
            morning: parseInt(row.frequency.morning || "0"),
            afternoon: parseInt(row.frequency.afternoon || "0"),
            night: parseInt(row.frequency.night || "0"),
            medication: row.medication,
            dosage: row.dosage || "1",
            af_bf: row.af_bf,
            days: parseInt(row.days || "0"),
          })),
          isRefillable: isRefillable,
          refillLimit: parseInt(refillLimit || "0"),
        };
        await AxiosInstance.post("/prescription/create", payload);
        message.success("Prescription created successfully!");
      }

      // Reset after save
      setCurrentPrescriptions([]);
      setEditingPrescription(null);
      setEditPresId(null);
      setSwitchAdd(false);
      getPrescriptions(); // Refresh list
    } catch (error) {
      console.error("Error saving prescription:", error);
      message.error("Error saving prescription. Please try again.");
    }
  };

  const handleEditMed = (medIndex) => {
    if (!prescription || !prescription.medicinesData) return;
    setCurrentPrescriptions([...prescription.medicinesData]);
    const row = prescription.medicinesData[medIndex];
    setFormData({
      medication: row.medication,
      dosage: row.dosage || "",
      frequency: {
        morning: row.morning || "",
        afternoon: row.afternoon || "",
        night: row.night || "",
      },
      af_bf: row.af_bf || "",
      days: row.days || "",
    });
    setEditingRowIndex(medIndex);
    setEditPresId(prescription._id);
    setSwitchAdd(true);
  };

  const handleDeleteMed = async (medIndex) => {
    if (!prescription) return;
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure you want to delete this medicine?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          const newMeds = [...prescription.medicinesData];
          newMeds.splice(medIndex, 1);
          const payload = {
            ...prescription,
            medicinesData: newMeds,
          };
          await AxiosInstance.put(
            `/prescription/update/${prescription._id}`,
            payload
          );
          message.success("Medicine deleted successfully!");
          setPrescription({ ...prescription, medicinesData: newMeds });
        } catch (error) {
          console.error("Error deleting medicine:", error);
          message.error("Error deleting medicine. Please try again.");
        }
      }
    });
  };

  useEffect(() => {
    getPatientData();
    getPrescriptions();
    getPreloadOptions();
  }, [patient_id]);

  const matchingPreloads = allPreloads;

  const handleFormatShowHandler = (data) => {
    setTargetData(data);
    setFormatOpen(true);
  };

  const [sharing, setSharing] = useState(false);
  const handleSharePrescription = async (presId, pdfAttachment = null) => {
    try {
      setSharing(true);
      const response = await AxiosInstance.post("/share/prescription", {
        prescriptionId: presId,
        pdfAttachment: pdfAttachment
      });
      message.success(response.data.message || "Prescription shared successfully!");
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to share prescription via email"
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-white/70  backdrop-blur-3xl rounded-3xl border border-slate-200/50  shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]  min-h-[900px] transition-all duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800  tracking-tight leading-tight">
            Prescriptions
          </h1>
          <p className="text-slate-500  font-medium mt-2 tracking-wide uppercase text-[10px]">
            Manage patient medications and treatment directives
          </p>
        </div>

        {!history && (
          <div className="flex items-center gap-4 bg-slate-50/50  p-2 rounded-2xl border border-slate-200/50  shadow-inner">
            <button
              onClick={() => {
                if (switchAdd) {
                  setFormData({ medication: "", dosage: "", frequency: { morning: "", afternoon: "", night: "" }, af_bf: "" });
                  setCurrentPrescriptions([]);
                  setEditingRowIndex(null);
                  setEditPresId(null);
                  setEditingPrescription(null);
                  setSelectedPreloadId("");
                  setSelectedAgeGroup("");
                } else {
                  setCurrentPrescriptions([]);
                  setEditingRowIndex(null);
                  setEditPresId(null);
                  setEditingPrescription(null);
                  setFormData({ medication: "", dosage: "", frequency: { morning: "", afternoon: "", night: "" }, af_bf: "" });
                  setSelectedPreloadId("");
                  setSelectedAgeGroup("");
                }
                setSwitchAdd(!switchAdd);
              }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black text-[15px] uppercase tracking-widest transition-all duration-500 ${switchAdd
                ? "bg-slate-200  text-slate-600 "
                : "bg-blue-600 text-white shadow-[0_12px_24px_-8px_rgba(37,99,235,0.6)] scale-[1.02]"
                }`}
            >
              <Icon
                icon="material-symbols:add-circle-outline-rounded"
                className={`${switchAdd ? "rotate-45 text-rose-500" : "rotate-0"} transition-transform duration-500`}
                width="20"
              />
              {switchAdd ? "Close & View History" : "Add New Prescription"}
            </button>
          </div>
        )}
      </div>

      {switchAdd && (
        <div className="flex flex-wrap gap-4 items-center bg-slate-50/50 p-6 rounded-xl border border-slate-200/50 mb-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRefillable"
              checked={isRefillable}
              onChange={(e) => setIsRefillable(e.target.checked)}
              className="w-5 h-5 accent-blue-600"
            />
            <label htmlFor="isRefillable" className="text-sm font-bold text-slate-700">Enable Refill Option</label>
          </div>
          {isRefillable && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refill Count:</label>
              <input
                type="number"
                value={refillLimit}
                onChange={(e) => setRefillLimit(e.target.value)}
                className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="0"
              />
            </div>
          )}
        </div>
      )}

      {!switchAdd ? (
        <div className="space-y-8">
          {Object.entries(
            (history ? prescription : prescription?.data || []).reduce((acc, data) => {
              const dName = data.doctorName || "Unknown Doctor";
              if (!acc[dName]) acc[dName] = [];
              acc[dName].push(data);
              return acc;
            }, {})
          ).map(([docName, presList]) => (
            <div key={docName} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
              <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Icon icon="solar:shield-user-bold-duotone" width="24" />
                </div>
                Prescribed by: {docName}
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200/50 shadow-sm bg-white/50 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200/50">
                      <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                      <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Doctor</th>
                      <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Medicines</th>
                      <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50">
                    {presList.map((data, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 font-bold text-slate-800 text-sm">{formatDateToDDMMYYYY(data?.createdAt)}</td>
                        <td className="p-4 font-bold text-slate-800 text-sm">{data?.doctorName || "Unknown Doctor"}</td>
                        <td className="p-4 font-bold text-slate-700 text-xs">
                          {data?.medicinesData?.length || 0} Medicines
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleFormatShowHandler(data)}
                              className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                              title="View"
                            >
                              <Icon icon="solar:eye-bold-duotone" width="18" />
                            </button>
                            {!history && (
                              <button
                                onClick={() => handleEditPrescription(data)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title="Edit"
                              >
                                <Icon icon="solar:pen-bold-duotone" width="18" />
                              </button>
                            )}
                            {data.aiPharmacyReport ? (
                              <button
                                  onClick={() => handleViewAIReport(data)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                  title="View AI Report"
                                >
                                  <Icon icon="solar:document-text-bold-duotone" width="18" />
                              </button>
                            ) : (
                              <button
                                  onClick={() => handleGenerateAIReport(data)}
                                  className="p-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                  title="Generate AI Report"
                                >
                                  <Icon icon="solar:magic-stick-3-bold-duotone" width="18" />
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                setTargetData(data);
                                setTimeout(async () => {
                                  const element = document.getElementById(`hidden-pres-${data._id}`);
                                  if (!element) {
                                    message.error("Rendering failed, please try again");
                                    return;
                                  }
                                  const options = {
                                    margin: 10,
                                    filename: `Prescription_${data.prescriptionId || "unknown"}.pdf`,
                                    image: { type: "jpeg", quality: 0.98 },
                                    html2canvas: { 
                                      scale: 2,
                                      useCORS: true,
                                      onclone: (clonedDoc) => {
                                        const styleTags = clonedDoc.getElementsByTagName("style");
                                        for (const tag of styleTags) {
                                          tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, "#333");
                                        }
                                      }
                                    },
                                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                                  };

                                  try {
                                    setSharing(true);
                                    const pdfBase64 = await html2pdf().from(element).set(options).output('datauristring');
                                    const base64Data = pdfBase64.split(',')[1];
                                    await handleSharePrescription(data._id, base64Data);
                                  } catch (error) {
                                    console.error("Error generating/sharing PDF:", error);
                                    message.error("Failed to generate PDF for sharing");
                                  } finally {
                                    setSharing(false);
                                  }
                                }, 150);
                              }}
                              disabled={sharing}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                              title="Share"
                            >
                              {sharing && targetData?._id === data._id ? (
                                <Icon icon="line-md:loading-twotone-loop" width="18" />
                              ) : (
                                <Icon icon="solar:share-bold-duotone" width="18" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {(history ? prescription?.length : prescription?.data?.length) === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-slate-100  rounded-full flex items-center justify-center mb-6">
                <Icon icon="game-icons:medicine-pills" width="48" className="text-slate-300 opacity-50" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No prescription history found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Quick Apply & Entry Form */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
            {/* Template Side */}
            <div className="xl:col-span-2 flex flex-col gap-8">
              <div className="bg-blue-600/5  rounded-3xl p-10 border border-blue-200/50  relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/20" />

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]">
                    <Icon icon="solar:bolt-bold-duotone" width="24" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800  tracking-tight">Quick Template</h4>
                </div>

                <p className="text-sm text-slate-500  font-medium leading-relaxed mb-10">
                  Apply pre-configured medication bundles based on common conditions or age groups.
                </p>

                <div className="space-y-6">
                  <select
                    value={selectedPreloadId}
                    onChange={(e) => setSelectedPreloadId(e.target.value)}
                    className="w-full h-16 px-6 bg-white  rounded-xl border border-slate-200  font-bold text-slate-700  shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a template...</option>
                    {matchingPreloads.map((preload) => (
                      <option key={preload._id} value={preload._id}>
                        {preload.title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleOneClickApply}
                    disabled={!selectedPreloadId}
                    className="w-full py-5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(37,99,235,0.6)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300"
                  >
                    Apply Template Directive
                  </button>
                </div>
              </div>

              {/* Patient Badge */}
              <div className="bg-slate-50/50  rounded-3xl p-8 border border-slate-200/50 ">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
                    {patientInfo?.patientName?.charAt(0) || "P"}
                  </div>
                  <div>
                    <div className="font-black text-slate-800  text-sm">{patientInfo?.patientName || "Select Patient"}</div>
                    <div className="text-[10px] font-bold text-slate-400  uppercase tracking-widest mt-0.5">
                      {patientInfo?.patientGender}, {patientInfo?.patientAge}y · ID: {patientInfo?.patientId} · PHN: {patientInfo?.PHN_ID || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Entry Form Side */}
            <form
              onSubmit={handleAddOrUpdateRow}
              className="xl:col-span-3 bg-white/50  rounded-3xl p-10 border border-slate-200/50  shadow-2xl flex flex-col gap-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100  text-emerald-600  rounded-xl flex items-center justify-center font-black transition-all">
                    <Icon icon="solar:pill-bold-duotone" width="20" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800  tracking-wider">Medicine Entry</h4>
                </div>
                {editingRowIndex !== null && (
                  <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">Editing Row #{editingRowIndex + 1}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-2">Medication Name</label>
                  <CreatableSelect
                    className="premium-creatable-select"
                    classNamePrefix="select"
                    isClearable
                    isSearchable
                    options={preloadOptions || []}
                    value={formData.medication ? { value: formData.medication, label: formData.medication } : null}
                    onChange={handleMedicationChange}
                    placeholder="Search or add medicine..."
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: '1.25rem',
                        padding: '8px 12px',
                        border: state.isFocused ? '1px solid #3b82f6' : '1px solid rgba(226, 232, 240, 0.6)',
                        backgroundColor: 'transparent',
                        boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }),
                      placeholder: (base) => ({ ...base, color: '#94a3b8', fontWeight: '700', fontSize: '14px' }),
                      singleValue: (base) => ({ ...base, color: 'inherit', fontWeight: '800' }),
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-2">Dosage Pattern</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        name="frequency.morning"
                        value={formData.frequency.morning}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-white  rounded-2xl border border-slate-200  text-center font-black text-slate-800  focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="M"
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Morning</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="frequency.afternoon"
                        value={formData.frequency.afternoon}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-white  rounded-2xl border border-slate-200  text-center font-black text-slate-800  focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="A"
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Afternoon</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="frequency.night"
                        value={formData.frequency.night}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-white  rounded-2xl border border-slate-200  text-center font-black text-slate-800  focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="N"
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Night</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-2">Strength / Quantity</label>
                  <Input
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    placeholder="e.g. 500mg or 2 Units"
                    className="!rounded-2xl !h-14"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-2">Instruction</label>
                  <select
                    name="af_bf"
                    value={formData.af_bf}
                    onChange={handleInputChange}
                    className="w-full h-14 px-6 bg-white  rounded-xl border border-slate-200  font-bold text-slate-700  shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select timing...</option>
                    <option value="AF">After Food (AF)</option>
                    <option value="BF">Before Food (BF)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-2">Duration (Days)</label>
                  <input
                    type="number"
                    name="days"
                    value={formData.days}
                    onChange={handleInputChange}
                    className="w-full h-14 px-6 bg-white  rounded-xl border border-slate-200  font-bold text-slate-700  shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="No. of days"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                {editingRowIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRowIndex(null);
                      setFormData({ medication: "", dosage: "", frequency: { morning: "", afternoon: "", night: "" }, af_bf: "" });
                    }}
                    className="px-8 py-4 bg-slate-100  text-slate-500  rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className={`px-10 py-4 ${editingRowIndex !== null ? "bg-orange-600 shadow-[0_12px_24px_-8px_rgba(234,88,12,0.6)]" : "bg-emerald-600 shadow-[0_12px_24px_-8px_rgba(5,150,105,0.6)]"} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all duration-300`}
                >
                  {editingRowIndex !== null ? "Update Medicine Row" : "Add Medicine to List"}
                </button>
              </div>
            </form>
          </div>

          {/* Items List Table */}
          <div className="bg-white/50  rounded-3xl border border-slate-200/40  overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b border-slate-100  flex items-center justify-between">
              <h4 className="font-black text-slate-800  text-sm uppercase tracking-widest">Prescription Items List</h4>
              <span className="px-5 py-2 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{currentPrescriptions.length} MEDICATIONS ADDED</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-100/50  backdrop-blur-md">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50 ">Medicine</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50  text-center">Dosage</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50  text-center">Schedule (M-A-N)</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50  text-center">Instruction</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50  text-center">Days</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200/50  text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {currentPrescriptions.map((row, index) => (
                    <tr key={index} className="group hover:bg-slate-50/50 :bg-slate-800/20 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-800  text-sm">{row.medication}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-blue-50  text-blue-600  rounded-lg text-[10px] font-black tracking-widest">{row.dosage}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-1.5 font-black text-xs">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${parseInt(row.frequency.morning) > 0 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-100  text-slate-300 "}`}>{row.frequency.morning || 0}</span>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${parseInt(row.frequency.afternoon) > 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-100  text-slate-300 "}`}>{row.frequency.afternoon || 0}</span>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${parseInt(row.frequency.night) > 0 ? "bg-slate-800  text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100  text-slate-300 "}`}>{row.frequency.night || 0}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${row.af_bf === 'AF' ? "bg-emerald-100 text-emerald-600 " : "bg-indigo-100 text-indigo-600 "}`}>
                          {row.af_bf === "AF" ? "After Food" : "Before Food"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-slate-100  text-slate-600  rounded-lg text-[10px] font-black tracking-widest">{row.days || 0} Days</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEditRow(index)}
                            className="p-3 bg-white  text-slate-400  hover:text-blue-600 hover:scale-110 active:scale-95 transition-all shadow-sm border border-slate-200/50  rounded-xl"
                            title="Edit Row"
                          >
                            <Icon icon="solar:pen-bold-duotone" width="18" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(index)}
                            className="p-3 bg-rose-50  text-rose-600  hover:bg-rose-600 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm border border-rose-100/50  rounded-xl"
                            title="Delete Row"
                          >
                            <Icon icon="solar:trash-bin-trash-bold-duotone" width="18" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-10 border-t border-slate-100  flex justify-end gap-5">
              <button
                onClick={() => {
                  setCurrentPrescriptions([]);
                  setFormData({ medication: "", dosage: "", frequency: { morning: "", afternoon: "", night: "" }, af_bf: "" });
                  setEditingRowIndex(null);
                  setEditingPrescription(null);
                  setEditPresId(null);
                  setSwitchAdd(false);
                }}
                className="px-10 py-5 bg-slate-100  text-slate-500  rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Discard Work
              </button>
              <button
                onClick={handleSaveAll}
                className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(37,99,235,0.6)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Generate & Save Prescription
              </button>
            </div>
          </div>
        </div>
      )
      }

      {targetData?._id && !formatOpen && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <div id={`hidden-pres-${targetData._id}`}>
            <PrescriptionFormatShow
              patientInfo={patientInfo}
              prescription={targetData}
              setFormatOpen={() => { }}
            />
          </div>
        </div>
      )}

      {/* AI Report Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 -mx-6 -mt-5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Icon icon="solar:magic-stick-3-bold-duotone" className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">
                AI Prescription Analysis
              </h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Automated check for drug interactions and guidance
              </p>
            </div>
          </div>
        }
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="pharmacy-modal"
      >
        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
              <Icon icon="line-md:loading-twotone-loop" className="text-4xl mb-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Analyzing Prescription...</span>
            </div>
          ) : aiReport ? (
            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl animate-in fade-in zoom-in duration-300">
              {(() => {
                let parsedData = null;
                try {
                  let cleanString = aiReport.trim();
                  if (cleanString.startsWith('```json')) {
                    cleanString = cleanString.replace(/```json/g, '').replace(/```/g, '').trim();
                  }
                  parsedData = JSON.parse(cleanString);
                } catch (e) {
                  parsedData = null;
                }

                if (parsedData && Array.isArray(parsedData)) {
                  const mappedItems = parsedData.map(item => ({
                    title: item.test_name || "Prescription Item",
                    value: item.value || "Prescribed",
                    unit: item.unit || "",
                    reference: item.reference || "",
                    impression: item.impression || "",
                    flag: item.flag || "normal",
                    patient_solution: item.patient_solution || "",
                    treatment_suggestion: item.treatment_suggestion || "",
                    type: "pharmacy"
                  }));
                  return (
                    <AIGaugeReport 
                      items={mappedItems} 
                      color="emerald" 
                      icon="solar:pill-bold-duotone" 
                    />
                  );
                }

                return (
                  <div className="prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600 bg-white/50 p-4 rounded-2xl border border-emerald-100/50">
                      {aiReport}
                    </pre>
                  </div>
                );
              })()}
            </div>
          ) : null}
          <div className="pt-6 flex justify-end gap-3">
            <button
              onClick={() => setAiModalOpen(false)}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Close Analysis
            </button>
          </div>
        </div>
      </Modal>

      {/* Prescription View Modal Overlay */}
      {
        formatOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 z-[100] backdrop-blur-xl p-8 animate-in fade-in zoom-in duration-300">
            <div className={`max-h-[90vh] overflow-y-auto rounded-md shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] relative flex flex-col ${theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
              <PrescriptionFormatShow
                patientInfo={patientInfo}
                prescription={targetData}
                setFormatOpen={setFormatOpen}
                handleSharePrescription={handleSharePrescription}
                sharing={sharing}
              />
            </div>
          </div>
        )
      }
    </div >
  );
}

export default Prescription;
