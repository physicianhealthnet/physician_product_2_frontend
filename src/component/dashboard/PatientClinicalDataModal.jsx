import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import dayjs from "dayjs";

const PatientClinicalDataModal = ({ isOpen, onClose, patientId, dataType, type, filterDate }) => {
  const actualType = dataType || type;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !patientId || !actualType) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = "";
        if (actualType === "prescription") {
          endpoint = `/prescription/patient/${patientId}`;
        } else if (actualType === "lab") {
          endpoint = `/lab-prescription/by-patient/${patientId}`;
        } else if (["scan", "xray", "ctscan", "mri"].includes(actualType)) {
          endpoint = `/scan-prescription/by-patient/${patientId}`;
        }

        const res = await AxiosInstance.get(endpoint);
        const fetchedData = res.data?.data || res.data || [];
        // Ensure data is array
        let parsedData = Array.isArray(fetchedData) ? fetchedData : [fetchedData];
        
        // Filter scan records if a specific type was requested
        if (actualType === "xray") {
          parsedData = parsedData.filter(d => d.scanType && d.scanType.toLowerCase().includes('x-ray'));
        } else if (actualType === "ctscan") {
          parsedData = parsedData.filter(d => d.scanType && d.scanType.toLowerCase().includes('ct'));
        } else if (actualType === "mri") {
          parsedData = parsedData.filter(d => d.scanType && d.scanType.toLowerCase().includes('mri'));
        }

        // Apply date filter if requested from the Last Visit Table
        if (filterDate && filterDate !== "-") {
          parsedData = parsedData.filter(d => dayjs(d.createdAt).format("YYYY-MM-DD") === filterDate);
        }

        setData(parsedData);
      } catch (err) {
        console.error(`Error fetching ${actualType} data:`, err);
        setError(`Failed to load ${actualType} data.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, patientId, actualType, filterDate]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Icon icon="solar:spinner-linear" className="animate-spin text-blue-500 text-4xl mb-4" />
          <span className="text-slate-500 font-medium">Loading records...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-rose-500">
          <Icon icon="solar:danger-triangle-bold-duotone" className="text-4xl mb-4" />
          <span className="font-bold">{error}</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Icon icon="solar:folder-with-files-minimalistic-bold-duotone" className="text-6xl mb-4 opacity-50" />
          <span className="font-medium text-lg">No records found</span>
        </div>
      );
    }

    // Prescription View
    if (actualType === "prescription") {
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Primary Doctor</th>
                <th className="py-3 px-4">Primary Complaint</th>
                <th className="py-3 px-4 min-w-[200px]">Medications</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((rx, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    {rx.doctorName || rx.drName || "N/A"}
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {rx.primaryComplaint || "-"}
                  </td>
                  <td className="py-4 px-4">
                    {rx.medicinesData && rx.medicinesData.length > 0 ? (
                      <div className="space-y-1.5">
                        {rx.medicinesData.map((med, mIdx) => (
                          <div key={mIdx} className="bg-slate-50 p-1.5 rounded text-xs border border-slate-100 flex justify-between items-center gap-2">
                            <span className="font-bold text-slate-800">{med.medicationName || med.medication}</span>
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                              {med.dosage} • {med.days ? `${med.days} Days` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">No medications listed</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full whitespace-nowrap ${rx.dispenseStatus === 'Fully Dispensed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rx.dispenseStatus || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Lab or Scan View
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black tracking-wider">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Center</th>
              <th className="py-3 px-4">Primary Doctor</th>
              <th className="py-3 px-4">Primary Complaint</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((record, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 font-medium text-slate-700">
                  <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs">
                    {record.labType || record.scanType || "N/A"}
                  </span>
                </td>
                <td className="py-3 px-4 capitalize">
                  {record.labCenter || record.scanCenter || "Internal"}
                </td>
                <td className="py-3 px-4">
                  {record.drName || record.doctorName || "N/A"}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {record.primaryComplaint || "-"}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${record.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {record.status || "Pending"}
                  </span>
                </td>
                <td className="py-3 px-4 flex justify-center">
                  {record.finalReportFileUrl ? (
                    <a 
                      href={getFullFileUrl(record.finalReportFileUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Icon icon="solar:document-text-bold-duotone" className="text-sm" />
                      View Report
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Not Available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getTitle = () => {
    if (actualType === "prescription") return "Prescription History";
    if (actualType === "lab") return "Lab Reports";
    if (actualType === "scan") return "Scan Reports";
    if (actualType === "xray") return "X-Ray Reports";
    if (actualType === "ctscan") return "CT-Scan Reports";
    if (actualType === "mri") return "MRI Reports";
    return "Clinical Data";
  };

  const getFullFileUrl = (url) => {
    if (!url) return "";
    let cleanUrl = url.replace(/^\/upload\//, "/uploads/");
    if (cleanUrl.startsWith("http")) return cleanUrl;
    // Base URL is typically the primary backend serving these files
    return `https://demo.physicianhealthnet.com/api${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800">{getTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <Icon icon="solar:close-circle-bold" className="text-2xl" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {renderContent()}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PatientClinicalDataModal;
