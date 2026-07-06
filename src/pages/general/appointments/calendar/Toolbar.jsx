import React from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { DatePicker } from "antd";
import "./Calendar.css";
import { Icon } from "@iconify/react";
import Button from "../../../../component/ui/Button";

dayjs.extend(isoWeek);

export default function Toolbar({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  date,
  week,
  month,
  setDate,
  setWeek,
  setMonth,
}) {
  // Handle week picker change
  const handleWeekChange = (dateObj) => {
    if (!dateObj) return;
    const isoWeekString = dateObj.format("YYYY-[W]WW");
    setWeek(isoWeekString);
  };

  // Display the week range (for UI)
  const displayWeek = () => {
    if (!week) return "";
    const [year, weekNum] = week.split("-W").map(Number);
    const startOfWeek = dayjs().year(year).isoWeek(weekNum).startOf("isoWeek");
    const endOfWeek = dayjs().year(year).isoWeek(weekNum).endOf("isoWeek");
    return (
      <span className="flex items-center gap-2">
        {startOfWeek.format("DD MMM")}
        <span className="text-slate-300 ">—</span>
        {endOfWeek.format("DD MMM YYYY")}
      </span>
    );
  };

  // Month change handler
  const handleMonthChange = (monthString) => {
    const [year, monthNum] = monthString.split("-").map(Number);
    const firstDay = dayjs()
      .year(year)
      .month(monthNum - 1)
      .startOf("month");
    setMonth(firstDay.format("YYYY-MM"));
  };

  return (
    <div className="flex items-center pr-4 justify-between bg-slate-50/50 border border-slate-200/50  shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] flex-wrap gap-6">
      {/* Date Display Badge */}
      <div className="flex items-center gap-6 bg-white/60 backdrop-blur-2xl border border-slate-200/50 px-10 py-4 min-w-[380px] justify-center group hover:scale-[1.01] transition-all duration-500">
        <button
          onClick={onPrev}
          className="flex items-center justify-center p-2.5 rounded hover:bg-slate-100 :bg-slate-800 text-slate-400 hover:text-[#14BEF0] transition-all active:scale-90"
        >
          <Icon icon="solar:alt-arrow-left-bold" width="24" />
        </button>
        <div className="flex flex-col items-center justify-center min-w-[160px] text-center">
          <span className="text-[10px] font-black uppercase text-[#14BEF0] tracking-[0.4em] mb-1.5 leading-none text-indent-[0.4em]">
            {view === 'day' ? 'Today' : view === 'week' ? 'Weekly View' : 'Monthly Overview'}
          </span>
          <h2 className="text-2xl font-black text-slate-800  tracking-tighter m-0 flex items-center gap-2 leading-none">
            {view === "day" && dayjs(date).format("DD MMM YYYY")}
            {view === "week" && displayWeek()}
            {view === "month" && dayjs(month).format("MMMM YYYY")}
          </h2>
        </div>
        <button
          onClick={onNext}
          className="flex items-center justify-center p-2.5 hover:bg-slate-100 :bg-slate-800 text-slate-400 hover:text-[#14BEF0] transition-all active:scale-90"
        >
          <Icon icon="solar:alt-arrow-right-bold" width="24" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* View Selection Toggle */}
        <div className="flex items-center p-2 bg-slate-100/50 rounded backdrop-blur-sm border border-slate-200/40  shadow-sm">
          {["day", "week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-8 py-3 text-[10px] font-black uppercase rounded tracking-widest transition-all duration-500 text-indent-[0.2em] ${view === v
                ? "bg-[#14BEF0] text-white shadow-md"
                : "text-slate-500  hover:text-slate-800 :text-slate-200 hover:bg-white/50 :bg-slate-700/30"}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToday}
            className="px-6 py-3 border border-slate-200  bg-white  text-slate-600  text-xs font-black uppercase tracking-widest hover:bg-slate-50 :bg-slate-700 hover:border-slate-300 :border-slate-600 shadow-md transition-all active:scale-95 h-11 leading-none"
          >
            Today
          </button>

          <div className="w-px h-8 bg-slate-200  mx-1"></div>

          {view === "week" && (
            <DatePicker
              picker="week"
              value={
                week
                  ? dayjs()
                    .year(Number(week.split("-W")[0]))
                    .isoWeek(Number(week.split("-W")[1]))
                  : null
              }
              onChange={handleWeekChange}
              format="DD MMM"
              className="!h-11 !rounded-2xl !border-slate-200/60  !bg-white  !text-slate-800  shadow-lg hover:!border-blue-500 transition-all items-center flex"
              popupClassName="dark-datepicker-popup"
            />
          )}

          {view === "month" && (
            <select
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-48 h-11 rounded-2xl border border-slate-200/60  bg-white  px-5 py-2 text-xs font-black uppercase tracking-widest text-slate-700  shadow-lg outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-blue-500 transition-all cursor-pointer appearance-none items-center flex"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.8rem' }}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const m = dayjs().month(i);
                return (
                  <option key={i} value={m.format("YYYY-MM")}>
                    {m.format("MMMM YYYY")}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
