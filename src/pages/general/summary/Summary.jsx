import Page1 from "./session1/Page1";
import Page2 from "./session1/Page2";
import Page3 from "./session2/Page3";
import Page4 from "./session2/Page4";
import Page5 from "./session3/Page5";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef, useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { message, Spin, Collapse } from "antd";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { useParams } from "react-router-dom";
import Page6 from "./session3/Page6";
import PatientMedicalDetails from "../../../component/patientDetails/PatientMedicalDetails";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import PhysicianAssessmentView from "../assessment/PhysicianAssessmentView";
import PatientTimeline from "./PatientTimeline";

function Summary() {
  const page1Ref = useRef();
  const page2Ref = useRef();
  const page3Ref = useRef();
  const page4Ref = useRef();
  const page5Ref = useRef();
  const { patient_id } = useParams();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [patientMinimalData, setPatientMinimalData] = useState({});
  const [patientMedicalData, setPatientMedicalData] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [treatmentTracker, setTreatmentTracker] = useState([]);
  const [exerciseSummary, setExerciseSummary] = useState([]);
  const [assessmentData, setAssessmentData] = useState({});
  const [prescriptions, setPrescriptions] = useState([]);
  const [labDocs, setLabDocs] = useState([]);
  const [scanDocs, setScanDocs] = useState([]);
  const [bills, setBills] = useState([]);
  
  const [activeAccordionKeys, setActiveAccordionKeys] = useState([
    "patient_details", "doctors", "diagnosis", "reports", "treatment"
  ]);

  const handledDoctors = useMemo(() => {
    const doctors = new Set();
    allNotes.forEach((note) => {
      if (note.sessionDocName) doctors.add(note.sessionDocName);
    });
    treatmentTracker.forEach((track) => {
      if (track.treatedBy) doctors.add(track.treatedBy);
    });
    prescriptions.forEach((p) => {
      if (p.doctorName) doctors.add(p.doctorName);
    });
    return Array.from(doctors);
  }, [allNotes, treatmentTracker, prescriptions]);

  const getPatientMedicalDetails = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patientregistration/get-by-patient/${patient_id}`
      );
      setPatientMedicalData(response?.data?.patient);
    } catch (error) {
      console.error(error);
    }
  };
  const getPatientMinimalData = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patient/get-by-id/${patient_id}`
      );
      setPatientMinimalData(response.data.patient);
      return response.data.patient;
    } catch (error) {
      console.error(error);
      return null;
    }
  };
  const handleGetNotes = async () => {
    try {
      const response = await AxiosInstance.get(
        `/session-notes/get-patient/${patient_id}`
      );
      setAllNotes(response?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };
  async function fetchTreatmentTracker() {
    try {
      const { data } = await AxiosInstance.get(
        `/treatment-tracker/get-patient/${patient_id}`
      );
      setTreatmentTracker(data?.data || []);
    } catch (error) {
      console.error(error);
    }
  }
  async function fetchExerciseSummary() {
    try {
      const { data } = await AxiosInstance.get(`/exercise/get/1/${patient_id}`);
      setExerciseSummary(data?.data || []);
    } catch (error) {
      console.error(error);
    }
  }
  const getAssessmentData = async () => {
    try {
      const response = await AxiosInstance.get(`/assessment/get/${patient_id}`);

      setAssessmentData(response?.data?.data || {});
    } catch (error) {
      console.error(error);
    }
  };

  const getTimelineData = async (phnId) => {
    try {
      const pRes = await AxiosInstance.get(`/prescription/patient/${patient_id}`).catch(() => ({ data: { data: [] } }));
      setPrescriptions(pRes?.data?.data || []);
      
      const bRes = await AxiosInstance.get(`/treatment-bill/get-patient/${patient_id}`).catch(() => ({ data: { data: [] } }));
      setBills(bRes?.data?.data || []);
      
      if (phnId) {
        const [scanRes, labRes] = await Promise.all([
          AxiosInstance.get(`/scan-prescription/by-patient/${phnId}`).catch(() => ({ data: { data: [] } })),
          AxiosInstance.get(`/lab-prescription/by-patient/${phnId}`).catch(() => ({ data: { data: [] } })),
        ]);
        setScanDocs(scanRes?.data?.data || []);
        setLabDocs(labRes?.data?.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const downloadPDF = async () => {
    setLoading(true);
    setProgress(0);

    // Expand all accordions temporarily to allow html2canvas to capture them
    const previousKeys = activeAccordionKeys;
    setActiveAccordionKeys(["patient_details", "doctors", "diagnosis", "reports", "treatment"]);

    // Give DOM time to expand before rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // Top/bottom margin
      const maxHeight = pdfHeight - 2 * margin;

      const components = [page1Ref, page2Ref, page3Ref, page4Ref, page5Ref];

      for (let i = 0; i < components.length; i++) {
        const ref = components[i]?.current;
        if (!ref) continue;

        const canvas = await html2canvas(ref, {
          scale: 1,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            // Force light mode in the cloned document for PDF generation
            clonedDoc.documentElement.classList.remove("dark");
            const element = clonedDoc.body.querySelector(
              `[data-html2canvas-ignore="true"]`
            );
            if (element) {
              element.style.display = "none";
            }
          },
        });

        const imgData = canvas.toDataURL("image/png");

        // Calculate dimensions to fit within page width, preserving aspect ratio
        let imgWidth = pdfWidth - 2 * margin;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If height exceeds max, scale down proportionally
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        // Add page for each component (skip for first)
        if (i > 0) {
          pdf.addPage();
        }

        // Add centered image
        const x = (pdfWidth - imgWidth) / 2;
        const y = margin;
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

        // Update progress percentage
        setProgress(Math.round(((i + 1) / components.length) * 100));
      }

      pdf.save("AssessmentSummary.pdf");

      message.success({
        content: "PDF downloaded successfully!",
        duration: 2,
        style: { marginTop: "20vh" },
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      message.error("Failed to download PDF. Please try again.");
    } finally {
      setActiveAccordionKeys(previousKeys);
      setLoading(false);
    }
  };

  useEffect(() => {
    getPatientMinimalData().then((data) => {
      if (data?.PHN_ID) {
        getTimelineData(data.PHN_ID);
      } else {
        getTimelineData(null);
      }
    });
    getPatientMedicalDetails();
    handleGetNotes();
    fetchTreatmentTracker();
    fetchExerciseSummary();
    getAssessmentData();
  }, []);

  return (
    <Card className="min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Spin size="large" className="text-white" />
          <h2 className="text-white text-2xl font-semibold mt-6">
            Generating PDF... {progress}%
          </h2>
          <p className="text-slate-300 mt-2 max-w-md text-center">
            This may take a few moments. Please do not close or navigate away from this page.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-100  pb-4">
        <h1 className="font-bold text-slate-800  text-2xl m-0 flex items-center gap-2">
          <Icon icon="solar:document-text-bold-duotone" className="text-blue-500" />
          Treatment & Patient Summary
        </h1>
        <Button
          variant="primary"
          disabled={loading}
          onClick={() => downloadPDF()}
          className="flex items-center gap-2"
        >
          <Icon icon="solar:printer-bold" width={20} />
          Print / Download PDF
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        <Collapse
          activeKey={activeAccordionKeys}
          onChange={(keys) => setActiveAccordionKeys(keys)}
          className="bg-transparent border-none"
          items={[
            {
              key: "patient_details",
              label: (
                <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="solar:user-bold-duotone" className="text-blue-500" />
                  Full Patient Details
                </span>
              ),
              children: (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4">
                  <PatientMedicalDetails
                    page1Ref={page1Ref}
                    patientMedicalData={patientMedicalData}
                    showTitle={false}
                  />
                </div>
              ),
            },
            {
              key: "doctors",
              label: (
                <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="solar:stethoscope-bold-duotone" className="text-emerald-500" />
                  Handled Doctors
                </span>
              ),
              children: (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6">
                  {handledDoctors.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {handledDoctors.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-semibold shadow-sm">
                          <Icon icon="solar:user-id-bold" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 m-0">No doctors recorded yet.</p>
                  )}
                </div>
              ),
            },
            {
              key: "diagnosis",
              label: (
                <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="solar:clipboard-heart-bold-duotone" className="text-rose-500" />
                  Diagnosis & Assessment
                </span>
              ),
              children: (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-6">
                  <Page6 />
                  <PhysicianAssessmentView data={assessmentData} />
                </div>
              ),
            },
            {
              key: "reports",
              label: (
                <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="solar:test-tube-minimalistic-bold-duotone" className="text-purple-500" />
                  Reports, Tests & Timeline
                </span>
              ),
              children: (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4">
                  <PatientTimeline 
                    patientMinimalData={patientMinimalData}
                    assessmentData={assessmentData}
                    prescriptions={prescriptions}
                    labDocs={labDocs}
                    scanDocs={scanDocs}
                    allNotes={allNotes}
                    treatmentTracker={treatmentTracker}
                    exerciseSummary={exerciseSummary}
                    bills={bills}
                  />
                </div>
              ),
            },
            {
              key: "treatment",
              label: (
                <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="solar:heart-pulse-bold-duotone" className="text-orange-500" />
                  Treatment Data
                </span>
              ),
              children: (
                <div className="flex flex-col gap-6 bg-white/40 backdrop-blur-md rounded-2xl p-4">
                  {allNotes?.length !== 0 && (
                    <Page3 page3Ref={page3Ref} allNotes={allNotes} />
                  )}
                  {treatmentTracker?.length !== 0 && (
                    <Page4 page4Ref={page4Ref} treatmentTracker={treatmentTracker} />
                  )}
                  {exerciseSummary?.length !== 0 && (
                    <Page5 page5Ref={page5Ref} exerciseSummary={exerciseSummary} />
                  )}
                  {allNotes?.length === 0 && treatmentTracker?.length === 0 && exerciseSummary?.length === 0 && (
                    <p className="text-slate-500 m-0">No treatment data recorded.</p>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </Card>
  );
}

export default Summary;
