import React, { useEffect, useState } from "react";
import "./Calendar.css";
import { ChevronRight, Stethoscope, User, XCircle } from "lucide-react";
import BookAppointment from "../BookAppointment";
import { AxiosInstance } from "../../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react/dist/iconify.js";
import Button from "../../../../component/ui/Button";

export default function ResourceGroups({
  selectedGroup,
  onChange,
  setStateChange,
}) {
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(selectedGroup || null);

  const user = JSON.parse(
    sessionStorage.getItem("user") || sessionStorage.getItem("master"),
  );

  const getDoctor = async () => {
    try {
      const res = await AxiosInstance.get(
        `/user/get-doctor?clinicId=${user.clinicId}`,
      );
      setUsers(res.data.users);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getDoctor();
  }, [user.clinicId]);

  const handleSelect = (doctor) => {
    setSelectedDoctor(doctor); // set local state
    if (onChange) onChange(doctor); // notify parent
  };

  const clearFilter = () => {
    setSelectedDoctor(null); // reset local state
    if (onChange) onChange(null); // notify parent
  };

  return (
    <div className="flex flex-col gap-5 w-full xl:w-1/4 xl:min-w-[280px] bg-white p-5 border border-slate-200/50 rounded-2xl">
      <div className="flex flex-col gap-3 justify-between w-full">
        <div className={`flex justify-between ${selectedDoctor ? "flex-col gap-3" : "flex-row items-center"}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-[#14BEF0]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800  tracking-tight m-0">
              Doctors
            </h2>
          </div>
          {selectedDoctor && (
            <Button
              onClick={clearFilter}
              variant="ghost"
              className="text-xs font-bold w-fit text-red-500 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 transition-all uppercase tracking-wider"
            >
              <XCircle className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
        <Button
          onClick={() => setBookModalVisible(true)}
          className="w-full justify-center gap-3 h-8 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-bold group"
        >
          Book Appointment
        </Button>
      </div>

      <div className="group-list flex-1 overflow-auto flex flex-col gap-3 p-2 custom-scrollbar">
        {users?.map((g, idx) => {
          const isSelected = selectedDoctor?._id === g._id;
          return (
            <button
              key={g?._id}
              onClick={() => handleSelect(g)}
              className={`flex items-center gap-4 w-full p-2 rounded transition-all duration-500 group relative overflow-hidden ${
                isSelected
                  ? "bg-[#14BEF0] text-white z-10 border border-[#14BEF0]"
                  : "bg-slate-100 hover:bg-slate-100/80 border border-slate-200"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl animate-pulse" />
              )}

              <div
                className={`rounded-full p-3 flex items-center justify-center transition-all duration-500 ${
                  isSelected
                    ? "bg-white/20 text-white shadow-inner"
                    : "bg-linear-gradient-90 from-[#14BEF0] to-[#14BEF0]   text-slate-500 group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-[#14BEF0] shadow-sm"
                }`}
              >
                <User className={`w-4 h-4 transition-all`} />
              </div>

              <div className="flex flex-col items-start gap-1 flex-1">
                <span
                  className={`text-base font-black capitalize tracking-tight ${
                    isSelected ? "text-white" : "text-slate-800 "
                  }`}
                >
                  {g?.userName}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] uppercase font-black tracking-[0.15em] ${
                      isSelected ? "text-blue-100" : "text-slate-400 "
                    }`}
                  >
                    Specialist
                  </span>
                  <div
                    className={`w-1 h-1 rounded-full ${isSelected ? "bg-blue-200" : "bg-emerald-500"} animate-pulse`}
                  />
                </div>
              </div>

              <div
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 ${
                  isSelected
                    ? "bg-white/20 rotate-0"
                    : "bg-slate-100/50  group-hover:rotate-0 group-hover:bg-[#14BEF0]/10 group-hover:text-[#14BEF0]"
                }`}
              >
                <ChevronRight
                  className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#14BEF0]"}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <BookAppointment
        visible={bookModalVisible}
        setVisible={setBookModalVisible}
        onBooked={() => {}}
        setStateChange={setStateChange}
      />
    </div>
  );
}
