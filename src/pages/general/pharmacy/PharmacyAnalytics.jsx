import React, { useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { message, Spin } from "antd";

const PharmacyAnalytics = ({ prescriptions = [], inventory = [] }) => {
  const reportRef = useRef();
  const [generating, setGenerating] = useState(false);

  // Aggregate data for charts
  const topMedsData = useMemo(() => {
    const medCounts = {};
    prescriptions.forEach((p) => {
      p.medicinesData?.forEach((m) => {
        medCounts[m.medication] = (medCounts[m.medication] || 0) + 1;
      });
    });
    return Object.entries(medCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [prescriptions]);

  const stockStatusData = useMemo(() => {
    let low = 0, healthy = 0, out = 0;
    inventory.forEach((item) => {
      if (item.productCurrentCount <= 0) out++;
      else if (item.productCurrentCount < 10) low++;
      else healthy++;
    });
    return [
      { name: "Healthy", value: healthy, color: "#10b981" },
      { name: "Low Stock", value: low, color: "#f59e0b" },
      { name: "Out of Stock", value: out, color: "#ef4444" },
    ];
  }, [inventory]);

  const trendData = [
    { name: "Mon", count: 12 },
    { name: "Tue", count: 19 },
    { name: "Wed", count: 15 },
    { name: "Thu", count: 22 },
    { name: "Fri", count: 30 },
    { name: "Sat", count: 25 },
    { name: "Sun", count: 10 },
  ];

  const today = dayjs().startOf('day');
  const todayPrescriptions = prescriptions.filter(p => dayjs(p.createdAt).isSame(today, 'day'));
  const overduePrescriptions = prescriptions.filter(p => dayjs(p.createdAt).isBefore(today, 'day') && p.dispenseStatus !== "Fully Dispensed");

  const metrics = [
    { label: "Today Total", value: todayPrescriptions.length, total: todayPrescriptions.length, icon: "solar:clipboard-list-bold-duotone", color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
    { label: "Pending", value: todayPrescriptions.filter(p => p.dispenseStatus !== "Fully Dispensed").length, total: todayPrescriptions.length, icon: "solar:clock-circle-bold-duotone", color: "bg-amber-500", bgGradient: "from-amber-500/10 to-orange-500/10", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
    { label: "Delivered", value: todayPrescriptions.filter(p => p.dispenseStatus === "Fully Dispensed").length, total: todayPrescriptions.length, icon: "solar:check-circle-bold-duotone", color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Today Refill", value: todayPrescriptions.filter(p => p.isRefillable).length, total: todayPrescriptions.length, icon: "solar:refresh-bold-duotone", color: "bg-indigo-500", bgGradient: "from-indigo-500/10 to-violet-500/10", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600" },
  ];

  const handleGenerateReport = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F4F7FF",
        logging: false,
        onclone: (clonedDoc) => {
          // Comprehensive fix for html2canvas not supporting modern color functions (oklch, oklab, etc.)
          // 1. Sanitize all <style> tags
          const styleTags = clonedDoc.getElementsByTagName("style");
          const colorRegex = /(oklch|oklab|lab|lch|hwb)\([^)]+\)/g;
          for (let i = 0; i < styleTags.length; i++) {
            styleTags[i].textContent = styleTags[i].textContent.replace(colorRegex, "#3b82f6");
          }
          
          // 2. Sanitize all attributes of all elements (especially for SVGs)
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            // Check and replace modern colors in all attributes
            const attrs = el.attributes;
            for (let i = 0; i < attrs.length; i++) {
              const attr = attrs[i];
              if (attr.value && colorRegex.test(attr.value)) {
                el.setAttribute(attr.name, attr.value.replace(colorRegex, "#3b82f6"));
              }
            }
            
            // Check and replace modern colors in inline styles
            if (el.style) {
              for (let i = 0; i < el.style.length; i++) {
                const prop = el.style[i];
                const val = el.style.getPropertyValue(prop);
                if (val && colorRegex.test(val)) {
                  el.style.setProperty(prop, val.replace(colorRegex, "#3b82f6"));
                }
              }
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.setFontSize(18);
      pdf.setTextColor(40, 64, 176);
      pdf.text("Pharmacy Operational Report", 10, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated on: ${dayjs().format("DD MMM YYYY, HH:mm A")}`, 10, 22);
      
      pdf.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight);
      pdf.save(`Pharmacy_Report_${dayjs().format("YYYY-MM-DD")}.pdf`);
      
      message.success("Report generated successfully!");
    } catch (error) {
      console.error("Report extraction failed:", error);
      message.error("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 relative">
      {generating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl">
          <Spin size="large" />
          <span className="mt-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Preparing Report...</span>
        </div>
      )}

      <div ref={reportRef} className="flex flex-col gap-8 p-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className={`group relative overflow-hidden bg-linear-to-br ${m.bgGradient} backdrop-blur-xl border border-slate-200/60 rounded-[32px] hover:scale-[1.02] transition-all duration-300`}>
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 ${m.color}`} />
              
              <div className="p-6 flex items-center justify-between z-10 relative">
                <div className="flex flex-col gap-1 flex-1 pr-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800">{m.value}</span>
                    <span className="text-sm font-medium text-slate-400 opacity-80">/ {m.total}</span>
                  </div>
                  <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-1 overflow-hidden shadow-inner">
                    <div className={`h-full ${m.color.replace('bg-', 'bg-')} bg-opacity-80 rounded-full transition-all duration-1000`} style={{ width: `${m.total > 0 ? (m.value / m.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div className={`w-16 h-16 shrink-0 rounded-2xl ${m.iconBg} flex items-center justify-center ${m.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon icon={m.icon} className="text-3xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Medications Chart */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Top 5 Medications</h3>
              <Icon icon="solar:chart-square-bold-duotone" className="text-blue-500 text-xl" />
            </div>
            <div className="h-[300px] w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMedsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} pady={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prescription Trend */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Weekly Trend</h3>
              <Icon icon="solar:graph-bold-duotone" className="text-indigo-500 text-xl" />
            </div>
            <div className="h-[300px] w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Status Pie Chart */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Stock Health</h3>
              <Icon icon="solar:pie-chart-bold-duotone" className="text-emerald-500 text-xl" />
            </div>
            <div className="h-[300px] w-full flex items-center text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Logs & Button */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6 lg:col-span-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Recent Dispensed Logs</h3>
            <div className="space-y-4">
              {prescriptions.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">
                      {p.patientName?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 leading-tight">{p.patientName}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{p.dispenseStatus || "Pending"}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500">{dayjs(p.createdAt).format("HH:mm A")}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleGenerateReport}
              disabled={generating}
              className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Full Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyAnalytics;
