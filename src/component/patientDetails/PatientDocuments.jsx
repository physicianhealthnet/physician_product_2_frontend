import { Icon } from "@iconify/react";
import { message } from "antd";
import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { useParams } from "react-router-dom";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { CardSkeleton } from "../ui/Skeleton";
import FileViewerModal from "../scan/FileViewerModal";
import formatDateToDDMMYYYY from "../../utilities/formatter";

function PatientDocuments({ documents, swaper, topics, title, readOnly }) {
  const { patient_id } = useParams();
  const [docUploaderOpener, setDocUploaderOpener] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState(null);
  const [formData, setFormData] = useState({
    topic: "",
    documentName: "",
    documentFile: null,
  });
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        documentFile: file,
      }));
    }
  };
  const getPatientDocuments = async () => {
    try {
      setInitialLoading(true);
      // We first need patient PHN_ID for some routes (scan and lab use PHN_ID in some parts, but here we can try patient_id, or fetch patient info if needed)
      let pId = patient_id;
      try {
         const pRes = await AxiosInstance.get(`/patient/get-by-id/${patient_id}`);
         if (pRes?.data?.patient?.PHN_ID) {
           pId = pRes.data.patient.PHN_ID;
         }
      } catch (err) {}

      const [response, scanRes, labRes, presRes] = await Promise.all([
        AxiosInstance.get(`/patientdocuments/get-by-patient-id/${patient_id}`).catch(()=>({data:{documents:[]}})),
        AxiosInstance.get(`/scan-prescription/by-patient/${pId}`).catch(()=>({data:{data:[]}})),
        AxiosInstance.get(`/lab-prescription/by-patient/${pId}`).catch(()=>({data:{data:[]}})),
        AxiosInstance.get(`/prescription/patient/${patient_id}`).catch(()=>({data:[]}))
      ]);
      
      const rawNormalDocs = response?.data?.documents || [];
      const normalDocs = rawNormalDocs.map(d => {
        let p = d.documentPath || "";
        p = p.replace("https://demo.physicianhealthnet.com/api", AxiosInstance.defaults.baseURL);
        return {
          ...d,
          documentPath: p.startsWith('http') ? p : (p ? `${AxiosInstance.defaults.baseURL}${p}` : '')
        };
      });
      const rawScanData = scanRes?.data?.data || scanRes?.data || [];
      const scanDocs = (Array.isArray(rawScanData) ? rawScanData : []).map(d => {
        let p = d.finalReportFileUrl || "";
        if (p) p = p.replace(/^\/upload\//, '/uploads/');
        return {
          _id: d._id,
          documentName: `Scan Order: ${d.scanType}`,
          documentPath: p.startsWith('http') ? p : (p ? `${AxiosInstance.defaults.baseURL}${p}` : ''),
          type: 'Scan',
          status: d.status,
          raw: d
        };
      });

      const rawLabData = labRes?.data?.data || labRes?.data || [];
      const labDocs = (Array.isArray(rawLabData) ? rawLabData : []).map(d => {
        let p = d.finalReportFileUrl || "";
        if (p) p = p.replace(/^\/upload\//, '/uploads/');
        return {
          _id: d._id,
          documentName: `Lab Order: ${d.labType}`,
          documentPath: p.startsWith('http') ? p : (p ? `${AxiosInstance.defaults.baseURL}${p}` : ''),
          type: 'Lab',
          status: d.status,
          raw: d
        };
      });

      const rawPresData = presRes?.data?.data || presRes?.data || [];
      const prescriptionDocs = (Array.isArray(rawPresData) ? rawPresData : []).map(d => {
        // Find if there is a pdfUrl or prescriptionFileUrl
        let p = d.prescriptionFileUrl || d.pdfUrl || "";
        if (p) p = p.replace(/^\/upload\//, '/uploads/');
        return {
          _id: d._id,
          documentName: `Prescription`,
          documentPath: p.startsWith('http') ? p : (p ? `${AxiosInstance.defaults.baseURL}${p}` : ''),
          type: 'Prescription',
          status: 'Completed',
          raw: d
        };
      });

      setPatientDocuments([...normalDocs, ...scanDocs, ...labDocs, ...prescriptionDocs]);
    } catch (error) {
      console.error("Error fetching patient documents:", error);
      message.error("Failed to fetch patient documents");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.documentFile || !formData.documentName) {
      message.error("Please fill all fields.");
      return;
    }

    const user = JSON.parse(sessionStorage.getItem("user") || sessionStorage.getItem("master") || "{}");
    const doctorId = user._id || "";
    const doctorName = user.userName || "Unknown Doctor";

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      const finalDocumentName = formData.topic ? `[${formData.topic}] ${formData.documentName}` : formData.documentName;
      formDataToSend.append("documentName", finalDocumentName);
      formDataToSend.append("documentFile", formData.documentFile);
      formDataToSend.append("patientId", patient_id);
      formDataToSend.append("doctorId", doctorId);
      formDataToSend.append("doctorName", doctorName);
      await AxiosInstance.post("/patientdocuments/create", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      message.success("Document uploaded successfully");
      setFormData({ topic: "", documentName: "", documentFile: null });
      setDocUploaderOpener(false);
      getPatientDocuments();
    } catch (error) {
      message.error("Error uploading document");
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (data) => {
    try {
      await AxiosInstance.delete(`/patientdocuments/delete/${data._id}`);
      message.success("Document deleted successfully");
      getPatientDocuments();
    } catch (error) {
      message.error("Failed to delete document");
      console.error(error);
    }
  };

  useEffect(() => {
    if (!swaper) {
      getPatientDocuments();
    } else {
      setPatientDocuments(documents);
      setInitialLoading(false);
    }
  }, [patient_id, documents, swaper]);

  // Categorize documents
  const categorizedDocs = {
    Prescription: [],
    "CT-Scan": [],
    MRI: [],
    "X-Ray": [],
    "Lab Report": [],
    Other: []
  };

  (patientDocuments || []).forEach(doc => {
    const name = (doc.documentName || "").toLowerCase();
    const type = (doc.type || "").toLowerCase();
    const scanType = (doc.raw?.scanType || "").toLowerCase();
    
    if (type === 'prescription' || name.includes('prescription')) {
      categorizedDocs.Prescription.push(doc);
    } else if (scanType === 'ct-scan' || name.includes('ct-scan')) {
      categorizedDocs["CT-Scan"].push(doc);
    } else if (scanType === 'mri' || name.includes('mri')) {
      categorizedDocs.MRI.push(doc);
    } else if (scanType === 'x-ray' || name.includes('x-ray')) {
      categorizedDocs["X-Ray"].push(doc);
    } else if (type === 'lab' || name.includes('lab')) {
      categorizedDocs["Lab Report"].push(doc);
    } else {
      categorizedDocs.Other.push(doc);
    }
  });

  return (
    <div className="space-y-6">
      {!swaper && !readOnly && (
        <div className="flex justify-end">
          <Button
            variant={docUploaderOpener ? "ghost" : "primary"}
            onClick={() => setDocUploaderOpener((p) => !p)}
            className="flex items-center gap-2"
          >
            <Icon
              icon={
                docUploaderOpener
                  ? "solar:close-circle-bold"
                  : "solar:add-circle-bold"
              }
              width="20"
              height="20"
            />
            {docUploaderOpener ? "Cancel Upload" : "Add Report"}
          </Button>
        </div>
      )}

      {docUploaderOpener ? (
        <Card
          title={title || "Upload Lab Report"}
          className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {topics && topics.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  Medical History Topic
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleOnChange}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="" disabled>Select a topic...</option>
                  {topics.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            
            <Input
              label={topics && topics.length > 0 ? "Document Title" : "Document Name"}
              name="documentName"
              value={formData.documentName}
              onChange={handleOnChange}
              placeholder="e.g. X-Ray Report, Blood Test"
              required
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 ">
                File Upload
              </label>
              <div className="relative border-2 border-dashed border-slate-300  rounded-lg p-6 hover:bg-slate-50 :bg-slate-800/50 transition-colors text-center cursor-pointer group">
                <input
                  type="file"
                  name="documentFile"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.dcm,.dicom"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500  group-hover:text-blue-500 :text-blue-400">
                  <Icon icon="solar:upload-bold-duotone" width={32} />
                  {formData.documentFile ? (
                    <span className="font-medium text-slate-900  truncate max-w-[200px]">
                      {formData.documentFile.name}
                    </span>
                  ) : (
                    <span className="text-sm">
                      Click to select or drag file here
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="mt-2"
            >
              Upload Document
            </Button>
          </form>
        </Card>
      ) : initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {patientDocuments?.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(categorizedDocs).map(([category, docs]) => {
                if (docs.length === 0) return null;
                return (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                      <Icon icon={category === "Prescription" ? "solar:pill-bold-duotone" : category === "Lab Report" ? "solar:test-tube-bold-duotone" : category === "Other" ? "solar:file-bold-duotone" : "solar:scanner-bold-duotone"} className="text-blue-500 text-lg" />
                      <h4 className="text-md font-bold text-slate-700 m-0">
                        {category} {category !== "Other" && category !== "Prescription" ? "Reports" : "Documents"}
                      </h4>
                      <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {docs.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-white border-b border-slate-100">
                          <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Document Name</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Prescribed By</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                            <th scope="col" className="px-4 py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {docs.map((doc, index) => {
                            const dName = doc.raw?.doctorName || doc.raw?.drName || doc.doctorName || "Unknown Doctor";
                            const dateStr = doc.raw?.createdAt || doc.raw?.date || doc.raw?.updatedAt || doc.createdAt || doc.updatedAt;
                            const dDate = dateStr ? new Date(dateStr).toLocaleDateString() : "-";
                            return (
                              <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  {doc.documentName}
                                  {doc.type && <span className="block text-xs text-slate-400 font-normal mt-0.5">{doc.type}</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {dName !== "Unknown Doctor" ? (
                                    <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 w-fit">
                                      <Icon icon="solar:user-md-bold-duotone" />
                                      Dr. {dName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                  {dDate}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`text-[11px] font-bold px-2 py-1 rounded-md border ${doc.status === 'Completed' || doc.type === 'Prescription' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {doc.status || "Completed"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    {doc.documentPath ? (
                                      <button
                                        onClick={() => setViewerFileUrl(doc.documentPath)}
                                        className="text-[11px] font-bold text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-sm"
                                      >
                                        <Icon icon="solar:eye-bold-duotone" /> View
                                      </button>
                                    ) : (
                                      <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded flex items-center gap-1">
                                        <Icon icon="solar:close-circle-bold-duotone" /> No File
                                      </span>
                                    )}
                                    {!swaper && !readOnly && !doc.type && (
                                      <button
                                        onClick={() => handleDelete(doc)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200  rounded-2xl bg-slate-50/50 ">
              <div className="bg-white  p-4 rounded-full shadow-sm mb-3">
                <Icon
                  icon="solar:folder-with-files-bold-duotone"
                  className="text-slate-300 "
                  width={48}
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 ">
                No Reports Found
              </h3>
              <p className="text-slate-500  max-w-xs mx-auto text-sm mt-1">
                Upload lab reports, X-rays, or other documents to keep track of
                patient history.
              </p>
              {!swaper && !readOnly && (
                <Button
                  variant="primary"
                  onClick={() => setDocUploaderOpener(true)}
                  className="mt-4"
                >
                  Upload First Report
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {viewerFileUrl && (
        <FileViewerModal 
          fileUrl={viewerFileUrl} 
          onClose={() => setViewerFileUrl(null)} 
        />
      )}
    </div>
  );
}
export default PatientDocuments;
