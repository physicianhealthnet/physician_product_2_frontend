import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import formatDateToDDMMYYYY from "../../utilities/formatter";
import { Modal, DatePicker, Button } from "antd";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isToday);

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

function NextReview() {
  const clinicId = JSON.parse(sessionStorage.getItem("user"))?.clinicId;
  const { RangePicker } = DatePicker;
  const [dateRange, setDateRange] = useState([null, null]);

  const [scales, setScales] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [counts, setCounts] = useState({
    today: 0,
    tomorrow: 0,
    thisWeek: 0,
    nextWeek: 0,
    thisMonth: 0,
    nextMonth: 0,
  });
  const [reviewList, setReviewList] = useState([]);

  const handleGetTreatmentTracker = async () => {
    try {
      const response = await AxiosInstance.get(`/treatment-tracker/get-all`);
      const cleaned = response?.data.flatMap((row) => {
        // If row has session list
        if (row.upcomming_sessions?.length > 0) {
          return row.upcomming_sessions
            .filter((s) => s.nextReview && s.nextReview !== "")
            .map((s) => ({
              ...s,
              // attach patient info to every row
              patientName: row.patientName || "",
              patientId: row.patientId || "",
              patientPhone: row.patientPhone || "",
              patientAddress: row.patientAddress || "",
            }));
        }

        // If row itself has nextReview
        if (row.nextReview && row.nextReview !== "") {
          return [
            {
              ...row,
              patientName: row.patientName || "",
              patientId: row.patientId || "",
              patientPhone: row.patientPhone || "",
              patientAddress: row.patientAddress || "",
            },
          ];
        }

        // otherwise ignore completely
        return [];
      });

      // Final clean dataset
      setScales(cleaned);
      setReviewList(cleaned);

      const today = dayjs().startOf("day");

      // Upcoming reviews
      const upcoming = cleaned
        .filter((item) => dayjs(item.nextReview).isSameOrAfter(today, "day"))
        .sort((a, b) => dayjs(a.nextReview) - dayjs(b.nextReview));

      // Past reviews
      const past = cleaned
        .filter((item) => dayjs(item.nextReview).isBefore(today, "day"))
        .sort((a, b) => dayjs(b.nextReview) - dayjs(a.nextReview));

      // Date bounds
      const todayStart = dayjs().startOf("day");
      const todayEnd = dayjs().endOf("day");

      const tomorrowStart = dayjs().add(1, "day").startOf("day");
      const tomorrowEnd = dayjs().add(1, "day").endOf("day");

      const thisWeekStart = dayjs().startOf("week");
      const thisWeekEnd = dayjs().endOf("week");

      const nextWeekStart = dayjs().add(1, "week").startOf("week");
      const nextWeekEnd = dayjs().add(1, "week").endOf("week");

      const thisMonthStart = dayjs().startOf("month");
      const thisMonthEnd = dayjs().endOf("month");

      const nextMonthStart = dayjs().add(1, "month").startOf("month");
      const nextMonthEnd = dayjs().add(1, "month").endOf("month");

      const isDateInRange = (date, start, end) =>
        dayjs(date).isSameOrAfter(start) && dayjs(date).isSameOrBefore(end);

      const newCounts = {
        today: 0,
        tomorrow: 0,
        thisWeek: 0,
        nextWeek: 0,
        thisMonth: 0,
        nextMonth: 0,
      };

      cleaned.forEach((item) => {
        if (!item.nextReview) return;
        const d = dayjs(item.nextReview);
        if (isDateInRange(d, todayStart, todayEnd)) newCounts.today++;
        if (isDateInRange(d, tomorrowStart, tomorrowEnd)) newCounts.tomorrow++;
        if (isDateInRange(d, thisWeekStart, thisWeekEnd)) newCounts.thisWeek++;
        if (isDateInRange(d, nextWeekStart, nextWeekEnd)) newCounts.nextWeek++;
        if (isDateInRange(d, thisMonthStart, thisMonthEnd)) newCounts.thisMonth++;
        if (isDateInRange(d, nextMonthStart, nextMonthEnd)) newCounts.nextMonth++;
      });
      
      setCounts(newCounts);

      // Define totalUpcoming on the state to access it in the UI mapping
      setFilteredData(upcoming);
      setHistoryData(past);
      setCounts(prev => ({ ...prev, totalUpcoming: upcoming.length }));
    } catch (error) {
      console.error("Error fetching treatment tracker:", error);
    }
  };

  const handleRangeFilter = (dates) => {
    setDateRange(dates);

    if (!dates || dates.length !== 2 || !dates[0] || !dates[1]) {
      // reset to upcoming
      const today = dayjs().startOf("day");
      setFilteredData(
        scales
          .filter(
            (item) =>
              item.nextReview &&
              dayjs(item.nextReview).isSameOrAfter(today, "day"),
          )
          .sort((a, b) => dayjs(a.nextReview) - dayjs(b.nextReview)),
      );
      return;
    }

    const [start, end] = dates.map((d) => dayjs(d).startOf("day"));

    const filtered = scales
      .filter(
        (item) =>
          item.nextReview &&
          dayjs(item.nextReview).isSameOrAfter(start, "day") &&
          dayjs(item.nextReview).isSameOrBefore(end, "day"),
      )
      .sort((a, b) => dayjs(a.nextReview) - dayjs(b.nextReview));

    setFilteredData(filtered);
  };

  useEffect(() => {
    handleGetTreatmentTracker();
  }, []);

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200  shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]  min-h-[900px]">
        {/* Header Section */}
        <StaggerItem>
          <div className="flex flex-col lg:flex-row justify-between rounded items-start lg:items-center gap-8">
            <div>
              <h1 className="font-black text-slate-800  text-4xl tracking-tight">
                Next <span className="text-blue-500">Review</span>
              </h1>
              <p className="text-slate-500  font-medium mt-2 tracking-wide uppercase text-[10px]">
                Schedule and track upcoming patient follow-ups
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-50/50  p-3 border border-slate-200  shadow-inner">
              <RangePicker
                onChange={handleRangeFilter}
                format="DD-MM-YYYY"
                allowClear
                className="custom-select-premium h-12 border-none bg-white shadow-sm px-6"
              />
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 px-6 rounded py-3.5 bg-white  text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-sm border border-slate-200  group"
              >
                <Icon
                  icon="solar:history-bold-duotone"
                  width="20"
                  className="group-hover:scale-110 transition-transform"
                />
                View History
              </button>
            </div>
          </div>
        </StaggerItem>

        {/* Summary Cards */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {[
              { label: "Today", count: counts.today, total: counts.totalUpcoming || 0, color: "bg-orange-500", bgGradient: "from-orange-500/10 to-amber-500/10", iconBg: "bg-orange-500/10", iconColor: "text-orange-600", icon: "solar:calendar-bold-duotone" },
              { label: "Tomorrow", count: counts.tomorrow, total: counts.totalUpcoming || 0, color: "bg-blue-500", bgGradient: "from-blue-500/10 to-indigo-500/10", iconBg: "bg-blue-500/10", iconColor: "text-blue-600", icon: "solar:calendar-line-duotone" },
              { label: "This Week", count: counts.thisWeek, total: counts.totalUpcoming || 0, color: "bg-emerald-500", bgGradient: "from-emerald-500/10 to-teal-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", icon: "solar:calendar-mark-bold-duotone" },
              { label: "Next Week", count: counts.nextWeek, total: counts.totalUpcoming || 0, color: "bg-indigo-500", bgGradient: "from-indigo-500/10 to-violet-500/10", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600", icon: "solar:calendar-add-bold-duotone" },
              { label: "This Month", count: counts.thisMonth, total: counts.totalUpcoming || 0, color: "bg-purple-500", bgGradient: "from-purple-500/10 to-fuchsia-500/10", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", icon: "solar:calendar-date-bold-duotone" },
              { label: "Next Month", count: counts.nextMonth, total: counts.totalUpcoming || 0, color: "bg-rose-500", bgGradient: "from-rose-500/10 to-pink-500/10", iconBg: "bg-rose-500/10", iconColor: "text-rose-600", icon: "solar:calendar-search-bold-duotone" },
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

        {/* Modern Table Container */}
        <StaggerItem>
          <div className="flex-1 bg-white/50 rounded border border-slate-200  overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-100/50  backdrop-blur-md">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200 ">
                      Patient
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200  text-center">
                      ID
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200  text-center">
                      Review Date
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200  text-center">
                      Status
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200  text-center">
                      Contact
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500  border-b border-slate-200  text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {filteredData.length > 0 ? (
                    filteredData.map((scale, index) => {
                      const isToday = dayjs(scale.nextReview).isToday();
                      const isPast = dayjs(scale.nextReview).isBefore(
                        dayjs(),
                        "day",
                      );

                      return (
                        <tr
                          key={scale._id || index}
                          className="group hover:bg-slate-50/50 :bg-slate-800/20 transition-all duration-300"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all group-hover:scale-110 ${
                                  index % 2 === 0
                                    ? "bg-blue-100 text-blue-600  "
                                    : "bg-emerald-100 text-emerald-600  "
                                }`}
                              >
                                {(scale.patientName || "P").charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800  text-sm">
                                  {scale.patientName || "-"}
                                </div>
                                <div className="text-[10px] text-slate-400  font-bold uppercase tracking-wider mt-0.5">
                                  {scale.treatmentName || "General Checkup"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="px-3 py-1 bg-slate-100  rounded-full text-[10px] font-black text-slate-500  tracking-wider">
                              {scale.patientId || "-"}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-slate-700  text-sm">
                                {formatDateToDDMMYYYY(scale.nextReview) || "-"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400  flex items-center gap-1 mt-1 uppercase tracking-widest">
                                <Icon icon="solar:clock-circle-linear" />
                                {scale.startTime || "All Day"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div
                              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isToday
                                  ? "bg-orange-100 text-orange-600   animate-pulse"
                                  : isPast
                                    ? "bg-rose-100 text-rose-600  "
                                    : "bg-blue-100 text-blue-600  "
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isToday
                                    ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                    : isPast
                                      ? "bg-rose-500"
                                      : "bg-blue-500"
                                }`}
                              />
                              {isToday ? "Today" : isPast ? "Overdue" : "Upcoming"}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-slate-600  text-sm">
                            {scale.patientPhone || "-"}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() =>
                                  Modal.info({
                                    title: `${scale.patientName}'s Address`,
                                    className: "custom-modal-premium",
                                    content:
                                      scale.patientAddress ||
                                      "No address available",
                                  })
                                }
                                className="p-3 bg-white  text-slate-400  hover:text-blue-600 :text-blue-400 rounded-xl transition-all shadow-sm border border-slate-200  hover:scale-110 active:scale-95"
                                title="View Address"
                              >
                                <Icon
                                  icon="solar:map-point-bold-duotone"
                                  width="20"
                                />
                              </button>
                              <button
                                className="p-3 bg-emerald-50  text-emerald-600  hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100/50  hover:scale-110 active:scale-95"
                                title="WhatsApp"
                              >
                                <Icon icon="ic:baseline-whatsapp" width="20" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-100  rounded-full flex items-center justify-center">
                            <Icon
                              icon="solar:calendar-search-linear"
                              width="32"
                              className="text-slate-300"
                            />
                          </div>
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            No records found for the selected range
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
      </div>

      {/* History Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 bg-blue-100  text-blue-600  rounded-lg flex items-center justify-center">
              <Icon icon="solar:history-bold" width="18" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-800  uppercase">
              Past Review History
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        className="custom-modal-premium"
      >
        <div className="max-h-[500px] overflow-auto custom-scrollbar mt-6 rounded-4xl border border-slate-200 ">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50  transition-colors">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  S.No
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Patient Details
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
              {historyData.length > 0 ? (
                historyData.map((scale, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/50 :bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700  text-sm">
                        {scale.patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-black text-slate-500  uppercase tracking-widest">
                        {scale.patientId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-600 ">
                        {formatDateToDDMMYYYY(scale.nextReview)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center text-slate-400 italic"
                  >
                    No past records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </StaggerContainer>
  );
}

export default NextReview;
