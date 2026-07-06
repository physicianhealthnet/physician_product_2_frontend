import React, { useState } from "react";
import BookAppointment from "./BookAppointment";
import PatientAppointments from "./PatientAppointments";
import Calendar from "./calendar/Calendar"; // DayPilot calendar
import Button from "../../../component/ui/Button";

const Appointments = () => {
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  return (
    <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px] transition-all duration-700">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between rounded items-start xl:items-center gap-8">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight leading-tight">
            Clinic <span className="text-blue-500">Appointments</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 tracking-wide uppercase text-[10px]">
             Manage scheduling, patient history, and calendar view
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50/50 p-2 border border-slate-200 shadow-inner rounded w-fit">
            <button
              onClick={() => setHistoryVisible(false)}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                !historyVisible 
                  ? "bg-white shadow-sm text-blue-600 border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setHistoryVisible(true)}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest rounded transition-all duration-300 ${
                historyVisible 
                  ? "bg-white shadow-sm text-blue-600 border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              Appointment History
            </button>
          </div>
          
          <button
            onClick={() => setBookModalVisible(true)}
            className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 md:px-6 md:py-2.5 bg-blue-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-700 hover:scale-[1.05] active:scale-95 transition-all duration-300"
          >
            Book Appointment
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white/50 rounded border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
        {!historyVisible ? (
          <div className="w-full h-full p-4 overflow-hidden">
            <Calendar refreshTrigger={refreshFlag} />
          </div>
        ) : (
          <div className="w-full h-full p-4 overflow-auto">
            <PatientAppointments onClose={() => setHistoryVisible(false)} />
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <BookAppointment
        visible={bookModalVisible}
        setVisible={setBookModalVisible}
        onBooked={() => setRefreshFlag(!refreshFlag)}
      />
    </div>
  );
};

export default Appointments;
