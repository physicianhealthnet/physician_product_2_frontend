import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react/dist/iconify.js";
import BillForm from "./BillForm";
import ViewBillModal from "./ViewBillModal";
import { message } from "antd";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import formatDateToDDMMYYYY from "../../../utilities/formatter";
import Card from "../../../component/ui/Card";
import Input from "../../../component/ui/Input";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

function Bill() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const master = JSON.parse(sessionStorage.getItem("master"));

  const [allBills, setAllBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Billing");
  const [filterType, setFilterType] = useState("all"); // NEW
  const [viewBillItem, setViewBillItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // -------- Fetch Bills --------
  const handleGetBills = async () => {
    const url = user?.clinicId
      ? `/treatment-bill/get-all/${user?.clinicId}`
      : `/treatment-bill/get-all`;

    try {
      const res = await AxiosInstance.get(url);
      setAllBills(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    handleGetBills();
  }, []);

  // -------- Delete --------
  const handleDelete = async (id) => {
    try {
      await AxiosInstance.delete(`/treatment-bill/delete/${id}`);
      setAllBills((prev) => prev.filter((b) => b._id !== id));
      message.success("Deleted");
    } catch {
      message.error("Delete failed");
    }
  };

  // -------- Filtering --------
  const filteredBills = allBills.filter((bill) => {
    const text = search.toLowerCase();

    const matchesSearch =
      bill.patientName?.toLowerCase().includes(text) ||
      String(bill.patientPhone || "").includes(text) ||
      String(bill.patientId || "").includes(text);

    const matchesFilter =
      filterType === "all"
        ? true
        : filterType === "pending"
          ? Number(bill.balanceAmount) > 0
          : filterType === "paid"
            ? Number(bill.balanceAmount) === 0
            : true;

    return matchesSearch && matchesFilter;
  });

  // -------- Analytics --------
  const totalBills = filteredBills.length;

  const totalCollected = filteredBills.reduce(
    (sum, b) => sum + (Number(b.paidAmount) || 0),
    0,
  );

  const outstanding = filteredBills.reduce(
    (sum, b) => sum + (Number(b.balanceAmount) || 0),
    0,
  );

  const avgDiscount =
    totalBills > 0
      ? filteredBills.reduce((s, b) => s + (b.discount || 0), 0) / totalBills
      : 0;

  // -------- Today Logic --------
  const today = new Date().toISOString().split("T")[0];

  const todayBills = filteredBills.filter(
    (b) => b.invoiceDate?.split("T")[0] === today,
  );

  const todayCollection = todayBills.reduce(
    (sum, b) => sum + (Number(b.paidAmount) || 0),
    0,
  );

  const totalBilledAmount = filteredBills.reduce(
    (sum, b) => sum + (Number(b.paidAmount) || 0) + (Number(b.balanceAmount) || 0),
    0,
  );

  const todayTotalBilled = todayBills.reduce(
    (sum, b) => sum + (Number(b.paidAmount) || 0) + (Number(b.balanceAmount) || 0),
    0,
  );

  const fullyPaidCount = filteredBills.filter((b) => Number(b.balanceAmount) === 0).length;

  // -------- Pending --------
  const pendingBills = filteredBills.filter((b) => Number(b.balanceAmount) > 0);

  const pendingCount = pendingBills.length;

  // -------- Top Patient --------
  const topPatient = [...filteredBills].sort(
    (a, b) => (b.paidAmount || 0) - (a.paidAmount || 0),
  )[0];

  // -------- Chart --------
  const monthly = {};
  filteredBills.forEach((b) => {
    const month = b.invoiceDate
      ? new Date(b.invoiceDate).toISOString().slice(0, 7)
      : "Unknown";

    monthly[month] = (monthly[month] || 0) + (Number(b.paidAmount) || 0);
  });

  // -------- Detailed Metrics --------
  const now = dayjs();
  const startOfToday = now.startOf("day");
  const startOfWeek = now.startOf("week");
  const startOfMonth = now.startOf("month");

  const getMetricsForRange = (start, end = now) => {
    const rangeBills = allBills.filter(b => {
      const d = dayjs(b.createdAt);
      return d.isSameOrAfter(start) && d.isSameOrBefore(end) && !b.isDeleted;
    });
    const amount = rangeBills.reduce((sum, b) => sum + (Number(b.paidAmount) || 0) + (Number(b.balanceAmount) || 0), 0);
    return { count: rangeBills.length, amount };
  };

  const todayMetrics = getMetricsForRange(startOfToday);
  const weekMetrics = getMetricsForRange(startOfWeek);
  const monthMetrics = getMetricsForRange(startOfMonth);

  const chartData = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Revenue",
        data: Object.values(monthly),
        backgroundColor: "rgba(59,130,246,0.6)",
      },
    ],
  };

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* HEADER */}
        <StaggerItem>
          <div className="flex flex-col lg:flex-row justify-between rounded items-start lg:items-center gap-8">
            <div>
              <h1 className="font-black text-slate-800 text-4xl tracking-tight">
                Billing <span className="text-blue-500">Overview</span>
              </h1>
              <p className="text-slate-500 font-medium mt-2 tracking-wide uppercase text-[10px]">
                Manage patient billing and payments
              </p>
            </div>
            <div className="flex gap-3 bg-slate-50/50 p-2 border border-slate-200 shadow-inner rounded w-fit">
              {["Billing", "Analytics", "Reports"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-white shadow-sm text-slate-800 border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </StaggerItem>

        {activeTab === "Billing" && (
          <>
            {/* STAT CARDS */}
            <StaggerItem>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { label: "Today's Billing", count: todayMetrics.amount, total: todayMetrics.count, isCurrency: true, isCustomTotal: true, color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600", icon: "solar:calendar-date-bold-duotone" },
                  { label: "This Week", count: weekMetrics.amount, total: weekMetrics.count, isCurrency: true, isCustomTotal: true, color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", icon: "solar:calendar-minimalistic-bold-duotone" },
                  { label: "This Month", count: monthMetrics.amount, total: monthMetrics.count, isCurrency: true, isCustomTotal: true, color: "bg-purple-500", bgGradient: "from-purple-500/10 to-fuchsia-500/10", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", icon: "solar:calendar-mark-bold-duotone" },
                  { label: "Total Collected", count: totalCollected, total: totalBilledAmount, isCurrency: true, color: "bg-orange-500", bgGradient: "from-orange-500/10 to-amber-500/10", iconBg: "bg-orange-500/10", iconColor: "text-orange-600", icon: "solar:wallet-money-bold-duotone" },
                ].map((c, i) => (
                  <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-xl hover:scale-[1.02] transition-all duration-300`}>
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
                    <div className="p-5 flex items-center justify-between z-10 relative">
                      <div className="flex flex-col gap-1 flex-1 pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black text-slate-800 ${c.isCurrency ? "text-[22px]" : ""}`}>
                            {c.isCurrency ? `₹${c.count.toLocaleString()}` : c.count}
                          </span>
                          <span className="text-[16px] font-medium text-slate-400 opacity-80 uppercase tracking-tighter">
                            / {c.isCustomTotal ? `${c.total} Bills` : (c.isCurrency ? `₹${c.total.toLocaleString()}` : c.total)}
                          </span>
                        </div>
                        <div className="w-full text-xl bg-slate-200/50 h-1.5 rounded-full mt-1 overflow-hidden shadow-inner">
                          <div className={`h-full text-xl ${c.color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`} style={{ width: `${c.total > 0 ? (c.count / (c.isCustomTotal ? c.count || 1 : c.total)) * 100 : 0}%` }}></div>
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

            {/* SEARCH */}
            <StaggerItem>
              <div className="max-w-sm">
                <Input
                  placeholder="Search patient or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="custom-select-premium h-12 border-slate-200 bg-white/50 shadow-sm px-6"
                />
              </div>
            </StaggerItem>
          </>
        )}

        {activeTab === "Analytics" && (
          <StaggerItem>
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Today's Billing", count: todayMetrics.count, amount: todayMetrics.amount, color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600", icon: "solar:calendar-date-bold-duotone" },
                  { label: "This Week", count: weekMetrics.count, amount: weekMetrics.amount, color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", icon: "solar:calendar-minimalistic-bold-duotone" },
                  { label: "This Month", count: monthMetrics.count, amount: monthMetrics.amount, color: "bg-purple-500", bgGradient: "from-purple-500/10 to-fuchsia-500/10", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", icon: "solar:calendar-mark-bold-duotone" },
                ].map((c, i) => (
                  <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${c.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-2xl hover:scale-[1.02] transition-all duration-300`}>
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${c.color}`} />
                    <div className="p-8 flex flex-col gap-6 z-10 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconColor}`}>
                          <Icon icon={c.icon} className="text-xl" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-800">₹{c.amount.toLocaleString()}</span>
                          <span className="text-sm font-bold text-slate-400">Total Amount</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-800">{c.count}</span>
                          <span className="uppercase tracking-widest text-[9px] opacity-60">Bills Generated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="p-8 bg-white/50 rounded border border-slate-200 shadow-xl">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Revenue Over Time</h2>
                <div className="h-[400px]">
                  <Bar 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: { border: { dash: [4, 4] }, grid: { color: "#e2e8f0" } }
                      }
                    }} 
                  />
                </div>
              </Card>
            </div>
          </StaggerItem>
        )}

        {activeTab === "Reports" && (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded border border-slate-200 shadow-inner">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <Icon icon="solar:documents-minimalistic-bold-duotone" className="text-4xl" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Reports Generating Module</h2>
              <p className="text-slate-500 font-medium tracking-wide">Premium reports generator will be available soon.</p>
            </div>
          </StaggerItem>
        )}

        {/* TABLE */}
        {activeTab === "Billing" && (
          <StaggerItem>
            <div className="flex-1 bg-white/50 rounded border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                  Billing Records
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full">
                  {filteredBills.length} Records
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-100/50 backdrop-blur-md">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Patient</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Phone</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Paid</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Balance</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBills.map((b, index) => (
                      <tr key={b._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all group-hover:scale-110 ${
                                index % 2 === 0 ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                              }`}>
                              {(b.patientName || "P").charAt(0)}
                            </div>
                            <div className="font-bold text-slate-800 text-sm">
                              {b.patientName}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-slate-600 text-sm">
                          {b.patientPhone || "-"}
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-emerald-600 text-sm">
                          ₹{b.paidAmount}
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-rose-600 text-sm">
                          ₹{b.balanceAmount}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              b.balanceAmount > 0 ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                b.balanceAmount > 0 ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                              }`} />
                            {b.balanceAmount > 0 ? "Pending" : "Fully Paid"}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button 
                              onClick={() => {
                                setViewBillItem(b);
                                setIsViewModalOpen(true);
                              }}
                              className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm border border-slate-200 hover:scale-110 active:scale-95"
                              title="View"
                            >
                              <Icon icon="solar:eye-bold-duotone" width="20" />
                            </button>
                            <button 
                              onClick={() => setSelectedBill(b)}
                              className="p-3 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-all shadow-sm border border-orange-100 hover:scale-110 active:scale-95"
                              title="Edit"
                            >
                              <Icon icon="solar:pen-bold-duotone" width="20" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </StaggerItem>
        )}
        {/* FORM */}
        {selectedBill && (
          <BillForm
            selectedBill={selectedBill}
            setSelectedBill={setSelectedBill}
            refreshBills={handleGetBills}
          />
        )}

        {/* VIEW MODAL */}
        <ViewBillModal 
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          bill={viewBillItem}
        />
      </div>
    </StaggerContainer>
  );
}

export default Bill;
