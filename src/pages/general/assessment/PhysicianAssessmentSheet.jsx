import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { useParams } from "react-router-dom";
import formatDateToDDMMYYYY from "../../../utilities/formatter";
import { message, Collapse, Tabs, Modal } from "antd";
import { Icon } from "@iconify/react";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import Input from "../../../component/ui/Input";
import Textarea from "../../../component/ui/Textarea";
import { Skeleton } from "../../../component/ui/Skeleton";
import Prescription from "../prescription/Prescription";
import PrescriptionFormatShow from "../prescription/PrescriptionFormatShow";
import PatientDocuments from "../../../component/patientDetails/PatientDocuments";

export default function PhysicianAssessmentSheet() {
  const { patient_id } = useParams();

  /* ================= PATIENT INFO ================= */
  const [patientInfo, setPatientInfo] = useState({});
  console.log(patientInfo, "data");

  const [scanDocs, setScanDocs] = useState([]);
  const [labDocs, setLabDocs] = useState([]);
  console.log(labDocs,scanDocs,"data.................");
  
  const [prescriptionDocs, setPrescriptionDocs] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [updateId, setUpdateId] = useState("");
  const [loading, setLoading] = useState(true);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [activeReportDoc, setActiveReportDoc] = useState(null);
  const [activeReportTitle, setActiveReportTitle] = useState("");

  const getDocForLabelAndDate = (label, targetDate) => {
    const findDoc = (docs, isScan = false) => {
      let filteredDocs = docs;
      if (isScan) {
        filteredDocs = docs.filter(d => d.raw?.scanType === label || d.scanType === label);
      }
      
      if (targetDate && filteredDocs.length > 0) {
        const docOnDate = filteredDocs.find(d => {
          const rawDoc = d.raw || d;
          const dateStr = rawDoc.createdAt || rawDoc.date || rawDoc.updatedAt;
          if (dateStr) {
             const dDate = new Date(dateStr).toISOString().split('T')[0];
             return dDate === targetDate;
          }
          return false;
        });
        if (docOnDate) return docOnDate.raw || docOnDate;
      }
      
      return filteredDocs[0]?.raw || filteredDocs[0] || docs[docs.length - 1]?.raw || docs[docs.length - 1];
    };

    if (label === "Prescription" && prescriptionDocs.length > 0) {
      return findDoc(prescriptionDocs);
    } else if (label === "Blood Test" && labDocs.length > 0) {
      return findDoc(labDocs);
    } else if (label === "X-Ray" || label === "CT-Scan" || label === "MRI") {
      return findDoc(scanDocs, true);
    }
    return null;
  };

  const isDocReady = (label, targetDate) => {
    const doc = getDocForLabelAndDate(label, targetDate);
    if (!doc) return false;
    if (label === "Prescription") return true; 
    return !!(doc.finalReportFileUrl || doc.finalReportNotes);
  };

  const handleViewReport = (label, targetDate) => {
    const doc = getDocForLabelAndDate(label, targetDate);
    if (doc) {
      setActiveReportDoc(doc);
      setActiveReportTitle(`${label} Report`);
      setReportModalVisible(true);
    } else {
      message.info(`${label} report not available yet.`);
    }
  };

  const user = JSON.parse(
    sessionStorage.getItem("user") || sessionStorage.getItem("master") || "{}",
  );
  const currentDoctorId = user._id || "";
  const currentDoctorName = user.userName || "Unknown Doctor";
  const currentDoctorDepartment = user.department || "General";

  // Active Assessment Doctor Tab State
  const [activeDoctorTab, setActiveDoctorTab] = useState(currentDoctorName);

  // Physician Assessment States
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState("");

  const [chiefComplaintsList, setChiefComplaintsList] = useState([]);
  const [chiefComplaintName, setChiefComplaintName] = useState("");
  const [chiefComplaintText, setChiefComplaintText] = useState("");
  const [chiefComplaintDate, setChiefComplaintDate] = useState("");
  const [editingChiefComplaintIndex, setEditingChiefComplaintIndex] = useState(null);

  const [historyOfPresentIllnessList, setHistoryOfPresentIllnessList] =
    useState([]);
  const [hpiText, setHpiText] = useState("");
  const [hpiDate, setHpiDate] = useState("");

  const initialVitals = {
    bloodPressure: "",
    bloodPressureCondition: "",
    pulseRate: "",
    pulseRateCondition: "",
    temperature: "",
    temperatureCondition: "",
    respiratoryRate: "",
    respiratoryRateCondition: "",
    spO2: "",
    spO2Condition: "",
    height: "",
    weight: "",
    bmi: "",
    bmiCondition: "",
    bloodSugarFasting: "",
    bloodSugarAfterFood: "",
  };

  const vitalOptions = {
    temperature: [
      "Normal",
      "Afebrile",
      "Fever present",
      "Low-grade fever",
      "High-grade fever",
    ],
    pulseRate: [
      "Regular",
      "Irregular",
      "Tachycardia",
      "Bradycardia",
      "Good volume pulse",
    ],
    respiratoryRate: [
      "Normal breathing",
      "Tachypnea",
      "Bradypnea",
      "Labored breathing",
    ],
    bloodPressure: ["Normotensive", "Hypertensive", "Hypotensive"],
    spO2: [
      "Maintaining saturation in room air",
      "Desaturation present",
      "Oxygen support required",
    ],
    bmi: ["Underweight", "Normal", "Overweight", "Obese"],
  };
  const [currentVitals, setCurrentVitals] = useState(initialVitals);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [bloodSugarMode, setBloodSugarMode] = useState("Fasting");

  const addVitals = () => {
    if (editingIndex !== null) {
      setVitalsHistory((prev) => {
        const updated = [...prev];
        updated[editingIndex] = {
          ...currentVitals,
          date: currentVitals.date || new Date().toLocaleString(),
        };
        return updated;
      });
      setEditingIndex(null);
    } else {
      setVitalsHistory((prev) => [
        ...prev,
        { ...currentVitals, date: new Date().toLocaleString() },
      ]);
    }
    setCurrentVitals(initialVitals);
  };

  const editVitals = (index) => {
    setCurrentVitals(vitalsHistory[index]);
    setEditingIndex(index);
  };

  const removeVitals = (index) => {
    setVitalsHistory((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentVitals(initialVitals);
    }
  };

  const [generalExamination, setGeneralExamination] = useState("");

  const initialSystemicExamination = {
    cvs: "",
    rs: "",
    cns: "",
    pa: "",
  };
  const [systemicExamination, setSystemicExamination] = useState(
    initialSystemicExamination,
  );

  // Diagnosis States
  const [diagnosisText, setDiagnosisText] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split("T")[0]);
  const [diagnosisPrimaryComplaint, setDiagnosisPrimaryComplaint] = useState("");
  const [diagnosisPrimaryComplaintDetails, setDiagnosisPrimaryComplaintDetails] = useState("");
  const [diagnosisPrescriptionGiven, setDiagnosisPrescriptionGiven] = useState("No");
  const [diagnosisBloodTestGiven, setDiagnosisBloodTestGiven] = useState("No");
  const [diagnosisXrayGiven, setDiagnosisXrayGiven] = useState("No");
  const [diagnosisCtScanGiven, setDiagnosisCtScanGiven] = useState("No");
  const [diagnosisMriGiven, setDiagnosisMriGiven] = useState("No");

  // Treatment Plan States
  const [treatmentPlanText, setTreatmentPlanText] = useState("");
  const [treatmentPlanDate, setTreatmentPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [treatmentPlanNextVisitDate, setTreatmentPlanNextVisitDate] = useState("");
  const [treatmentPlanNextVisitFollowUp, setTreatmentPlanNextVisitFollowUp] = useState("");
  const [treatmentPlanPrescriptionGiven, setTreatmentPlanPrescriptionGiven] = useState("No");
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);

  /* ================= MEDICAL HISTORY ================= */
  const medicalHistoryCategories = {
    "General Medical History": [
      "Diabetes",
      "Hypertension (General)",
      "Tuberculosis",
      "Asthma",
      "Allergy history (General)",
      "Surgical history",
      "Currently Taking Medications",
      "Family medical history",
      "Personal habits",
    ],
    "Orthopedic History": [
      "Joint pain",
      "Swelling (Ortho)",
      "Morning stiffness (Ortho)",
      "Trauma/injury history",
      "Fracture history",
      "Difficulty walking",
      "Limb deformity",
      "Muscle wasting",
      "Back pain",
      "Neck pain",
      "Restricted movements",
      "Instability of joints",
      "Clicking sounds",
      "Previous orthopedic surgery",
      "Use of walking aids",
    ],
    "Neurology History": [
      "Headache",
      "Dizziness",
      "Seizures",
      "Weakness",
      "Paralysis",
      "Numbness",
      "Tingling sensation",
      "Loss of consciousness",
      "Memory loss",
      "Tremors",
      "Difficulty speaking",
      "Difficulty swallowing (Neuro)",
      "Gait imbalance",
      "Facial deviation",
      "Sleep disturbances (Neuro)",
    ],
    "Ophthalmology History": [
      "Blurred vision",
      "Eye redness",
      "Eye pain",
      "Watering",
      "Itching (Eye)",
      "Foreign body sensation",
      "Photophobia",
      "Double vision",
      "Vision loss",
      "Night blindness",
      "Previous eye surgery",
      "Spectacle usage",
      "Contact lens usage",
      "Eye trauma history",
    ],
    "ENT History": [
      "Ear pain",
      "Ear discharge",
      "Hearing loss",
      "Tinnitus",
      "Vertigo",
      "Nasal blockage",
      "Sneezing",
      "Epistaxis",
      "Sinus pain",
      "Sore throat",
      "Difficulty swallowing (ENT)",
      "Voice change",
      "Snoring",
    ],
    "Cardiology History": [
      "Chest pain",
      "Palpitations",
      "Breathlessness (Cardiac)",
      "Orthopnea",
      "Pedal edema",
      "Syncope",
      "Hypertension (Cardiac)",
      "Previous MI history",
      "Rheumatic heart disease",
      "Fatigue (Cardiac)",
      "Exercise intolerance",
    ],
    "Respiratory History": [
      "Dry cough",
      "Productive cough",
      "Breathlessness (Respiratory)",
      "Wheezing",
      "Fever",
      "Chest tightness",
      "Hemoptysis",
      "Smoking history",
      "Asthma history",
      "Tuberculosis history",
      "Occupational exposure",
    ],
    "Gastroenterology History": [
      "Abdominal pain",
      "Vomiting",
      "Nausea",
      "Diarrhea",
      "Constipation",
      "Bloating",
      "Loss of appetite (GI)",
      "Weight loss (GI)",
      "Jaundice",
      "Hematemesis",
      "Melena",
      "Acid reflux",
    ],
    "Nephrology / Urology History": [
      "Burning micturition",
      "Increased frequency",
      "Hematuria",
      "Reduced urine output",
      "Flank pain",
      "Urinary incontinence",
      "Renal stone history",
      "Swelling of legs",
      "Dialysis history",
    ],
    "Gynecology History": [
      "Irregular menstruation",
      "Dysmenorrhea",
      "Menorrhagia",
      "Vaginal discharge",
      "Pelvic pain",
      "Infertility",
      "Menopause symptoms",
      "Contraceptive history",
    ],
    "Obstetric History": [
      "Gravida/Para status",
      "Antenatal complications",
      "Previous cesarean section",
      "Miscarriage history",
      "Fetal movement status",
      "Hypertension during pregnancy",
      "Gestational diabetes",
    ],
    "Pediatric History": [
      "Birth history",
      "NICU admission",
      "Vaccination status",
      "Developmental milestones",
      "Feeding history",
      "Recurrent infections",
      "Growth abnormalities",
      "School performance",
    ],
    "Psychiatric History": [
      "Anxiety",
      "Depression",
      "Mood swings",
      "Hallucinations",
      "Delusions",
      "Sleep disturbances (Psych)",
      "Suicidal thoughts",
      "Substance abuse",
      "Behavioral issues",
    ],
    "Dermatology History": [
      "Skin rash",
      "Itching (Skin)",
      "Scaling",
      "Ulcers",
      "Pigmentation",
      "Acne",
      "Hair fall",
      "Nail changes",
      "Allergy history (Skin)",
    ],
    "Endocrinology History": [
      "Diabetes mellitus",
      "Thyroid disorders",
      "Weight gain/loss",
      "Polyuria",
      "Polydipsia",
      "Heat intolerance",
      "Cold intolerance",
      "Hormonal imbalance",
    ],
    "Oncology History": [
      "Weight loss (Onco)",
      "Loss of appetite (Onco)",
      "Lump/swelling",
      "Bleeding history",
      "Fatigue (Onco)",
      "Previous chemotherapy",
      "Radiation history",
      "Family history of cancer",
    ],
    "Rheumatology History": [
      "Joint swelling",
      "Morning stiffness (Rheum)",
      "Autoimmune disorders",
      "Fatigue (Rheum)",
      "Muscle pain",
      "Skin manifestations",
    ],
    "Physiotherapy History": [
      "Functional limitation",
      "Pain assessment",
      "Muscle weakness (Physio)",
      "Balance issues",
      "Gait abnormalities",
      "Mobility restriction",
      "Previous physiotherapy sessions",
    ],
    "Dental History": [
      "Tooth pain",
      "Gum bleeding",
      "Sensitivity",
      "Bad breath",
      "Dental caries",
      "Tooth extraction history",
      "Orthodontic treatment",
    ],
    "Rehabilitation History": [
      "Functional limitation",
      "Pain assessment",
      "Muscle weakness (Physio)",
      "Balance issues",
      "Gait abnormalities",
      "Mobility restriction",
      "Previous physiotherapy sessions",
      "Rehabilitation history",
    ],
  };

  const allMedicalHistory = Object.values(medicalHistoryCategories).flat();

  const initialMedicalChecks = allMedicalHistory.reduce(
    (a, i) => ({ ...a, [i]: false }),
    {},
  );
  const initialMedicalNotes = allMedicalHistory.reduce(
    (a, i) => ({ ...a, [i]: "" }),
    {},
  );

  const [medicalChecks, setMedicalChecks] = useState(initialMedicalChecks);
  const [medicalNotes, setMedicalNotes] = useState(initialMedicalNotes);

  /* ================= TREATMENT ================= */
  const [treatment, setTreatment] = useState({
    diagnosis: [],
    plan: [],
    cost: "",
    followUp: "",
    consent: false,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await AxiosInstance.get(`/patient/get-by-id/${patient_id}`);
        const p = res.data.patient;
        console.log(p, "data");

        setPatientInfo({
          Name: p.patientName,
          Age: p.patientAge,
          Gender: p.patientGender,
          Phone: p.patientPhone,
          Address: p.patientAddress,
          DOB: formatDateToDDMMYYYY(p.patientDOB),
          PHN_ID: p.PHN_ID,
        });
        setClinicId(Array.isArray(p.clinicId) ? p.clinicId[0] : p.clinicId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [patient_id]);

  const getAssessmentData = async () => {
    try {
      const res = await AxiosInstance.get(`/assessment/get/${patient_id}`);
      if (!res.data.data) return;
      const d = res.data.data;

      setMedicalChecks(d.medicalChecks || initialMedicalChecks);
      setMedicalNotes(d.medicalNotes || initialMedicalNotes);
      setChiefComplaints(d.chiefComplaints || "");
      setHistoryOfPresentIllness(d.historyOfPresentIllness || "");
      setChiefComplaintsList(d.chiefComplaintsList || []);
      setHistoryOfPresentIllnessList(d.historyOfPresentIllnessList || []);
      let vitalsData = d.vitals || [];
      console.log(vitalsData,"needed Data");
      
      if (!Array.isArray(vitalsData)) {
        vitalsData = Object.keys(vitalsData).length ? [vitalsData] : [];
      }
      setVitalsHistory(vitalsData);
      setGeneralExamination(d.generalExamination || "");
      setSystemicExamination(
        d.systemicExamination || initialSystemicExamination,
      );

      let diagnosisData = d.treatment?.diagnosis || [];
      if (
        Array.isArray(diagnosisData) &&
        diagnosisData.every((diag) => typeof diag === "string")
      ) {
        const today = new Date().toISOString().split("T")[0];
        diagnosisData = diagnosisData.map((text) => ({ text, date: today }));
      } else if (Array.isArray(diagnosisData)) {
        // Map any missing fields from new schema format for old records
        diagnosisData = diagnosisData.map((diag) => ({
          ...diag,
          primaryComplaint: diag.primaryComplaint || "",
          primaryComplaintDetails: diag.primaryComplaintDetails || "",
          previousMedicalHistory: diag.previousMedicalHistory || "",
          prescriptionGiven: diag.prescriptionGiven || "No",
          bloodTestGiven: diag.bloodTestGiven || "No",
          xrayGiven: diag.xrayGiven || "No",
          ctScanGiven: diag.ctScanGiven || "No",
          mriGiven: diag.mriGiven || "No",
        }));
      }

      let treatmentPlanData = d.treatment?.plan || [];
      if (
        Array.isArray(treatmentPlanData) &&
        treatmentPlanData.every((plan) => typeof plan === "string")
      ) {
        const today = new Date().toISOString().split("T")[0];
        treatmentPlanData = treatmentPlanData.map((text) => ({
          text,
          date: today,
        }));
      } else if (Array.isArray(treatmentPlanData)) {
        treatmentPlanData = treatmentPlanData.map((plan) => ({
          ...plan,
          primaryComplaint: plan.primaryComplaint || "",
          primaryComplaintDetails: plan.primaryComplaintDetails || "",
          previousMedicalHistory: plan.previousMedicalHistory || "",
          diagnosisReport: plan.diagnosisReport || "",
          prescriptionGiven: plan.prescriptionGiven || "No",
          bloodTestGiven: plan.bloodTestGiven || "No",
          xrayGiven: plan.xrayGiven || "No",
          ctScanGiven: plan.ctScanGiven || "No",
          mriGiven: plan.mriGiven || "No",
          nextVisitDate: plan.nextVisitDate || "",
          nextVisitFollowUp: plan.nextVisitFollowUp || "",
        }));
      }

      setTreatment({
        ...d.treatment,
        diagnosis: diagnosisData,
        plan: treatmentPlanData,
      });
      setUpdateId(d._id);
    } catch (err) {
      console.error(err);
    }
  };

  const getDocsData = async () => {
    try {
      const [scanRes, labRes, presRes] = await Promise.all([
        AxiosInstance.get(
          `/scan-prescription/by-patient/${patientInfo.PHN_ID}`,
        ).catch(() => ({ data: { data: [] } })),
        AxiosInstance.get(
          `/lab-prescription/by-patient/${patientInfo.PHN_ID}`,
        ).catch(() => ({ data: { data: [] } })),
        AxiosInstance.get(
          `/prescription/patient/${patient_id}`,
        ).catch(() => ({ data: [] })),
      ]);
      console.log(scanRes, labRes, presRes);

      const scanDocsData = (scanRes?.data?.data || []).map((d) => {
        let p = d.finalReportFileUrl || "";
        if (p) p = p.replace(/^\/upload\//, "/uploads/");
        return {
          _id: d._id,
          documentName: `Scan Order: ${d.scanType}`,
          documentPath: p.startsWith("http")
            ? p
            : p
              ? `${AxiosInstance.defaults.baseURL}${p}`
              : "",
          type: "Scan",
          status: d.status,
          raw: d,
        };
      });
      const labDocsData = (labRes?.data?.data || []).map((d) => {
        let p = d.finalReportFileUrl || "";
        if (p) p = p.replace(/^\/upload\//, "/uploads/");
        return {
          _id: d._id,
          documentName: `Lab Order: ${d.labType}`,
          documentPath: p.startsWith("http")
            ? p
            : p
              ? `${AxiosInstance.defaults.baseURL}${p}`
              : "",
          type: "Lab",
          status: d.status,
          raw: d,
        };
      });
      setScanDocs(scanDocsData);
      setLabDocs(labDocsData);
      const rawPresData = presRes?.data?.data || presRes?.data || [];
      setPrescriptionDocs(Array.isArray(rawPresData) ? rawPresData : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getAssessmentData();
  }, [patient_id]);

  useEffect(() => {
    if (patientInfo?.PHN_ID) {
      getDocsData();
    }
  }, [patientInfo?.PHN_ID]);

  const addDiagnosis = () => {
    if (!diagnosisText.trim() || !diagnosisDate.trim()) {
      message.warning("Diagnosis Date and Report are required.");
      return;
    }
    const previousMedicalHistoryStr = Object.keys(medicalChecks)
      .filter((k) => medicalChecks[k])
      .join(", ");

    setTreatment((prev) => ({
      ...prev,
      diagnosis: [
        ...prev.diagnosis,
        {
          text: diagnosisText.trim(),
          date: diagnosisDate,
          primaryComplaint: chiefComplaintsList.length > 0 ? chiefComplaintsList.map(c => c.text).filter(Boolean).join(", ") : "",
          primaryComplaintDetails: chiefComplaintsList.length > 0 ? chiefComplaintsList.map(c => c.details).filter(Boolean).join(", ") : "",
          previousMedicalHistory: previousMedicalHistoryStr,
          prescriptionGiven: diagnosisPrescriptionGiven,
          bloodTestGiven: diagnosisBloodTestGiven,
          xrayGiven: diagnosisXrayGiven,
          ctScanGiven: diagnosisCtScanGiven,
          mriGiven: diagnosisMriGiven,
          doctorId: currentDoctorId,
          doctorName: currentDoctorName,
        },
      ],
    }));
    setDiagnosisText("");
    setDiagnosisDate(new Date().toISOString().split("T")[0]);
    setDiagnosisPrimaryComplaint("");
    setDiagnosisPrimaryComplaintDetails("");
    setDiagnosisPrescriptionGiven("No");
    setDiagnosisBloodTestGiven("No");
    setDiagnosisXrayGiven("No");
    setDiagnosisCtScanGiven("No");
    setDiagnosisMriGiven("No");
  };

  const removeDiagnosis = (index) => {
    setTreatment((prev) => ({
      ...prev,
      diagnosis: prev.diagnosis.filter((_, i) => i !== index),
    }));
  };

  const addChiefComplaint = (e) => {
    e.preventDefault();
    if (chiefComplaintName.trim() !== "" || chiefComplaintText.trim() !== "") {
      if (editingChiefComplaintIndex !== null) {
        setChiefComplaintsList((prev) => {
          const updated = [...prev];
          updated[editingChiefComplaintIndex] = {
            ...updated[editingChiefComplaintIndex],
            text: chiefComplaintName.trim() || "-",
            details: chiefComplaintText.trim(),
            date: chiefComplaintDate,
          };
          return updated;
        });
        setEditingChiefComplaintIndex(null);
      } else {
        setChiefComplaintsList([
          ...chiefComplaintsList,
          {
            text: chiefComplaintName.trim() || "-",
            details: chiefComplaintText.trim(),
            date: chiefComplaintDate,
            doctorId: currentDoctorId,
            doctorName: currentDoctorName,
          },
        ]);
      }
      setChiefComplaintName("");
      setChiefComplaintText("");
      setChiefComplaintDate("");
    }
  };

  const editChiefComplaint = (index) => {
    const item = chiefComplaintsList[index];
    setChiefComplaintName(item.text !== "-" ? item.text : "");
    setChiefComplaintText(item.details || "");
    setChiefComplaintDate(item.date || "");
    setEditingChiefComplaintIndex(index);
  };

  const removeChiefComplaint = (index) => {
    setChiefComplaintsList((prev) => prev.filter((_, i) => i !== index));
    if (editingChiefComplaintIndex === index) {
      setEditingChiefComplaintIndex(null);
      setChiefComplaintName("");
      setChiefComplaintText("");
      setChiefComplaintDate("");
    }
  };

  const addHpi = (e) => {
    e.preventDefault();
    if (hpiText.trim() !== "") {
      setHistoryOfPresentIllnessList([
        ...historyOfPresentIllnessList,
        {
          text: hpiText.trim(),
          date: hpiDate,
          doctorId: currentDoctorId,
          doctorName: currentDoctorName,
        },
      ]);
      setHpiText("");
      setHpiDate("");
    }
  };

  const removeHpi = (index) => {
    setHistoryOfPresentIllnessList((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  const addTreatmentPlan = () => {
    if (!treatmentPlanText.trim() || !treatmentPlanDate.trim()) {
      message.warning("Treatment Plan Date and Report are required.");
      return;
    }

    const latestDiagnosis = treatment.diagnosis[treatment.diagnosis.length - 1] || {};

    setTreatment((prev) => ({
      ...prev,
      plan: [
        ...prev.plan,
        {
          text: treatmentPlanText.trim(),
          date: treatmentPlanDate,
          primaryComplaint: latestDiagnosis.primaryComplaint || "",
          primaryComplaintDetails: latestDiagnosis.primaryComplaintDetails || "",
          previousMedicalHistory: latestDiagnosis.previousMedicalHistory || "",
          diagnosisReport: latestDiagnosis.text || "",
          prescriptionGiven: treatmentPlanPrescriptionGiven,
          bloodTestGiven: latestDiagnosis.bloodTestGiven || "No",
          xrayGiven: latestDiagnosis.xrayGiven || "No",
          ctScanGiven: latestDiagnosis.ctScanGiven || "No",
          mriGiven: latestDiagnosis.mriGiven || "No",
          nextVisitDate: treatmentPlanNextVisitDate,
          nextVisitFollowUp: treatmentPlanNextVisitFollowUp.trim(),
          doctorId: currentDoctorId,
          doctorName: currentDoctorName,
        },
      ],
    }));
    setTreatmentPlanText("");
    setTreatmentPlanDate(new Date().toISOString().split("T")[0]);
    setTreatmentPlanNextVisitDate("");
    setTreatmentPlanNextVisitFollowUp("");
    setTreatmentPlanPrescriptionGiven("No");
  };

  const removeTreatmentPlan = (index) => {
    setTreatment((prev) => ({
      ...prev,
      plan: prev.plan.filter((_, i) => i !== index),
    }));
  };

  const payload = {
    patientId: patient_id,
    clinicId,
    phnId:patientInfo?.PHN_ID,
    medicalChecks,
    medicalNotes,
    chiefComplaints,
    historyOfPresentIllness,
    chiefComplaintsList,
    historyOfPresentIllnessList,
    vitals: vitalsHistory,
    generalExamination,
    systemicExamination,
    treatment,
  };

  const submitAssessment = async () => {
    try {
      await AxiosInstance.post(`/assessment/create`, payload);
      message.success("Assessment Submitted");
      getAssessmentData();
    } catch (err) {
      console.error(err);
      message.error("Error submitting assessment");
    }
  };

  const updateAssessment = async () => {
    try {
      await AxiosInstance.patch(`/assessment/update/${updateId}`, payload);
      message.success("Assessment Updated");
      getAssessmentData();
    } catch (err) {
      console.error(err);
      message.error("Error updating assessment");
    }
  };
  // Derive doctors for tabs and filter diagnosis data based on active tab
  const attendingDoctorsSet = new Set(
    (treatment?.diagnosis || [])
      .map(d => d.doctorName)
      .filter(name => name && name.trim() !== "")
  );
  if (currentDoctorName && currentDoctorName !== "Unknown Doctor") {
    attendingDoctorsSet.add(currentDoctorName);
  }
  const attendingDoctors = Array.from(attendingDoctorsSet);
  if (attendingDoctors.length === 0) {
    attendingDoctors.push("General");
  }

  const activeDoctorDiagnoses = (treatment?.diagnosis || []).filter(d => 
    (activeDoctorTab === "General" ? !d.doctorName : d.doctorName === activeDoctorTab)
  );
  const latestActiveDiagnosis = activeDoctorDiagnoses[activeDoctorDiagnoses.length - 1] || {};
  
  const activeChiefComplaintsList = chiefComplaintsList.filter(c =>
    (activeDoctorTab === "General" ? !c.doctorName : c.doctorName === activeDoctorTab)
  );

  const isReadOnlyView = activeDoctorTab !== currentDoctorName;

  return (
    <div className="p-6 bg-slate-50  min-h-screen">
      <Card className="max-w-7xl mx-auto shadow-sm">
        {/* PATIENT INFO */}
        <h2 className="text-xl font-bold mb-4 text-slate-800  border-b border-slate-200  pb-2">
          Patient Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            : Object.entries(patientInfo).map(([k, v]) =>
                k === "PHN_ID" ? (
                  ""
                ) : (
                  <div
                    key={k}
                    className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
                  >
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {k}
                    </span>
                    <span className="text-base font-medium text-slate-800">
                      {v || "N/A"}
                    </span>
                  </div>
                ),
              )}
        </div>

        {/* DOCTOR ASSESSMENT TABS */}
        <Tabs
          type="card"
          activeKey={activeDoctorTab}
          onChange={(key) => setActiveDoctorTab(key)}
          className="mb-6 tabs-custom-styling"
          items={attendingDoctors.map((docName) => {
            const isCurrentDoctor = docName === currentDoctorName;
            return {
              key: docName,
              label: (
                <span className={`px-4 py-1 text-base font-bold flex items-center ${isCurrentDoctor ? 'text-blue-600' : 'text-slate-600'}`}>
                  {isCurrentDoctor && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                  {docName === "General" ? "General Assessment" : `Dr. ${docName}'s Assessment`}
                </span>
              ),
            };
          })}
        />

        {/* TABS SECTIONS */}
        <Tabs
          defaultActiveKey="1"
          type="card"
          className="mb-8 tabs-custom-styling"
          items={[
            {
              key: "1",
              label: (
                <span className="text-base font-bold px-4">
                  History & Primary Compliant
                </span>
              ),
              children: (
                <Collapse
                  defaultActiveKey={["1"]}
                  className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden"
                  expandIconPlacement="end"
                  size="large"
                  items={[
                    {
                      key: "1",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Medical History
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-2">
                          <Collapse
                            ghost
                            items={Object.entries(medicalHistoryCategories)
                              .filter(([category]) => {
                                if (
                                  category === "Gynecology History" ||
                                  category === "Obstetric History"
                                ) {
                                  return (
                                    patientInfo.Gender?.toLowerCase() ===
                                    "female"
                                  );
                                }
                                return true;
                              })
                              .map(([category, items], index) => {
                                const hasFilledData = items.some((m) => medicalChecks[m]);
                                return {
                                  key: index.toString(),
                                  label: (
                                    <div className="flex items-center">
                                      <span className={`text-md font-bold px-3 py-1.5 rounded-lg transition-colors ${hasFilledData ? "text-red-700 bg-red-50 border border-red-100 shadow-sm" : "text-slate-700"}`}>
                                        {category}
                                      </span>
                                    </div>
                                  ),
                                children: (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                    {items.map((m) => (
                                      <div key={m} className={`flex flex-col p-3 rounded-xl border transition-all ${medicalChecks[m] ? "bg-red-50/50 border-red-200 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50"}`}>
                                        <label className={`flex items-center font-medium cursor-pointer ${medicalChecks[m] ? "text-red-800" : "text-slate-700"}`}>
                                          <input
                                            type="checkbox"
                                            className="mr-3 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            checked={medicalChecks[m] || false}
                                            onChange={(e) =>
                                              setMedicalChecks({
                                                ...medicalChecks,
                                                [m]: e.target.checked,
                                              })
                                            }
                                          />
                                          {m}
                                        </label>
                                        {medicalChecks[m] && (
                                          <div className="mt-3 ml-7">
                                            <Textarea
                                              className="w-full bg-white border-red-100 focus:border-red-300 focus:ring-red-200"
                                              placeholder={`Notes for ${m}...`}
                                              rows={2}
                                              value={medicalNotes[m] || ""}
                                              onChange={(e) =>
                                                setMedicalNotes({
                                                  ...medicalNotes,
                                                  [m]: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ),
                              };
                            })}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "2",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Medical History Documents
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4 bg-white rounded-b-xl">
                          <PatientDocuments
                            topics={Object.keys(medicalChecks).filter(
                              (k) => medicalChecks[k],
                            )}
                            title="Upload Medical History Document"
                          />
                        </div>
                      ),
                    },
                    {
                      key: "3",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Primary Complaint
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4 space-y-6">
                          <div className="border border-gray-200 rounded-md p-4 bg-white">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">
                              Primary Complaint (PC)
                            </h3>
                            <div className="flex items-start w-full gap-3">
                              <div className="flex-1 space-y-2">
                                <Input
                                  className="w-full"
                                  placeholder="Complaint"
                                  value={chiefComplaintName}
                                  onChange={(e) =>
                                    setChiefComplaintName(e.target.value)
                                  }
                                />
                                <Textarea
                                  className="w-full"
                                  placeholder="Complaint Details..."
                                  value={chiefComplaintText}
                                  onChange={(e) =>
                                    setChiefComplaintText(e.target.value)
                                  }
                                  rows={2}
                                />
                              </div>
                              <div className="w-40">
                                <Input
                                  type="date"
                                  value={chiefComplaintDate}
                                  onChange={(e) =>
                                    setChiefComplaintDate(e.target.value)
                                  }
                                />
                              </div>
                              <Button
                                onClick={addChiefComplaint}
                                className="bg-blue-600 text-white h-[42px] px-6"
                              >
                                {editingChiefComplaintIndex !== null ? "Update" : "Add"}
                              </Button>
                            </div>
                            {chiefComplaintsList.length > 0 && (
                              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                                <table className="w-full text-sm text-left text-slate-500">
                                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                                    <tr>
                                      <th scope="col" className="px-4 py-3 font-semibold">Complaint</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Complaint Details</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Dr Name</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Visiting Date</th>
                                      <th scope="col" className="px-4 py-3 font-semibold text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {activeChiefComplaintsList.map((c, i) => (
                                      <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{c.text || "-"}</td>
                                        <td className="px-4 py-3 text-slate-600 break-words max-w-xs">{c.details || "-"}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {c.doctorName ? (
                                            <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full w-fit flex items-center gap-1 border border-blue-100">
                                              <Icon icon="solar:user-md-bold" />
                                              Dr. {c.doctorName}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.date || "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <button
                                              className="text-blue-500 font-bold w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-50 transition-colors"
                                              onClick={() => editChiefComplaint(i)}
                                              title="Edit"
                                            >
                                              <Icon icon="solar:pen-bold" />
                                            </button>
                                            <button
                                              className="text-red-500 font-bold w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors"
                                              onClick={() => removeChiefComplaint(i)}
                                              title="Delete"
                                            >
                                              X
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>


                        </div>
                      ),
                    },
                    {
                      key: "4",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Vitals Report
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="space-y-6">
                          {/* Current Vitals Form */}
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-md font-bold text-slate-800 mb-4 border-b pb-2">
                              Add New Vitals Record
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Temperature */}
                              <div className="space-y-2">
                                <Input
                                  label="Temperature (°F/°C)"
                                  placeholder="e.g. 98.6"
                                  value={currentVitals.temperature}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      temperature: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.temperatureCondition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      temperatureCondition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.temperature.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Pulse Rate */}
                              <div className="space-y-2">
                                <Input
                                  label="Pulse Rate (bpm)"
                                  type="number"
                                  placeholder="e.g. 78"
                                  value={currentVitals.pulseRate}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      pulseRate: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.pulseRateCondition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      pulseRateCondition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.pulseRate.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Respiratory Rate */}
                              <div className="space-y-2">
                                <Input
                                  label="Respiratory Rate (/min)"
                                  type="number"
                                  placeholder="e.g. 18"
                                  value={currentVitals.respiratoryRate}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      respiratoryRate: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.respiratoryRateCondition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      respiratoryRateCondition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.respiratoryRate.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Blood Pressure */}
                              <div className="space-y-2">
                                <Input
                                  label="Blood Pressure (mmHg)"
                                  placeholder="e.g. 120/80"
                                  value={currentVitals.bloodPressure}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      bloodPressure: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.bloodPressureCondition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      bloodPressureCondition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.bloodPressure.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* SpO2 */}
                              <div className="space-y-2">
                                <Input
                                  label="SpO2 (%)"
                                  type="number"
                                  placeholder="e.g. 98"
                                  value={currentVitals.spO2}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      spO2: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.spO2Condition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      spO2Condition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.spO2.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Height & Weight */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Input
                                    label="Height (cm)"
                                    type="number"
                                    placeholder="e.g. 172"
                                    value={currentVitals.height}
                                    onChange={(e) =>
                                      setCurrentVitals({
                                        ...currentVitals,
                                        height: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Input
                                    label="Weight (kg)"
                                    type="number"
                                    placeholder="e.g. 68"
                                    value={currentVitals.weight}
                                    onChange={(e) =>
                                      setCurrentVitals({
                                        ...currentVitals,
                                        weight: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              {/* BMI */}
                              <div className="space-y-2">
                                <Input
                                  label="BMI (kg/m²)"
                                  placeholder="e.g. 22.9"
                                  value={currentVitals.bmi}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      bmi: e.target.value,
                                    })
                                  }
                                />
                                <select
                                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={currentVitals.bmiCondition}
                                  onChange={(e) =>
                                    setCurrentVitals({
                                      ...currentVitals,
                                      bmiCondition: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select Condition</option>
                                  {vitalOptions.bmi.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Blood Sugar Toggle & Input */}
                              <div className="mt-4">
                                <label className="text-[12px] font-black tracking-widest uppercase text-slate-500 pl-1 mb-2 block">
                                  Blood Sugar Mode
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-4">
                                  <button
                                    type="button"
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${bloodSugarMode === "Fasting" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                                    onClick={() => {
                                      setBloodSugarMode("Fasting");
                                      setCurrentVitals((prev) => ({ ...prev, bloodSugarAfterFood: "" }));
                                    }}
                                  >
                                    Fasting
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${bloodSugarMode === "After Food" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                                    onClick={() => {
                                      setBloodSugarMode("After Food");
                                      setCurrentVitals((prev) => ({ ...prev, bloodSugarFasting: "" }));
                                    }}
                                  >
                                    After Food
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {bloodSugarMode === "Fasting" && (
                                    <div className="space-y-2">
                                      <Input
                                        label="Blood Sugar (Fasting) mg/dL"
                                        type="number"
                                        placeholder="e.g. 90"
                                        value={currentVitals.bloodSugarFasting || ""}
                                        onChange={(e) =>
                                          setCurrentVitals({
                                            ...currentVitals,
                                            bloodSugarFasting: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                  {bloodSugarMode === "After Food" && (
                                    <div className="space-y-2">
                                      <Input
                                        label="Blood Sugar (After Food) mg/dL"
                                        type="number"
                                        placeholder="e.g. 140"
                                        value={currentVitals.bloodSugarAfterFood || ""}
                                        onChange={(e) =>
                                          setCurrentVitals({
                                            ...currentVitals,
                                            bloodSugarAfterFood: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              {editingIndex !== null && (
                                <Button
                                  onClick={() => {
                                    setEditingIndex(null);
                                    setCurrentVitals(initialVitals);
                                  }}
                                  className="bg-slate-500 hover:bg-slate-600 text-white shadow-sm mr-2"
                                >
                                  Cancel Edit
                                </Button>
                              )}
                              <Button
                                onClick={addVitals}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                {editingIndex !== null
                                  ? "Update Record"
                                  : "+ Add Record"}
                              </Button>
                            </div>
                          </div>

                          {/* Vitals History Table */}
                          {vitalsHistory.length > 0 && (
                            <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                                Past Vitals Records
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-700">
                                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                    <tr>
                                      <th className="p-3 font-semibold whitespace-nowrap">
                                        Date & Time
                                      </th>
                                      <th className="p-3 font-semibold">
                                        Temperature
                                      </th>
                                      <th className="p-3 font-semibold">Pulse Rate (bpm)</th>
                                      <th className="p-3 font-semibold">Respiratory Rate (/min)</th>
                                      <th className="p-3 font-semibold">Blood Pressure (mmHg)</th>
                                      <th className="p-3 font-semibold">
                                        SpO2
                                      </th>
                                      <th className="p-3 font-semibold">
                                        Blood Sugar
                                      </th>
                                      <th className="p-3 font-semibold">
                                        Ht/Wt/BMI
                                      </th>
                                      <th className="p-3 font-semibold text-center">
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {vitalsHistory.map((v, i) => (
                                      <tr
                                        key={i}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                      >
                                        <td className="p-3 whitespace-nowrap text-xs text-slate-500 font-medium">
                                          {v.date || "-"}
                                        </td>
                                        <td className="p-3">
                                          {v.temperature
                                            ? `${v.temperature}`
                                            : "-"}{" "}
                                          <br />
                                          <span className="text-xs text-slate-500">
                                            {v.temperatureCondition}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {v.pulseRate ? `${v.pulseRate}` : "-"}{" "}
                                          <br />
                                          <span className="text-xs text-slate-500">
                                            {v.pulseRateCondition}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {v.respiratoryRate
                                            ? `${v.respiratoryRate}`
                                            : "-"}{" "}
                                          <br />
                                          <span className="text-xs text-slate-500">
                                            {v.respiratoryRateCondition}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {v.bloodPressure
                                            ? `${v.bloodPressure}`
                                            : "-"}{" "}
                                          <br />
                                          <span className="text-xs text-slate-500">
                                            {v.bloodPressureCondition}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {v.spO2 ? `${v.spO2}` : "-"} <br />
                                          <span className="text-xs text-slate-500">
                                            {v.spO2Condition}
                                          </span>
                                        </td>
                                        <td className="p-3 text-xs">
                                          {v.bloodSugarFasting ? `F: ${v.bloodSugarFasting} ` : ""}
                                          {v.bloodSugarAfterFood ? `PP: ${v.bloodSugarAfterFood}` : ""}
                                          {!v.bloodSugarFasting && !v.bloodSugarAfterFood && "-"}
                                        </td>
                                        <td className="p-3 text-xs">
                                          {v.height ? `H: ${v.height}cm` : ""}
                                          {v.weight ? ` W: ${v.weight}kg` : ""}
                                          {v.bmi ? (
                                            <>
                                              <br />
                                              BMI: {v.bmi}{" "}
                                              <span className="text-slate-500">
                                                ({v.bmiCondition})
                                              </span>
                                            </>
                                          ) : (
                                            ""
                                          )}
                                        </td>
                                        <td className="p-3 text-center flex items-center justify-center space-x-2">
                                          <button
                                            onClick={() => editVitals(i)}
                                            className="text-blue-500 hover:text-blue-700 font-bold px-2 py-1 rounded transition-colors"
                                            title="Edit Record"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => removeVitals(i)}
                                            className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded transition-colors"
                                            title="Remove Record"
                                          >
                                            X
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key:"5",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Emergency care
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      // children: ()
                    }
                  ]}
                />
              ),
            },
            {
              key: "2",
              label: (
                <span className="text-base font-bold px-4">
                  Diagnosis & Treatment plan
                </span>
              ),
              children: (
                <Collapse
                  defaultActiveKey={["1", "2", "3", "4", "5", "6", "7", "8"]}
                  className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden"
                  expandIconPlacement="end"
                  size="large"
                  items={[
                    {
                      key: "1",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Medical History
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-2">
                          <Collapse
                            ghost
                            defaultActiveKey={Array.from(
                              { length: 30 },
                              (_, i) => i.toString(),
                            )}
                            items={Object.entries(medicalHistoryCategories)
                              .filter(([category]) => {
                                if (
                                  category === "Gynecology History" ||
                                  category === "Obstetric History"
                                ) {
                                  return (
                                    patientInfo.Gender?.toLowerCase() ===
                                    "female"
                                  );
                                }
                                return true;
                              })
                              .map(([category, items], index) => {
                                const hasFilledData = items.some((m) => medicalChecks[m]);
                                return {
                                  key: index.toString(),
                                  label: (
                                    <div className="flex items-center">
                                      <span className={`text-md font-bold px-3 py-1.5 rounded-lg transition-colors ${hasFilledData ? "text-red-700 bg-red-50 border border-red-100 shadow-sm" : "text-slate-700"}`}>
                                        {category}
                                      </span>
                                    </div>
                                  ),
                                  children: (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                      {items.map((m) => (
                                        <div key={m} className={`flex flex-col p-3 rounded-xl border transition-all ${medicalChecks[m] ? "bg-red-50/50 border-red-200 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50"}`}>
                                          <label className={`flex items-center font-medium cursor-default ${medicalChecks[m] ? "text-red-800" : "text-slate-700"}`}>
                                            <input
                                              type="checkbox"
                                              className="mr-3 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 pointer-events-none"
                                              checked={medicalChecks[m] || false}
                                              readOnly
                                            />
                                            {m}
                                          </label>
                                          {medicalChecks[m] && (
                                            <div className="mt-3 ml-7">
                                              <Textarea
                                                className="w-full bg-white cursor-not-allowed text-slate-500 pointer-events-none border-red-100"
                                                placeholder="No notes provided."
                                                rows={2}
                                                value={medicalNotes[m] || ""}
                                                readOnly
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ),
                                };
                              })}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "medical-docs-ro",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Medical History Documents
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4 bg-white rounded-b-xl">
                          <PatientDocuments
                            topics={Object.keys(medicalChecks).filter(
                              (k) => medicalChecks[k],
                            )}
                            title="Medical History Documents"
                            readOnly={true}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "3",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Primary Complaint
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4 space-y-6">
                          <div>
                            <label className="font-semibold block mb-2 text-slate-700">
                              Primary Complaint (PC)
                            </label>
                            {chiefComplaints && (
                              <div className="bg-white p-3 rounded-md border border-slate-200 text-slate-700 min-h-[60px] whitespace-pre-wrap mb-4">
                                <div className="text-xs font-bold text-orange-500 mb-1">
                                  Legacy Entry
                                </div>
                                {chiefComplaints}
                              </div>
                            )}
                            {chiefComplaintsList.length > 0 ? (
                              <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                                <table className="w-full text-sm text-left text-slate-500">
                                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                                    <tr>
                                      <th scope="col" className="px-4 py-3 font-semibold">Complaint</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Complaint Details</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Dr Name</th>
                                      <th scope="col" className="px-4 py-3 font-semibold">Visiting Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {activeChiefComplaintsList.map((c, i) => (
                                      <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{c.text || "-"}</td>
                                        <td className="px-4 py-3 text-slate-600 break-words max-w-xs">{c.details || "-"}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {c.doctorName ? (
                                            <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full w-fit flex items-center gap-1 border border-blue-100">
                                              <Icon icon="solar:user-md-bold" />
                                              Dr. {c.doctorName}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.date || "-"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              !chiefComplaints && (
                                <span className="text-slate-400 italic">
                                  No primary complaint recorded.
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "2",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Vitals Reports
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4 space-y-4">
                          {vitalsHistory.length > 0 ? (
                            <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                              <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                  <tr>
                                    <th className="p-3 font-semibold whitespace-nowrap">
                                      Date & Time
                                    </th>
                                    <th className="p-3 font-semibold">Temp</th>
                                    <th className="p-3 font-semibold">PR</th>
                                    <th className="p-3 font-semibold">RR</th>
                                    <th className="p-3 font-semibold">BP</th>
                                    <th className="p-3 font-semibold">SpO2</th>
                                    <th className="p-3 font-semibold">Blood Sugar</th>
                                    <th className="p-3 font-semibold">
                                      Ht/Wt/BMI
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vitalsHistory.map((v, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                      <td className="p-3 whitespace-nowrap text-xs text-slate-500 font-medium">
                                        {v.date || "-"}
                                      </td>
                                      <td className="p-3">
                                        {v.temperature
                                          ? `${v.temperature}`
                                          : "-"}{" "}
                                        <br />
                                        <span className="text-xs text-slate-500">
                                          {v.temperatureCondition}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        {v.pulseRate ? `${v.pulseRate}` : "-"}{" "}
                                        <br />
                                        <span className="text-xs text-slate-500">
                                          {v.pulseRateCondition}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        {v.respiratoryRate
                                          ? `${v.respiratoryRate}`
                                          : "-"}{" "}
                                        <br />
                                        <span className="text-xs text-slate-500">
                                          {v.respiratoryRateCondition}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        {v.bloodPressure
                                          ? `${v.bloodPressure}`
                                          : "-"}{" "}
                                        <br />
                                        <span className="text-xs text-slate-500">
                                          {v.bloodPressureCondition}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        {v.spO2 ? `${v.spO2}` : "-"} <br />
                                        <span className="text-xs text-slate-500">
                                          {v.spO2Condition}
                                        </span>
                                      </td>
                                      <td className="p-3 text-xs">
                                        {v.bloodSugarFasting ? `F: ${v.bloodSugarFasting} ` : ""}
                                        {v.bloodSugarAfterFood ? `PP: ${v.bloodSugarAfterFood}` : ""}
                                        {!v.bloodSugarFasting && !v.bloodSugarAfterFood && "-"}
                                      </td>
                                      <td className="p-3 text-xs">
                                        {v.height ? `H: ${v.height}cm` : ""}
                                        {v.weight ? ` W: ${v.weight}kg` : ""}
                                        {v.bmi ? (
                                          <>
                                            <br />
                                            BMI: {v.bmi}{" "}
                                            <span className="text-slate-500">
                                              ({v.bmiCondition})
                                            </span>
                                          </>
                                        ) : (
                                          ""
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">
                              No vitals recorded.
                            </p>
                          )}
                        </div>
                      ),
                    },
                    ...(prescriptionDocs && prescriptionDocs.length > 0 ? [{
                      key: "4",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Pharmacy & Prescriptions
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          <Prescription history={false} />
                        </div>
                      ),
                    }] : []),
                    ...(labDocs && labDocs.length > 0 ? [{
                      key: "6",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Lab Report
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          <PatientDocuments documents={labDocs} swaper={true} />
                        </div>
                      ),
                    }] : []),
                    ...(scanDocs && scanDocs.length > 0 ? [{
                      key: "5",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Scan Center Reports
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          <PatientDocuments
                            documents={scanDocs}
                            swaper={true}
                          />
                        </div>
                      ),
                    }] : []),
                    {
                      key: "7",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Diagnosis
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="flex flex-col w-full gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Visiting Date (Read Only)
                                  </label>
                                  <Input
                                    type="date"
                                    value={diagnosisDate}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Dr (Visit)
                                  </label>
                                  <Input
                                    type="text"
                                    value={currentDoctorName}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Complaint (Read Only)
                                  </label>
                                  <Input
                                    type="text"
                                    value={activeChiefComplaintsList.length > 0 ? activeChiefComplaintsList.map(c => c.text).filter(Boolean).join(", ") : "No primary complaint recorded"}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Complaint Details (Read Only)
                                  </label>
                                  <Input
                                    type="text"
                                    value={activeChiefComplaintsList.length > 0 ? activeChiefComplaintsList.map(c => c.details).filter(Boolean).join(", ") : "No details recorded"}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[15px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                  Previous Medical History (Read Only)
                                </label>
                                <div className="w-full bg-slate-100 text-red-500 border border-slate-200 rounded-xl min-h-[42px] max-h-[120px] overflow-y-auto p-3">
                                  {(() => {
                                    const historyItems = Object.keys(medicalChecks).filter((k) => medicalChecks[k]);
                                    if (historyItems.length === 0) {
                                      return <span className="italic text-[15px]">No medical history recorded</span>;
                                    }
                                    return (
                                      <ul className="list-disc pl-5 m-0 space-y-2 text-[15px]">
                                        {historyItems.map((item, idx) => (
                                          <li key={idx}>
                                            <span className="font-medium text-red-700">{item}</span>
                                            {medicalNotes[item] && (
                                              <div className="text-red-500 text-[12px] mt-0.5 whitespace-pre-wrap">{medicalNotes[item]}</div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                  Diagnosis Report (Data Entry)
                                </label>
                                <Textarea
                                  className="w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl min-h-[60px]"
                                  placeholder="Describe the diagnosis..."
                                  value={diagnosisText}
                                  onChange={(e) => setDiagnosisText(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                                {[
                                  { label: "Prescription", val: diagnosisPrescriptionGiven, set: setDiagnosisPrescriptionGiven },
                                  { label: "Blood Test", val: diagnosisBloodTestGiven, set: setDiagnosisBloodTestGiven },
                                  { label: "X-Ray", val: diagnosisXrayGiven, set: setDiagnosisXrayGiven },
                                  { label: "CT-Scan", val: diagnosisCtScanGiven, set: setDiagnosisCtScanGiven },
                                  { label: "MRI", val: diagnosisMriGiven, set: setDiagnosisMriGiven }
                                ].map((item) => (
                                  <div key={item.label} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2 block text-center">
                                      {item.label} Needed? 
                                    </label>
                                    <div className="flex justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => item.set("Yes")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${item.val === "Yes" ? "bg-green-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => item.set("No")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${item.val === "No" ? "bg-rose-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                                      >
                                        No
                                      </button>
                                    </div>
                                    {item.label === "Prescription" && item.val === "Yes" && (
                                      <div className="flex gap-2 mt-3 w-full justify-center">
                                        <button type="button" onClick={() => setPrescriptionModalVisible(true)} className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1">
                                          <Icon icon="solar:add-circle-bold" /> Create
                                        </button>
                                        <button type="button" onClick={() => handleViewReport("Prescription")} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1">
                                          <Icon icon="solar:eye-bold" /> View
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-end mt-2">
                                <Button
                                  onClick={addDiagnosis}
                                  className="h-[50px] px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                  <Icon icon="solar:add-circle-bold-duotone" className="text-lg" />
                                  Add Diagnosis
                                </Button>
                              </div>
                            </div>

                            {activeDoctorDiagnoses.length > 0 && (
                              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full text-left text-sm text-slate-600">
                                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
                                    <tr>
                                      <th className="px-4 py-3 whitespace-nowrap">S.No</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Dr Name</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Primary Compliant</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Compliant Details</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Diagnosis Report</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Tests & Prescriptions</th>
                                      <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {activeDoctorDiagnoses.map((d, i) => (
                                      <tr key={i} className="hover:bg-slate-50 transition-all">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{i + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-fit">
                                            <Icon icon="solar:calendar-bold-duotone" className="text-slate-400" />
                                            {d.date}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {d.doctorName ? (
                                            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 w-fit">
                                              <Icon icon="solar:user-md-bold-duotone" className="text-blue-500" />
                                              Dr. {d.doctorName}
                                            </span>
                                          ) : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                          {d.primaryComplaint ? <span className="font-semibold text-slate-800">{d.primaryComplaint}</span> : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                          {d.primaryComplaintDetails || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-pre-wrap">
                                          {d.text}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex flex-col gap-1">
                                            {[
                                              { label: "Prescription", val: d.prescriptionGiven },
                                              { label: "Blood Test", val: d.bloodTestGiven },
                                              { label: "X-Ray", val: d.xrayGiven },
                                              { label: "CT-Scan", val: d.ctScanGiven },
                                              { label: "MRI", val: d.mriGiven }
                                            ].map(item => (
                                              <div key={item.label} className="text-[10px] font-bold flex items-center gap-1">
                                                <Icon icon={item.val === "Yes" ? "solar:check-circle-bold-duotone" : "solar:close-circle-bold-duotone"} className={item.val === "Yes" ? "text-green-500" : "text-slate-300"} />
                                                <span className={item.val === "Yes" ? "text-green-700" : "text-slate-400"}> {item.label} </span>
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                                            onClick={() => removeDiagnosis(i)}
                                            title="Remove Diagnosis"
                                          >
                                            <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "8",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Treatment Plan
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="flex flex-col w-full gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Visiting Date (Read Only)
                                  </label>
                                  <Input
                                    type="date"
                                    value={treatmentPlanDate}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Dr (Visit)
                                  </label>
                                  <Input
                                    type="text"
                                    value={currentDoctorName}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Complaint (Auto-filled)
                                  </label>
                                  <Input
                                    type="text"
                                    value={latestActiveDiagnosis.primaryComplaint || ""}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div className="w-full md:w-1/2">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                    Primary Complaint Details (Auto-filled)
                                  </label>
                                  <Input
                                    type="text"
                                    value={latestActiveDiagnosis.primaryComplaintDetails || ""}
                                    readOnly
                                    className="h-[42px] bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              {/* MEDICAL HISTORY - READ ONLY */}
                              <div className="w-full mb-6">
                                <label className="text-[15px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                  Previous Medical History (Read Only)
                                </label>
                                <div className="w-full bg-slate-100 text-red-500 border border-slate-200 rounded-xl min-h-[42px] max-h-[120px] overflow-y-auto p-3">
                                  {(() => {
                                    const historyString = latestActiveDiagnosis.previousMedicalHistory;
                                    const historyItems = historyString ? historyString.split(",").map(i => i.trim()).filter(i => i) : [];
                                    if (historyItems.length === 0) {
                                      return <span className="italic text-sm">No medical history recorded</span>;
                                    }
                                    return (
                                      <div className="flex flex-wrap gap-2">
                                        {historyItems.map((item, idx) => (
                                          <span key={idx} className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs font-bold border border-red-100">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* DIAGNOSIS REPORT */}
                              <div className="w-full mb-6">
                                <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 pl-1 mb-2 block">
                                  Diagnosis Report (Read Only)
                                </label>
                                <Textarea
                                  className="w-full bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 rounded-xl min-h-[60px]"
                                  value={latestActiveDiagnosis.text || "No diagnosis report available"}
                                  readOnly
                                  rows={3}
                                />
                              </div>

                              <div className="flex flex-wrap gap-4 mt-2">
                                {[
                                  { label: "Prescription", val: latestActiveDiagnosis.prescriptionGiven || "No", isReady: isDocReady("Prescription", latestActiveDiagnosis.date) },
                                  { label: "Blood Test", val: latestActiveDiagnosis.bloodTestGiven || "No", isReady: isDocReady("Blood Test", latestActiveDiagnosis.date) },
                                  { label: "X-Ray", val: latestActiveDiagnosis.xrayGiven || "No", isReady: isDocReady("X-Ray", latestActiveDiagnosis.date) },
                                  { label: "CT-Scan", val: latestActiveDiagnosis.ctScanGiven || "No", isReady: isDocReady("CT-Scan", latestActiveDiagnosis.date) },
                                  { label: "MRI", val: latestActiveDiagnosis.mriGiven || "No", isReady: isDocReady("MRI", latestActiveDiagnosis.date) }
                                ]
                                .filter(item => item.val === "Yes")
                                .map((item) => (
                                  <div key={item.label} className="bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-600">
                                      {item.label} Suggested
                                    </span>
                                    <button
                                      type="button"
                                      className={`px-3 py-1 ${item.isReady ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"} border rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleViewReport(item.label, latestActiveDiagnosis.date);
                                      }}
                                    >
                                      <Icon icon={item.isReady ? "solar:eye-bold-duotone" : "solar:clock-circle-bold-duotone"} />
                                      {item.isReady ? "View" : "Pending"}
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-slate-200 my-2"></div>

                              <div>
                                <label className="text-[10px] font-black tracking-widest uppercase text-blue-600 pl-1 mb-2 block">
                                  Treatment Plan (Data Entry)
                                </label>
                                <Textarea
                                  className="w-full bg-blue-50/30 border-blue-200 focus:bg-white transition-all rounded-xl min-h-[60px]"
                                  placeholder="Describe the treatment plan..."
                                  value={treatmentPlanText}
                                  onChange={(e) => setTreatmentPlanText(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 mb-2">
                                {[
                                  { label: "Prescription", val: treatmentPlanPrescriptionGiven, set: setTreatmentPlanPrescriptionGiven }
                                ].map((item) => (
                                  <div key={item.label} className="bg-blue-50/30 p-3 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-blue-600 mb-2 block text-center">
                                      {item.label} Needed?
                                    </label>
                                    <div className="flex justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => item.set("Yes")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${item.val === "Yes" ? "bg-green-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => item.set("No")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${item.val === "No" ? "bg-rose-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                                      >
                                        No
                                      </button>
                                    </div>
                                    {item.label === "Prescription" && item.val === "Yes" && (
                                      <div className="flex gap-2 mt-3 w-full justify-center">
                                        <button type="button" onClick={() => setPrescriptionModalVisible(true)} className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1">
                                          <Icon icon="solar:add-circle-bold" /> Create
                                        </button>
                                        <button type="button" onClick={() => handleViewReport("Prescription")} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1">
                                          <Icon icon="solar:eye-bold" /> View
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-col md:flex-row gap-4 mt-2">
                                <div className="w-full md:w-1/3">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-blue-600 pl-1 mb-2 block">
                                    Next Visit Date
                                  </label>
                                  <Input
                                    type="date"
                                    value={treatmentPlanNextVisitDate}
                                    onChange={(e) => setTreatmentPlanNextVisitDate(e.target.value)}
                                    className="h-[42px] bg-blue-50/30 border-blue-200 focus:bg-white rounded-xl"
                                  />
                                </div>
                                <div className="w-full md:w-2/3">
                                  <label className="text-[10px] font-black tracking-widest uppercase text-blue-600 pl-1 mb-2 block">
                                    Next Visit Follow-Up (Instructions)
                                  </label>
                                  <Input
                                    type="text"
                                    value={treatmentPlanNextVisitFollowUp}
                                    onChange={(e) => setTreatmentPlanNextVisitFollowUp(e.target.value)}
                                    placeholder="e.g., Review blood reports, check BP"
                                    className="h-[42px] bg-blue-50/30 border-blue-200 focus:bg-white rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end mt-2">
                                <Button
                                  onClick={addTreatmentPlan}
                                  className="h-[50px] px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                  <Icon icon="solar:add-circle-bold-duotone" className="text-lg" />
                                  Add Treatment Plan
                                </Button>
                              </div>
                            </div>

                            {treatment.plan.length > 0 && (
                              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full text-left text-sm text-slate-600">
                                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
                                    <tr>
                                      <th className="px-4 py-3 whitespace-nowrap">S.No</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Visiting Date</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Primary Doctor</th>
                                      <th className="px-4 py-3 min-w-[150px]">Primary Complaint</th>
                                      <th className="px-4 py-3 min-w-[200px]">Primary Complaint Details</th>
                                      <th className="px-4 py-3 min-w-[200px]">Diagnosis Report</th>
                                      <th className="px-4 py-3 min-w-[200px]">Treatment Plan</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Prescription</th>
                                      <th className="px-4 py-3 whitespace-nowrap">Blood Test</th>
                                      <th className="px-4 py-3 whitespace-nowrap">X-Ray</th>
                                      <th className="px-4 py-3 whitespace-nowrap">CT-Scan</th>
                                      <th className="px-4 py-3 whitespace-nowrap">MRI</th>
                                      <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {treatment.plan.map((p, i) => {
                                      const getStatusCell = (label, val) => {
                                        if (val !== "Yes") return <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Not ordered</span>;
                                        const isReady = isDocReady(label, p.date);
                                        if (!isReady) return <span className="text-[10px] text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-100 whitespace-nowrap">Not Ready</span>;
                                        return (
                                          <button
                                            type="button"
                                            className="bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleViewReport(label, p.date);
                                            }}
                                          >
                                            <Icon icon="solar:eye-bold-duotone" /> Ready to pickup
                                          </button>
                                        );
                                      };

                                      return (
                                      <tr key={i} className="hover:bg-slate-50 transition-all">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{i + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-fit">
                                            <Icon icon="solar:calendar-bold-duotone" className="text-slate-400" />
                                            {p.date}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {p.doctorName ? (
                                            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 w-fit">
                                              <Icon icon="solar:user-md-bold-duotone" className="text-blue-500" />
                                              Dr. {p.doctorName}
                                            </span>
                                          ) : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                          {p.primaryComplaint ? <span className="font-semibold text-slate-800">{p.primaryComplaint}</span> : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                          {p.primaryComplaintDetails || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-pre-wrap text-slate-500">
                                          {p.diagnosisReport || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-pre-wrap text-slate-800 font-medium">
                                          {p.text}
                                          {p.nextVisitDate && (
                                            <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block">
                                              Next Visit: {p.nextVisitDate} {p.nextVisitFollowUp && `(${p.nextVisitFollowUp})`}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {getStatusCell("Prescription", p.prescriptionGiven)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {getStatusCell("Blood Test", p.bloodTestGiven)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {getStatusCell("X-Ray", p.xrayGiven)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {getStatusCell("CT-Scan", p.ctScanGiven)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {getStatusCell("MRI", p.mriGiven)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                                            onClick={() => removeTreatmentPlan(i)}
                                            title="Remove Treatment Plan"
                                          >
                                            <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg" />
                                          </button>
                                        </td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "9",
                      label: (
                        <span className="text-lg font-bold text-slate-800">
                          Next Follow-up
                        </span>
                      ),
                      className: "border-b border-slate-200 bg-slate-50/50",
                      children: (
                        <div className="p-4">
                          {treatment.plan && treatment.plan.length > 0 ? (
                            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
                              <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 uppercase text-[10px] font-black tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">S.No</th>
                                    <th className="px-4 py-3 min-w-[120px]">Primary Dr Name</th>
                                    <th className="px-4 py-3 min-w-[150px]">Pry Compl</th>
                                    <th className="px-4 py-3 min-w-[200px]">Pry Comp Detail</th>
                                    <th className="px-4 py-3 min-w-[200px]">Diagnosis Report</th>
                                    <th className="px-4 py-3 min-w-[200px]">Treatment Plan Report</th>
                                    <th className="px-4 py-3 min-w-[120px]">Next Follow-up Date</th>
                                    <th className="px-4 py-3 min-w-[200px]">Next Follow-up Instructions</th>
                                    <th className="px-4 py-3 text-center">Next Follow-up Appointment</th>
                                    <th className="px-4 py-3 min-w-[120px]">Until Next Follow ups</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {treatment.plan.map((p, i) => {
                                    const hasAppointment = !!p.nextVisitDate;
                                    let daysLeft = "-";
                                    if (hasAppointment) {
                                      const target = new Date(p.nextVisitDate);
                                      const today = new Date();
                                      today.setHours(0,0,0,0);
                                      const diffTime = target.getTime() - today.getTime();
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      if (diffDays < 0) daysLeft = `${Math.abs(diffDays)} days overdue`;
                                      else if (diffDays === 0) daysLeft = "Today";
                                      else daysLeft = `${diffDays} days left`;
                                    }
                                    return (
                                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">{i + 1}</td>
                                        <td className="px-4 py-3">{p.doctorName || "-"}</td>
                                        <td className="px-4 py-3">{p.primaryComplaint || "-"}</td>
                                        <td className="px-4 py-3 text-xs">{p.primaryComplaintDetails || "-"}</td>
                                        <td className="px-4 py-3 text-xs">{p.diagnosisReport || "-"}</td>
                                        <td className="px-4 py-3 text-xs">{p.text || "-"}</td>
                                        <td className="px-4 py-3">{p.nextVisitDate ? formatDateToDDMMYYYY(p.nextVisitDate) : "-"}</td>
                                        <td className="px-4 py-3 text-xs">{p.nextVisitFollowUp || "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${hasAppointment ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {hasAppointment ? "Yes" : "No"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{daysLeft}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-400">
                              No follow-up records found.
                            </div>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-200 ">
          {updateId ? (
            <Button
              onClick={updateAssessment}
              className="w-40 bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              Update Profile
            </Button>
          ) : (
            <Button
              onClick={submitAssessment}
              className="w-40 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              Complete Profile
            </Button>
          )}
        </div>
      </Card>

      <Modal
        title={activeReportTitle}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {activeReportDoc && (
          <div className="flex flex-col gap-4">
            {activeReportTitle === "Prescription Report" ? (
              <PrescriptionFormatShow
                patientInfo={patientInfo}
                prescription={activeReportDoc}
              />
            ) : (
              <>
                {activeReportDoc.finalReportFileUrl && (
                  <div>
                    {activeReportDoc.finalReportFileUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={activeReportDoc.finalReportFileUrl.startsWith('http') ? activeReportDoc.finalReportFileUrl : `https://demo.physicianhealthnet.com/api${activeReportDoc.finalReportFileUrl}`}
                        className="w-full h-[600px] rounded-lg shadow-sm border border-slate-200"
                        title="PDF Report"
                      />
                    ) : (
                      <img
                        src={activeReportDoc.finalReportFileUrl.startsWith('http') ? activeReportDoc.finalReportFileUrl : `https://demo.physicianhealthnet.com/api${activeReportDoc.finalReportFileUrl}`}
                        alt="Report"
                        className="w-full h-auto rounded-lg shadow-sm border border-slate-200"
                        onError={(e) => {
                          if (activeReportDoc.finalReportFileUrl.startsWith('http')) {
                            e.target.src = activeReportDoc.finalReportFileUrl;
                          } else {
                            e.target.src = `https://dependencyforphn.physicianhealthnet.com/api${activeReportDoc.finalReportFileUrl}`;
                          }
                        }}
                      />
                    )}
                  </div>
                )}
                {activeReportDoc.finalReportNotes && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">Report Notes</h4>
                    <div className="whitespace-pre-wrap text-sm text-slate-600 font-medium">
                      {activeReportDoc.finalReportNotes}
                    </div>
                  </div>
                )}
                {!activeReportDoc.finalReportFileUrl && !activeReportDoc.finalReportNotes && (
                  <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-slate-200">
                    No report document or notes available for this request.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
            <Icon icon="solar:pill-bold-duotone" className="text-2xl text-blue-500" />
            Create / Edit Prescription
          </div>
        }
        open={prescriptionModalVisible}
        onCancel={() => {
          setPrescriptionModalVisible(false);
          getDocsData();
        }}
        footer={null}
        width={1000}
        centered
        destroyOnClose
      >
        <div className="max-h-[80vh] overflow-y-auto pt-4">
          <Prescription history={false} />
        </div>
      </Modal>
    </div>
  );
}
