import React, { useState, useEffect } from "react";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import { message, Modal, Tag, Tooltip } from "antd";
import { TableSkeleton } from "../../../component/ui/Skeleton";
import formatDateToDDMMYYYY from "../../../utilities/formatter";
import Button from "../../../component/ui/Button";
import Inventory from "../inventory/Inventory";
import { sendTemplateWhatsApp } from "../../../component/whatsApp/sendTemplateWhatsApp";
import PharmacyAnalytics from "./PharmacyAnalytics";
import dayjs from "dayjs";
import AIGaugeReport from "../../../component/ui/AIGaugeReport";

function Pharmacy() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [inventoryList, setInventoryList] = useState([]);
  const clinicId = JSON.parse(sessionStorage.getItem("user"))?.clinicId;

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(
        `/prescription/get-for-pharmacy?clinicId=${clinicId}`,
      );
      setPrescriptions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      message.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await AxiosInstance.get("/inventory/get-all");
      setInventoryList(res.data?.product || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchInventory();
  }, [clinicId]);

  const calculateQuantity = (med) => {
    const morning = parseFloat(med.morning) || 0;
    const afternoon = parseFloat(med.afternoon) || 0;
    const night = parseFloat(med.night) || 0;
    const days = parseFloat(med.days) || 0;
    const total = (morning + afternoon + night) * days;
    return isNaN(total) ? 0 : total;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState("");

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    const dispenseData = selectedPrescription.medicinesData.map((med) => ({
      medication: med.medication,
      quantity: calculateQuantity(med),
    }));

    try {
      setIsSubmitting(true);
      await AxiosInstance.post(
        `/prescription/dispense/${selectedPrescription._id}`,
        { dispenseData, aiReport },
      );
      message.success("Prescription dispensed and stock updated!");
      setDispenseModalOpen(false);
      setAiReport("");
      fetchPrescriptions();
    } catch (error) {
      console.error("Dispensing error:", error);
      message.error(error.response?.data?.message || "Dispensing failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!selectedPrescription) return;
    setIsAnalyzing(true);
    try {
      const res = await AxiosInstance.post("/analyze-pharmacy", {
        medicines: selectedPrescription.medicinesData,
        patientInfo: {
          name: selectedPrescription.patientName,
          // age and gender are usually in the patient object if we want to fetch it
        }
      });
      if (res.data?.report) {
        setAiReport(res.data.report);
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      message.error("Failed to generate AI report");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNotifyPatient = async (p) => {
    try {
      message.loading({ content: 'Checking stock & patient details...', key: 'notify' });
      
      const patientRes = await AxiosInstance.get(`/patient/get-by-id/${p.patientId}`);
      const patient = patientRes.data?.patient;
                                                                                          
      if (!patient || !patient.patientPhone) {
        message.warning({ content: 'Patient phone number not found!', key: 'notify' });
        return;
      }

      const invRes = await AxiosInstance.get("/inventory/get-all");
      const inventoryList = invRes.data?.product || [];

      let fullyAvailable = true;
      const missingMeds = [];
      const availableMeds = [];

      for (const prescItem of p.medicinesData) {
        const requiredQty = calculateQuantity(prescItem);
        const invItem = inventoryList.find(
          (item) =>
            item.productName?.trim().toLowerCase() ===
            prescItem.medication?.trim().toLowerCase()
        );

        if (!invItem || invItem.productCurrentCount < requiredQty) {
          fullyAvailable = false;
          missingMeds.push(prescItem.medication);
        } else {
          // Use the actual name from the inventory instead of the prescription input
          availableMeds.push(invItem.productName || prescItem.medication);
        }
      }

      if (fullyAvailable) {
        await sendTemplateWhatsApp(patient.patientPhone, "pharmacy_stock_notavailable", [
          patient.patientName,
          availableMeds.join(", "),
        ]);
        message.success({ content: "Notification sent (Available)", key: "notify" });
      } else {
        const missingText =
          missingMeds.length > 0 ? missingMeds.join(", ") : "some items";
        await sendTemplateWhatsApp(patient.patientPhone, "pharmacy_stock_available", [
          patient.patientName,
          missingText,
        ]);
        message.success({ content: "Notification sent (Out of Stock)", key: "notify" });
      }
      
    } catch (error) {
      console.error(error);
      message.error({ content: 'Failed to notify patient.', key: 'notify' });
    }
  };

  const [activeSubTab, setActiveSubTab] = useState("all"); // all, delivered, out_of_stock, refills

  const getFilteredPrescriptions = () => {
    let list = prescriptions;
    
    // "Only show the future not the past" filter
    const today = dayjs().startOf('day');
    list = list.filter(p => dayjs(p.createdAt).isSame(today, 'day') || dayjs(p.createdAt).isAfter(today, 'day'));

    // Search Filter
    if (searchTerm) {
      list = list.filter(p => 
        p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sub-tab filtering
    switch (activeSubTab) {
      case "delivered":
        return list.filter(p => p.dispenseStatus === "Fully Dispensed");
      case "out_of_stock":
        return list.filter(p => {
          let isInStock = true;
          p.medicinesData?.forEach(med => {
            const req = calculateQuantity(med);
            const inv = inventoryList.find(i => i.productName?.trim().toLowerCase() === med.medication?.trim().toLowerCase());
            if (!inv || inv.productCurrentCount < req) isInStock = false;
          });
          return !isInStock;
        });
      case "refills":
        return list.filter(p => p.isRefillable && p.refillCount < p.refillLimit);
      case "all":
      default:
        return list;
    }
  };

  const filteredPrescriptions = getFilteredPrescriptions();

  const todayStr = formatDateToDDMMYYYY(new Date());
  const today = dayjs().startOf('day');

  const metrics = {
    todayTotal: prescriptions.filter(p => formatDateToDDMMYYYY(p.createdAt) === todayStr).length,
    pending: prescriptions.filter(p => formatDateToDDMMYYYY(p.createdAt) === todayStr && p.dispenseStatus !== "Fully Dispensed").length,
    delivered: prescriptions.filter(p => formatDateToDDMMYYYY(p.createdAt) === todayStr && p.dispenseStatus === "Fully Dispensed").length,
    todayRefill: prescriptions.filter(p => formatDateToDDMMYYYY(p.createdAt) === todayStr && p.isRefillable).length,
  };

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        <StaggerItem>
          <div className="flex bg-slate-50/50 p-2 border border-slate-200 shadow-inner rounded w-fit gap-2">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                activeTab === "queue" 
                  ? "bg-white shadow-sm text-blue-600 border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              <Icon icon="solar:clipboard-list-bold-duotone" width="16" />
              Queue
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                activeTab === "inventory" 
                  ? "bg-white shadow-sm text-blue-600 border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              <Icon icon="solar:box-bold-duotone" width="16" />
              Stock
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                activeTab === "analytics" 
                  ? "bg-white shadow-sm text-blue-600 border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              <Icon icon="solar:chart-square-bold-duotone" width="16" />
              Analytics
            </button>
          </div>
        </StaggerItem>

        {activeTab === "queue" ? (
          <>
            {/* Pharmacy Metrics Ribbon */}
            <StaggerItem>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {[
              { label: "Today Total", count: metrics.todayTotal, total: metrics.todayTotal, color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600", icon: "solar:clipboard-list-bold-duotone" },
              { label: "Pending", count: metrics.pending, total: metrics.todayTotal, color: "bg-amber-500", bgGradient: "from-amber-500/10 to-orange-500/10", iconBg: "bg-amber-500/10", iconColor: "text-amber-600", icon: "solar:clock-circle-bold-duotone" },
              { label: "Delivered", count: metrics.delivered, total: metrics.todayTotal, color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", icon: "solar:check-circle-bold-duotone" },
              { label: "Today Refill", count: metrics.todayRefill, total: metrics.todayTotal, color: "bg-indigo-500", bgGradient: "from-indigo-500/10 to-violet-500/10", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600", icon: "solar:refresh-bold-duotone" },
            ].map((c, i) => (
              <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}>
                 <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
                 <div className="p-5 flex items-center justify-between z-10 relative">
                   <div className="flex flex-col gap-1 flex-1 pr-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                     <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black text-slate-800">{c.count}</span>
                       <span className="text-sm font-medium text-slate-400 opacity-80">/ {c.total}</span>
                     </div>
                     <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-1 overflow-hidden shadow-inner">
                       <div className={`h-full ${c.color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`} style={{ width: `${c.total > 0 ? (c.count / c.total) * 100 : 0}%` }}></div>
                     </div>
                   </div>
                   <div className={`w-12 h-12 shrink-0 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor} group-hover:scale-110 transition-transform`}>
                     <Icon icon={c.icon} className="text-2xl" />
                   </div>
                 </div>
              </div>
            ))}
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-6">
            <div className="flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 border border-slate-200 shadow-inner rounded">
              {[
                { id: "all", label: "All Queue", icon: "solar:list-bold-duotone" },
                { id: "delivered", label: "Delivered", icon: "solar:check-circle-bold-duotone" },
                { id: "out_of_stock", label: "Out of Stock", icon: "solar:box-bold-duotone" },
                { id: "refills", label: "Refills", icon: "solar:refresh-bold-duotone" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                    activeSubTab === tab.id
                      ? "bg-white shadow-sm text-blue-600 border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                  }`}
                >
                  <Icon icon={tab.icon} width="16" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Icon
                  icon="solar:magnifer-bold-duotone"
                  width="18"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Patient Name or ID..."
                  className="h-10 w-64 pl-12 pr-4 bg-white rounded border border-slate-200 text-xs font-bold shadow-sm focus:border-blue-500 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </StaggerItem>

            <StaggerItem>
              <div className="bg-white/50 rounded border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                Prescription Queue
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full">
                {filteredPrescriptions.length} Records Found
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-100/50 backdrop-blur-md">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Patient Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Date</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Refills</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Stock</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-0">
                        <TableSkeleton rows={8} />
                      </td>
                    </tr>
                  ) : filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((p, idx) => (
                      <tr
                        key={idx}
                        className="group hover:bg-slate-50/50 transition-all duration-300"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all group-hover:scale-110 ${
                                idx % 2 === 0 ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                              }`}>
                              {(p.patientName || "P").charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm capitalize">
                                {p.patientName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                ID: {p.prescriptionId?.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-bold text-slate-600">
                            {formatDateToDDMMYYYY(p.createdAt)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              p.dispenseStatus === "Fully Dispensed"
                                ? "bg-emerald-100 text-emerald-600"
                                : p.dispenseStatus === "Partially Dispensed"
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                p.dispenseStatus === "Fully Dispensed" ? "bg-emerald-500" : p.dispenseStatus === "Partially Dispensed" ? "bg-orange-500" : "bg-blue-500"
                              }`} />
                            {p.dispenseStatus || "Pending"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {p.isRefillable ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-indigo-600 uppercase mb-1">
                                Available
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {p.refillCount} / {p.refillLimit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-center">
                          {(() => {
                            let isInStock = true;
                            p.medicinesData.forEach((med) => {
                              const req = calculateQuantity(med);
                              const inv = inventoryList.find(
                                (i) =>
                                  i.productName?.trim().toLowerCase() ===
                                  med.medication?.trim().toLowerCase()
                              );
                              if (!inv || inv.productCurrentCount < req)
                                isInStock = false;
                            });

                            return (
                              <span
                                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  isInStock
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-rose-100 text-rose-600"
                                }`}
                              >
                                {isInStock ? "In Stock" : "Limited Stock"}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleNotifyPatient(p)}
                              className="p-3 bg-white text-slate-400 hover:text-emerald-600 rounded-xl transition-all shadow-sm border border-slate-200 hover:scale-110 active:scale-95"
                              title="Notify via WhatsApp"
                            >
                              <Icon icon="solar:chat-round-line-bold-duotone" width="20" />
                            </button>
                            {p.aiPharmacyReport && (
                              <button
                                onClick={() => {
                                  setSelectedPrescription(p);
                                  setAiReport(p.aiPharmacyReport);
                                  setDispenseModalOpen(true);
                                }}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl transition-all shadow-sm border border-emerald-100 hover:scale-110 active:scale-95"
                                title="View Stored AI Report"
                              >
                                <Icon icon="solar:magic-stick-3-bold-duotone" width="20" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPrescription(p);
                                setDispenseModalOpen(true);
                                if (p.aiPharmacyReport) {
                                  setAiReport(p.aiPharmacyReport);
                                } else {
                                  setAiReport("");
                                }
                              }}
                              className={`px-6 py-2 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all border ${
                                p.dispenseStatus === "Fully Dispensed" && (!p.isRefillable || p.refillCount >= p.refillLimit)
                                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md hover:scale-105 active:scale-95"
                              }`}
                              disabled={
                                p.dispenseStatus === "Fully Dispensed" &&
                                (!p.isRefillable || p.refillCount >= p.refillLimit)
                              }
                            >
                              Dispense
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Icon
                            icon="solar:clipboard-remove-bold-duotone"
                            width="48"
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            No prescriptions found in queue
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </StaggerItem>
      </>
        ) : activeTab === "inventory" ? (
          <StaggerItem>
            <Inventory />
          </StaggerItem>
        ) : (
          <StaggerItem>
            <PharmacyAnalytics prescriptions={prescriptions} inventory={inventoryList} />
          </StaggerItem>
        )}

      <Modal
        title={
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 -mx-6 -mt-5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Icon icon="solar:pill-bold-duotone" className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">
                Dispense Medication
              </h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Calculate and deduct medication from clinical stock
              </p>
            </div>
          </div>
        }
        open={dispenseModalOpen}
        onCancel={() => setDispenseModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="pharmacy-modal"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Patient
                </div>
                <div className="text-lg font-black text-slate-800">
                  {selectedPrescription.patientName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Refill Status
                </div>
                <div className="font-bold text-blue-600">
                  {selectedPrescription.isRefillable
                    ? `Refill ${selectedPrescription.refillCount + 1} of ${selectedPrescription.refillLimit}`
                    : "Original Prescription"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Stock Calculation Summary
                </h4>
                <button
                  type="button"
                  onClick={handleGenerateAIReport}
                  disabled={isAnalyzing || isSubmitting}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    isAnalyzing 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 hover:scale-105'
                  }`}
                >
                  {isAnalyzing ? (
                    <><Icon icon="line-md:loading-twotone-loop" className="text-sm" /> Analyzing...</>
                  ) : (
                    <><Icon icon="solar:magic-stick-3-bold-duotone" className="text-sm" /> AI Summary</>
                  )}
                </button>
              </div>

              {aiReport && (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl animate-in fade-in zoom-in duration-300 no-print" data-html2canvas-ignore="true">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700">
                    <Icon icon="solar:magic-stick-3-bold-duotone" className="text-lg" />
                    <span className="text-xs font-black uppercase tracking-widest">AI Pharmacist Note</span>
                  </div>
                  {(() => {
                    let parsedData = null;
                    try {
                      let cleanString = aiReport.trim();
                      if (cleanString.startsWith('\`\`\`json')) {
                        cleanString = cleanString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
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
                        <div className="mt-4">
                          <AIGaugeReport 
                            items={mappedItems} 
                            color="emerald" 
                            icon="solar:pill-bold-duotone" 
                          />
                        </div>
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
              )}

              {selectedPrescription.medicinesData.map((med, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
                >
                  <div>
                    <div className="font-bold text-slate-800">
                      {med.medication}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {med.morning}-{med.afternoon}-{med.night} · {med.days}{" "}
                      Days
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase">
                        Qty
                      </div>
                      <div className="text-xl font-black text-blue-600 underline decoration-blue-200 underline-offset-4">
                        {calculateQuantity(med)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDispenseModalOpen(false);
                  setAiReport("");
                }}
                className="px-8 rounded-2xl h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispense}
                disabled={isSubmitting}
                className="px-12 rounded-2xl h-12 shadow-lg shadow-blue-500/25"
              >
                {isSubmitting ? "Dispensing..." : "Confirm & Dispense"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .pharmacy-modal .ant-modal-content {
          border-radius: 2.5rem;
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
        }
      `}</style>
      </div>
    </StaggerContainer>
  );
}

export default Pharmacy;
