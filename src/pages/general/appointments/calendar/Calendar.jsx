import React, { useState } from "react";
import dayjs from "dayjs";
import Toolbar from "./Toolbar";
import ResourceGroups from "./ResourceGroups";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import ManageAppointments from "./ManageAppointments";
import "./Calendar.css";
import HeroSection from "../../../../component/hero/HeroSection";
import { Stethoscope, History } from "lucide-react";
import { DayPilotNavigator } from "@daypilot/daypilot-lite-react";

import { StaggerContainer, StaggerItem } from "../../../../component/ui/Transitions";

export default function Calendar({ refreshTrigger }) {
  const user = JSON.parse(
    sessionStorage.getItem("master") || sessionStorage.getItem("user"),
  );
  const [view, setView] = useState("week"); // "day" | "week" | "month"
  const [selectedGroup, setSelectedGroup] = useState(null); // selected doctor
  const [stateChange, setStateChange] = useState(null);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [week, setWeek] = useState(dayjs().format("YYYY-[W]WW"));
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [sidebarTab, setSidebarTab] = useState("doctors"); // 'doctors' | 'manage'

  const navigatorConfig = {
    selectMode: "Day",
    showMonths: 1,
    skipMonths: 1,
    theme: "navigator_modern",
    startDate: date,
    selectionDay: date,
    onTimeRangeSelected: (args) => {
      setDate(args.day.toString());
    },
  };

  const onPrev = () => {
    if (view === "day") {
      setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"));
    }

    if (view === "week")
      setWeek(
        dayjs()
          .isoWeek(Number(week.split("-W")[1]) - 1)
          .format("YYYY-[W]WW"),
      );
    if (view === "month")
      setMonth(dayjs(month).subtract(1, "month").format("YYYY-MM"));
  };
  const onNext = () => {
    if (view === "day") setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"));
    if (view === "week")
      setWeek(
        dayjs()
          .isoWeek(Number(week.split("-W")[1]) + 1)
          .format("YYYY-[W]WW"),
      );
    if (view === "month")
      setMonth(dayjs(month).add(1, "month").format("YYYY-MM"));
  };
  const onToday = () => {
    setDate(dayjs().format("YYYY-MM-DD"));
    setWeek(dayjs().format("YYYY-[W]WW"));
    setMonth(dayjs().format("YYYY-MM"));
  };

  const renderCalendar = () => {
    // Pass selectedGroup (doctor) to all views
    if (view === "day")
      return (
        <DayView
          startDate={date}
          setDate={setDate}
          selectedGroup={selectedGroup}
          stateChange={stateChange}
          setStateChange={setStateChange}
          refreshTrigger={refreshTrigger}
        />
      );
    if (view === "week")
      return (
        <WeekView
          startDate={week}
          selectedDoctor={selectedGroup}
          refreshTrigger={refreshTrigger}
          stateChange={stateChange}
          setStateChange={setStateChange}
        />
      );
    return (
      <MonthView
        startDate={month}
        selectedGroup={selectedGroup}
        refreshTrigger={refreshTrigger}
        stateChange={stateChange}
        setStateChange={setStateChange}
      />
    );
  };

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-6 p-6 h-[calc(100vh-80px)] bg-slate-50/50">
        <StaggerItem>
          {user?.userType === "master" ? (
            <HeroSection role={"receptionist"} />
          ) : (
            <h1 className="font-black text-slate-800 text-4xl tracking-tight">
              Internal <span className="text-blue-500">Appointments</span>
            </h1>
          )}
        </StaggerItem>

        <div className="flex flex-col gap-8 w-full items-start">
          {/* 🛠️ Premium Sidebar */}
          <StaggerItem className="w-full">
            <div className="flex flex-col w-full self-start gap-8 transition-all">
              <div className="flex flex-col xl:flex-row gap-4 w-full items-start">
                <ResourceGroups
                  selectedGroup={selectedGroup}
                  onChange={setSelectedGroup}
                  setStateChange={setStateChange}
                />
                <ManageAppointments
                  clinicId={user?.clinicId}
                  stateChange={stateChange}
                  setStateChange={setStateChange}
                  refresh={refreshTrigger}
                  selectedGroup={selectedGroup}
                />
              </div>
            </div>
          </StaggerItem>

          {/* 📅 Main Viewport */}
          <StaggerItem>
            <div className="flex-1 w-full bg-white/70 backdrop-blur-3xl border border-slate-200/50 flex flex-col gap-8 p-10 h-full overflow-hidden transition-all duration-700 rounded-3xl shadow-2xl">
              <Toolbar
                view={view}
                onViewChange={setView}
                onPrev={onPrev}
                onNext={onNext}
                onToday={onToday}
                date={date}
                week={week}
                month={month}
                setDate={setDate}
                setWeek={setWeek}
                setMonth={setMonth}
              />
              <div className="flex-1 overflow-hidden bg-white border border-slate-100 shadow-[inner_0_2px_10px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 rounded-2xl">
                <div className="h-full center-body overflow-auto relative p-1">
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </StaggerItem>
        </div>
      </div>
    </StaggerContainer>
  );
}
