import React, { useMemo, useState } from "react";
import "./Calendar.css";
import { DayPilot } from "@daypilot/daypilot-lite-react";
import Button from "../../../../component/ui/Button";

export default function SchedulePanel({ events = [], startDate, onJumpToEvent }) {
  const [tab, setTab] = useState("All"); // All | Online | Offline
  // simple status counts derived from events (demo)
  const todayStr = new DayPilot.Date(startDate).toString();

  const todays = useMemo(
    () => events.filter((e) => new DayPilot.Date(e.start).toString().startsWith(new DayPilot.Date(startDate).toString())),
    [events, startDate]
  );

  const filtered = useMemo(() => {
    if (tab === "All") return todays;
    if (tab === "Online") return todays.filter((e) => e.online);
    return todays.filter((e) => !e.online);
  }, [todays, tab]);

  const waiting = filtered.filter((e) => e.status === "waiting").length;
  const engaged = filtered.filter((e) => e.status === "engaged").length;
  const done = filtered.filter((e) => e.status === "done").length;

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-white  border border-slate-200  rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800  m-0">Today's Schedule</h4>
          <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2 font-bold uppercase tracking-wider">
            Add Walk-in
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-slate-50  p-1 rounded-lg">
          {["All", "Online", "Offline"].map((t) => (
            <button
              key={t}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tab === t
                  ? "bg-white  text-blue-600  shadow-sm"
                  : "text-slate-500 hover:text-slate-700 :text-slate-300"
                }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-blue-50  border border-blue-100 ">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Today</div>
          <div className="text-xl font-bold text-blue-700 ">{todays.length}</div>
        </div>
        <div className="p-2 rounded-lg bg-red-50  border border-red-100 ">
          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Waiting</div>
          <div className="text-xl font-bold text-red-700 ">{waiting}</div>
        </div>
        <div className="p-2 rounded-lg bg-orange-50  border border-orange-100 ">
          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Engaged</div>
          <div className="text-xl font-bold text-orange-700 ">{engaged}</div>
        </div>
        <div className="p-2 rounded-lg bg-green-50  border border-green-100 ">
          <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Done</div>
          <div className="text-xl font-bold text-green-700 ">{done}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-slate-400  italic text-sm">No appointments</div>
        ) : (
          filtered.map((ev) => (
            <button
              key={ev.id}
              className="flex items-center gap-3 p-3 text-left bg-slate-50  border border-slate-100  rounded-xl hover:border-blue-200 :border-blue-800 transition-all group"
              onClick={() => onJumpToEvent(ev)}
            >
              <div className="text-xs font-bold text-slate-400  whitespace-nowrap">
                {new DayPilot.Date(ev.start).toString().substring(11, 16)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-700  truncate">{ev.text}</div>
                <div className="text-[10px] text-slate-400  truncate">Visit reason not specified</div>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${ev.status === "done" ? "bg-green-500" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
