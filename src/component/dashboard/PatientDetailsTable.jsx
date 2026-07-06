import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import PatientClinicalDataModal from "./PatientClinicalDataModal";

const PAGE_SIZE = 5;

const PatientDetailsTable = ({ todayAppointments = [], futureAppointments = [] }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [patientDetails, setPatientDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, patientId: null });
  const [expandedRow, setExpandedRow] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const clinicId = user?.clinicId;

  // Fetch all patients on mount
  useEffect(() => {
    const fetchAllPatients = async () => {
      setLoading(true);
      const route1 = `/patient/get-all-by-clinic/${clinicId}`;
      const route2 = "/patient/get-all";
      try {
        const response = await AxiosInstance.get(clinicId ? route1 : route2);
        setData(response.data.patients || []);
      } catch (error) {
        console.error("Error fetching all patients:", error);
      }
      setLoading(false);
    };

    fetchAllPatients();
  }, [clinicId]);

  // Sort data so today's and future appointments appear first
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const priorityAptMap = new Map();
    todayAppointments.forEach(a => {
      priorityAptMap.set(a.patientId, { ...a, priority: 1 }); // Priority 1 for today
    });
    futureAppointments.forEach(a => {
      if (!priorityAptMap.has(a.patientId)) {
        priorityAptMap.set(a.patientId, { ...a, priority: 2 }); // Priority 2 for future
      }
    });

    return [...data].sort((a, b) => {
      const aPriority = priorityAptMap.has(a.patientId) ? priorityAptMap.get(a.patientId).priority : 99;
      const bPriority = priorityAptMap.has(b.patientId) ? priorityAptMap.get(b.patientId).priority : 99;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Newest registrations first
    });
  }, [data, todayAppointments, futureAppointments]);

  // Pagination calculations
  const total = sortedData.length;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const currentRows = useMemo(() => {
    return sortedData.slice(startIdx, startIdx + PAGE_SIZE);
  }, [sortedData, startIdx]);

  const currentIdsList = useMemo(() => {
    return currentRows.map(p => p.patientId).join(",");
  }, [currentRows]);

  // Fetch detailed info for current page patients
  useEffect(() => {
    const fetchDetails = async () => {
      if (!currentIdsList) return;
      setLoadingDetails(true);
      try {
        const res = await AxiosInstance.get(`/business-tool/dashboard-patient-list?patientIds=${currentIdsList}`);
        if (res.data && res.data.data) {
          setPatientDetails(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error("Failed to fetch patient detailed list", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [currentIdsList]);

  if (loading && data.length === 0) {
    return (
      <div className="mt-8 bg-white/70 backdrop-blur-3xl border border-slate-200 shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center">
        <Icon icon="solar:spinner-linear" className="animate-spin text-blue-500 text-3xl mb-4" />
        <span className="text-sm font-bold text-slate-500">Loading all patients...</span>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white/70 backdrop-blur-3xl border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 shrink-0">
        <h2 className="text-xl font-black text-slate-800">
          Patient Details <span className="text-blue-500">List</span>
        </h2>
        {loadingDetails && (
          <div className="flex items-center gap-2 text-blue-500">
            <Icon icon="solar:spinner-linear" className="animate-spin text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading details...</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-100">
              <th className="p-4 pl-6 w-16 text-center">#</th>
              <th className="p-4">Name</th>
              <th className="p-4">Gender</th>
              <th className="p-4">Age</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Primary Doctor</th>
              <th className="p-4">Primary Complaint</th>
              <th className="p-4 text-center">Ongoing Treatment</th>
              <th className="p-4">Appointment Date</th>
              <th className="p-4">Last Visit Date</th>

            </tr>
          </thead>
          <tbody>
            {currentRows.length > 0 ? currentRows.map((patient, index) => {
              const detailsObj = patientDetails[patient.patientId] || {};
              const detail = detailsObj.patientDetails || {};
              const todayApt = todayAppointments.find(a => a.patientId === patient.patientId);
              const futureApt = futureAppointments.find(a => a.patientId === patient.patientId);
              const priorityApt = todayApt || futureApt;

              return (
                <React.Fragment key={patient.patientId || index}>
                  <tr
                    onClick={() => setExpandedRow(expandedRow === patient.patientId ? null : patient.patientId)}
                    className={`hover:bg-slate-50/80 border-b border-slate-100/50 transition-colors duration-200 cursor-pointer ${expandedRow === patient.patientId ? "bg-slate-50/80" : ""}`}
                  >
                    <td className="p-4 pl-6 text-center text-slate-500 font-medium relative">
                      <div className="flex items-center justify-center gap-2">
                        <Icon 
                          icon={expandedRow === patient.patientId ? "solar:alt-arrow-down-bold" : "solar:alt-arrow-right-bold"} 
                          className="text-primary-500 transition-transform"
                        />
                        <span>{startIdx + index + 1}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {patient.photo ? (
                            <img src={patient.photo} alt={patient.patientName} className="w-full h-full object-cover" />
                          ) : (
                            <Icon icon="solar:user-bold" className="text-slate-300 text-xs" />
                          )}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{patient.patientName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 capitalize">{patient.patientGender || "-"}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{patient.patientAge || "-"}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{patient.patientPhone || "-"}</td>
                    <td className="p-4 text-sm font-bold text-blue-600">-</td>
                    <td className="p-4 text-sm font-medium text-slate-600 max-w-[150px] truncate" title={detail.primaryComplaint}>
                      {detail.primaryComplaint || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assessment/${patient.patientId}`);
                        }}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-blue-700 transition-colors shadow-sm active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <span>Ongoing Treatment</span>
                        <Icon icon="solar:alt-arrow-right-bold" />
                      </button>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Icon icon="solar:calendar-mark-bold-duotone" className={priorityApt ? (todayApt ? "text-primary-500" : "text-purple-500") : "text-slate-400"} />
                        {priorityApt ? (
                          <span className="font-bold text-slate-800">
                            {priorityApt.date ? new Date(priorityApt.date).toLocaleDateString() : (todayApt ? new Date().toLocaleDateString() : "")} {priorityApt.time ? `| ${priorityApt.time}` : ""}
                          </span>
                        ) : "-"}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {detail.visitedDate ? new Date(detail.visitedDate).toLocaleDateString() : (patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "-")}
                    </td>
                  </tr>
                  
                  {/* Expanded Colab Content */}
                  {expandedRow === patient.patientId && (
                    <tr className="bg-slate-50/50 border-b border-slate-200 shadow-inner">
                      <td colSpan={10} className="p-0 whitespace-normal max-w-0">
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* General Info */}
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Additional Info</h4>
                              <div className="flex flex-col gap-3 mt-auto">
                                <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:hashtag-bold-duotone" className="text-blue-500 text-lg shrink-0" />
                                  <span className="text-slate-500">Patient ID:</span>
                                  <span className="font-bold text-slate-800 ml-auto bg-slate-200 px-2 rounded">{patient.patientId}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:map-point-bold-duotone" className="text-blue-500 text-lg shrink-0" />
                                  <span className="text-slate-500">Location:</span>
                                  <span className="font-bold text-slate-800 ml-auto">{patient.location || "-"}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Attender Details */}
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Attender Details</h4>
                              <div className="flex flex-col gap-3 text-sm mt-auto">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:user-rounded-bold-duotone" className="text-amber-500 text-lg shrink-0" />
                                  <span className="text-slate-500">Attender Name:</span>
                                  <span className="font-bold text-slate-800 ml-auto truncate">{detail.attenderName || patient.guardianName || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:phone-bold-duotone" className="text-amber-500 text-lg shrink-0" />
                                  <span className="text-slate-500">Phone No:</span>
                                  <span className="font-bold text-slate-800 ml-auto">{detail.attenderPhone || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-amber-500 text-lg shrink-0" />
                                  <span className="text-slate-500">Relationship:</span>
                                  <span className="font-bold text-slate-800 ml-auto capitalize">{detail.attenderRelationship || "-"}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Clinical Reports */}
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Clinical Reports</h4>
                              <div className="flex flex-col gap-3 mt-auto">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:document-medicine-bold-duotone" className="text-blue-500 text-lg shrink-0" />
                                  <span className="text-slate-500 text-sm font-medium">Prescriptions:</span>
                                  <button onClick={() => setModalConfig({ isOpen: true, type: 'prescription', patientId: patient.patientId })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-md text-xs hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95 ml-auto font-black uppercase tracking-wider">
                                    {detail.prescriptionsCount > 0 ? `View (${detail.prescriptionsCount})` : "View"}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:test-tube-bold-duotone" className="text-rose-500 text-lg shrink-0" />
                                  <span className="text-slate-500 text-sm font-medium">Lab Reports:</span>
                                  <button onClick={() => setModalConfig({ isOpen: true, type: 'lab', patientId: patient.patientId })} className="bg-white border border-rose-200 text-rose-600 px-3 py-1.5 rounded-md text-xs hover:bg-rose-600 hover:text-white transition-colors shadow-sm active:scale-95 ml-auto font-black uppercase tracking-wider">
                                    {detail.labReportsCount > 0 ? `View (${detail.labReportsCount})` : "View"}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                  <Icon icon="solar:scanner-bold-duotone" className="text-purple-500 text-lg shrink-0" />
                                  <span className="text-slate-500 text-sm font-medium">Scan Reports:</span>
                                  <button onClick={() => setModalConfig({ isOpen: true, type: 'scan', patientId: patient.patientId })} className="bg-white border border-purple-200 text-purple-600 px-3 py-1.5 rounded-md text-xs hover:bg-purple-600 hover:text-white transition-colors shadow-sm active:scale-95 ml-auto font-black uppercase tracking-wider">
                                    {detail.scanReportsCount > 0 ? `View (${detail.scanReportsCount})` : "View"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {total > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Showing {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon icon="solar:alt-arrow-left-bold" />
            </button>
            <span className="w-8 h-8 flex items-center justify-center rounded bg-blue-500 text-white font-bold text-sm">
              {currentPage}
            </span>
            <button 
              disabled={currentPage >= Math.ceil(total / PAGE_SIZE)}
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(total / PAGE_SIZE), prev + 1))}
              className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
            <Icon icon="solar:alt-arrow-right-outline" className="text-xl" />
          </button>
        </div>
      </div>
      )}

      <PatientClinicalDataModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, patientId: null })}
        patientId={modalConfig.patientId}
        dataType={modalConfig.type}
      />
    </div>
  );
};

export default PatientDetailsTable;
