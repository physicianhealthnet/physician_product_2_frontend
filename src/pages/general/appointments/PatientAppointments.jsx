import React, { useState, useEffect } from "react";
import { Modal, Pagination, Spin } from "antd";
import dayjs from "dayjs";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  TagsFilled,
  SolutionOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import Input from "../../../component/ui/Input";
import Button from "../../../component/ui/Button";
import { TableSkeleton, CardSkeleton } from "../../../component/ui/Skeleton";

const PatientAppointments = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [apptModalVisible, setApptModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const storedUser = JSON.parse(sessionStorage.getItem("user") || sessionStorage.getItem("master"));
  const clinicId = storedUser?.clinicId;
  const limit = 5; // Patients per page

  // Fetch patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get(
        `/appointments/patients?clinicId=${clinicId}&search=${searchTerm}&page=${page}&limit=${limit}`
      );
      setPatients(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, page, clinicId]);

  // Fetch appointments for a patient
  const fetchAppointments = async (patientId) => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get(
        `/appointments/get-patient-appointment/${patientId}`
      );
      setAppointments(res.data || []);
      setApptModalVisible(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full h-full space-y-4">
      {/* Search */}
      <div className="w-full md:w-80">
        <Input
          placeholder="Search patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto border border-slate-200/50 rounded-xl">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/90 backdrop-blur-md text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-200 shadow-sm">
              <th className="p-4 pl-6">Patient Name</th>
              <th className="p-4">Patient ID</th>
              <th className="p-4">Phone</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4">
                  <TableSkeleton rows={5} />
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center opacity-60">
                  <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <div className="p-4 rounded-full bg-slate-100">
                      <UserOutlined className="text-4xl text-slate-300" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-extrabold text-sm uppercase tracking-widest">
                        No Patients
                      </p>
                      <p className="text-xs text-slate-400">
                        Try searching for a different patient
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.patientId} className="hover:bg-slate-50/80 border-b border-slate-100/50 transition-colors duration-200 group">
                  <td className="p-4 pl-6">
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{patient.patientName}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-slate-500">{patient.patientId}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-slate-600">{patient.patientPhone}</span>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        fetchAppointments(patient._id);
                      }}
                      className="text-[10px] px-4 py-1.5 h-auto uppercase tracking-widest mx-auto"
                    >
                      View History
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end pt-2">
        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          onChange={(p) => setPage(p)}
          className=""
        />
      </div>

      {/* Appointments Modal */}
      <Modal
        title={<span className="text-xl font-bold text-slate-800 ">Appointments for {selectedPatient?.patientName || ""}</span>}
        open={apptModalVisible}
        onCancel={() => setApptModalVisible(false)}
        footer={[
          <Button key="close" variant="secondary" onClick={() => setApptModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        centered
        className="dark-modal"
        styles={{
          mask: { backdropFilter: 'blur(4px)' },
          content: { padding: '24px', borderRadius: '16px', backgroundColor: 'transparent' },
        }}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No appointments found for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/50 rounded-xl">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50/90 backdrop-blur-md text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-200 shadow-sm">
                    <th className="p-4 pl-6">Doctor</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <React.Fragment key={appt._id}>
                      <tr className="hover:bg-slate-50/80 border-b border-slate-100/50 transition-colors duration-200 group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                              <SolutionOutlined className="text-sm" />
                            </div>
                            <span className="font-extrabold text-slate-800 text-sm">Dr. {appt.doctor}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-xs">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                              <CalendarOutlined className="w-3 h-3" />
                            </div>
                            <span className="font-bold">{dayjs(appt.date).format("DD MMM YYYY")}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-xs">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                              <ClockCircleOutlined className="w-3 h-3" />
                            </div>
                            <span className="font-bold">{appt.startTime}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                              <TagsFilled className="w-3 h-3" />
                            </div>
                            <span className="font-bold">{appt.category}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                            appt.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                            appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                      {/* Reschedule History */}
                      {appt.reschedules?.length > 0 && (
                        <tr className="bg-slate-50/30 border-b border-slate-100/50">
                          <td colSpan={5} className="p-4 pl-16">
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reschedule History</span>
                              <div className="flex flex-col gap-2">
                                {appt.reschedules.map((r) => (
                                  <div key={r._id} className="relative pl-4 border-l-2 border-slate-200 py-0.5">
                                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                    <p className="text-xs text-slate-600">
                                      Moved to <span className="text-slate-800 font-bold">{dayjs(r.newDate).format("DD MMM YYYY")} at {r.newTime}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">Reason: {r.reason || "Not specified"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PatientAppointments;
