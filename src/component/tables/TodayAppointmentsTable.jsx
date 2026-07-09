import { useEffect, useState } from "react";
import { AxiosInstanceSecondryServer } from "../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import Card from "../ui/Card";
import Button from "../ui/Button";

const TodayAppointmentsTable = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user") || sessionStorage.getItem("master") || "{}");
  const cid = user?.clinicId;

  const fetchAppointments = async () => {
    if (!cid) return;
    try {
      setLoading(true);
      setError(null);
      const res = await AxiosInstanceSecondryServer.get(
        `user-appointment/clinic-appointments/${cid}`
      );
      const result = res.data;

      if (result?.message?.includes("successfully")) {
        const allAppts = result.data || [];
        const todayStr = dayjs().format("YYYY-MM-DD");
        
        // Filter for today's appointments
        const todayAppts = allAppts.filter(appt => {
          if (!appt.appointmentDate) return false;
          const apptDate = dayjs(appt.appointmentDate).format("YYYY-MM-DD");
          return apptDate === todayStr;
        });

        // Sort by time slots
        todayAppts.sort((a, b) => {
           if (!a.selectedSlot) return 1;
           if (!b.selectedSlot) return -1;
           return a.selectedSlot.localeCompare(b.selectedSlot);
        });

        setAppointments(todayAppts);
      } else {
        setError(result?.message || "Failed to load appointments");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [cid]);

  return (
    <Card className="flex flex-col border border-slate-100 shadow-sm mt-8">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Icon icon="solar:calendar-date-bold-duotone" className="text-blue-500" />
            Today's Appointments
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Appointments scheduled for {dayjs().format("MMMM D, YYYY")}
          </p>
        </div>
        <Button 
           variant="outline" 
           size="sm" 
           className="text-slate-500 border-slate-200" 
           onClick={fetchAppointments} 
           disabled={loading}
        >
          <Icon icon="solar:refresh-bold" className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-nowrap">Time</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-nowrap">Patient</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-nowrap">Doctor</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-nowrap">Contact</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">
                  Loading appointments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-red-500 font-medium">
                  {error}
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center flex flex-col items-center justify-center border-none">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                    <Icon icon="solar:inbox-line-bold" className="text-3xl" />
                  </div>
                  <p className="text-slate-500 font-bold">No appointments for today</p>
                </td>
              </tr>
            ) : (
              appointments.map((appt) => {
                const isPending = appt.status?.toLowerCase() === "pending";
                const isApproved = appt.status?.toLowerCase() === "approve";

                return (
                  <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {appt.selectedSlot}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 text-sm">{appt.patientName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-600 text-sm">{appt.docName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-600 text-sm">{appt.clinicNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                        ${isPending ? 'bg-amber-50 text-amber-600' : ''}
                        ${isApproved ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${!isPending && !isApproved ? 'bg-red-50 text-red-600' : ''}
                      `}>
                        <Icon icon={isPending ? 'solar:clock-circle-bold' : isApproved ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} />
                        {(() => {
                           if (appt.status === "doctor_rescheduled") return "Dr. Rescheduled";
                           if (appt.status === "reject") return "Dr. Cancelled";
                           if (appt.status === "cancelled") return "Pt. Cancelled";
                           if (appt.status === "pending") {
                              if (appt.reschedules?.length > 0 && appt.reschedules[appt.reschedules.length - 1].rescheduledBy === "Patient") {
                                 return "Pt. Rescheduled";
                              }
                              return "Pending";
                           }
                           return appt.status;
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TodayAppointmentsTable;
