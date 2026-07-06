import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import PatientBasicDetails from "./PatientBasicDetails";
import PatientMedicalForm from "./PatientMedicalForm";
import Button from "../../ui/Button";
import { Icon } from "@iconify/react";
import Card from "../../ui/Card";

const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 ">
      <Icon icon={icon} className="text-2xl" />
    </div>
    <div className="flex-1">
      <h2 className="font-black text-slate-800  text-2xl tracking-tight m-0">
        {title}
      </h2>
      <div className="h-0.5 bg-gradient-to-r from-blue-500/20 to-transparent mt-2" />
    </div>
  </div>
);

function EnquiryRegistraionForm() {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  // We keep separate states for basic and medical, but initialize empty objects to avoid undefined errors
  const [patientBasic, setPatientBasic] = useState({});
  const [formData, setFormData] = useState({});
  const [billsId, setBillsId] = useState();
  const [patientDocumentId, setPatientDocumentId] = useState();
  const [treatmentTrackerId, setTreatmentTrackerId] = useState();
  const [sessionNotesId, setSessionNotesId] = useState();
  const [assessmentId, setAssmentId] = useState();
  const [prescriptionId, setPrescriptionId] = useState([]);
  const [loading, setLoading] = useState(false);

  const patientSessionDetails = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("patientDetails")) || {};
    } catch {
      return {};
    }
  }, []);

  // Fetch patient basic information by ID
  const fetchPatientBasic = async () => {
    if (patient_id || patientBasic.patientId) {
      try {
        const { data } = await AxiosInstance.get(
          `/patient/get-by-id/${patient_id || patientBasic.patientId}`
        );

        setPatientBasic(data?.patient || {});
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Fetch patient medical/registration details by patient ID
  const fetchPatientMedical = async () => {
    if (patient_id || patientBasic.patientId) {
      try {
        const data = await AxiosInstance.get(
          `/patientregistration/get-by-patient/${patient_id || patientBasic.patientId
          }`
        );
        setFormData(data?.data?.patient || {});
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (patient_id) {
      fetchPatientBasic();
      fetchPatientMedical();
    } else {
      setPatientBasic({});
      setFormData({});
    }
  }, [patient_id]);

  // Create or update basic patient details
  const saveBasicDetails = async () => {
    if (!patientBasic.patientName?.trim()) {
      message.error("Patient Name is required");
      return;
    }
    if (!patientBasic.patientPhone?.trim()) {
      message.error("Patient Phone is required");
      return;
    }
    setLoading(true);

    const formDataPayload = new FormData();
    Object.keys(patientBasic).forEach((key) => {
      if (key !== "profileImgFile" && key !== "profileImgPreview" && patientBasic[key] !== undefined && patientBasic[key] !== null) {
        if (Array.isArray(patientBasic[key])) {
          patientBasic[key].forEach(val => formDataPayload.append(key, val));
        } else {
          formDataPayload.append(key, patientBasic[key]);
        }
      }
    });

    formDataPayload.append("clinicId", user?.clinicId);

    if (patientBasic.profileImgFile) {
      formDataPayload.append("profileImg", patientBasic.profileImgFile);
    } else if (!patientBasic.profileImg) {
      let fallbackUrl = "https://avatar.iran.liara.run/public";
      const gender = patientBasic.patientGender?.toLowerCase();
      const age = parseInt(patientBasic.patientAge) || 25;
      
      if (gender === "female") {
        fallbackUrl += age < 18 ? "/girl" : "/woman";
      } else {
        fallbackUrl += age < 18 ? "/boy" : "/man";
      }
      formDataPayload.append("profileImg", fallbackUrl);
    }

    try {
      if (patientBasic._id) {
        const response = await AxiosInstance.put(
          `/patient/edit/${patientBasic._id}`,
          formDataPayload
        );

        message.success("Patient details updated successfully");
      } else {
        const response = await AxiosInstance.post("/patient/create", formDataPayload);
        setPatientBasic(response.data.patient);
        sessionStorage.setItem(
          "patientDetails",
          JSON.stringify(response.data.patient)
        );
        navigate(`/administration/identicards?patientId=${response?.data?.patient?.patientId}&autostart=true`);
        message.success("Patient registered successfully");
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to save patient details");
    } finally {
      setLoading(false);
    }
  };

  const getBillsId = async () => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-bill/get-patient/${patient_id}`
      );

      // Use reduce to collect all _id values
      const billIds = response.data.data.reduce((acc, bill) => {
        if (bill._id) {
          acc.push(bill._id);
        }
        return acc;
      }, []);

      setBillsId(billIds); // store all IDs in state
    } catch (error) {
      console.error(error);
    }
  };
  const getDocId = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patientdocuments/get-by-patient-id/${patient_id}`
      );

      const docIds = response.data.documents.reduce((acc, doc) => {
        if (doc._id) {
          acc.push(doc._id);
        }
        return acc;
      }, []);
      setPatientDocumentId(docIds); // store all IDs in state
    } catch (error) {
      console.error(error);
    }
  };
  const getAssessmentId = async () => {
    try {
      const response = await AxiosInstance.get(`/assessment/get/${patient_id}`);
      if (response.data?.data) {
        setAssmentId(response.data.data._id);
      }
    } catch (error) {
      console.error("Assessment fetch error:", error);
    }
  };

  const getTreatmentTrackerId = async () => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-tracker/patient/${patient_id}`
      );
      setTreatmentTrackerId(response?.data?._id); // store all IDs in state
    } catch (error) {
      console.error(error);
    }
  };
  const getSessionNotesId = async () => {
    try {
      const response = await AxiosInstance.get(
        `/session-notes/get-patient/${patient_id}`
      );

      // Use reduce to collect all _id values
      const sessionIds = response.data.data.reduce((acc, session) => {
        if (session._id) {
          acc.push(session._id);
        }
        return acc;
      }, []);
      setSessionNotesId(sessionIds); // store all IDs in state
    } catch (error) {
      console.error(error);
    }
  };
  const getPrescriptionId = async () => {
    try {
      const response = await AxiosInstance.get(
        `/prescription/patient/${patient_id}`
      );

      const prescriptionId = response?.data?.data.reduce(
        (acc, prescription) => {
          if (prescription?._id) {
            acc.push(prescription?._id);
          }
          return acc;
        },
        []
      );
      setPrescriptionId(prescriptionId);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getBillsId();
    getDocId();
    getTreatmentTrackerId();
    getSessionNotesId();
    getAssessmentId();
    getPrescriptionId();
  }, []);

  const conformationToTreatmentHistory = async () => {
    const payload = {
      clinicId: user.clinicId,
      patientId: patient_id,
      treatmentId: formData?._id,
      date: Date(),
      medicalInformationId: formData?._id,
      billsId: billsId,
      patientDocumentId: patientDocumentId,
      treatmentTrackerId: treatmentTrackerId,
      sessionNotesId: sessionNotesId,
      assessmentId: assessmentId,
      prescriptionId: prescriptionId,
    };
    try {
      const res = await AxiosInstance.post("/treatment-history/add", payload);
      navigate("/home");
      message.success("Treatment history confirmed");
    } catch (error) {
      console.error(error);
      message.error("Failed to confirm treatment history");
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-slate-800  text-4xl tracking-tight">
            Patient <span className="text-blue-500">Registration</span>
          </h1>
          <p className="text-slate-500  font-medium">
            {patientBasic._id
              ? `Editing patient record: ${patientBasic.patientId || ''}`
              : "Create a new patient record and medical profile"
            }
          </p>
        </div>
        {patientBasic._id && (
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setPatientBasic({});
                setFormData({});
                navigate("/enquiry-registration");
              }}
              className="rounded-xl px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <Icon icon="tabler:user-plus" />
              New Registration
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/home")}
              className="rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Icon icon="tabler:arrow-left" />
              Back to Home
            </Button>
          </div>
        )}
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Basic Details Card */}
        <Card className="group relative overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60  transition-all duration-300">
          {/* Glow Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 bg-blue-500" />

          <div className="p-8 z-10">
            <SectionHeader
              title="Basic Details"
              icon="tabler:user-circle"
            />
            <PatientBasicDetails
              patientFormData={patientBasic}
              setPatientFormData={setPatientBasic}
            />
            <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
              {patientBasic._id ? (
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      delete patientBasic._id;
                      delete patientBasic.patientId;
                      saveBasicDetails();
                    }}
                    variant="secondary"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Icon icon="tabler:user-plus" className="mr-2" />
                    Save as New Patient
                  </Button>
                  <Button
                    onClick={saveBasicDetails}
                    loading={loading}
                    variant="primary"
                  >
                    <Icon icon="tabler:device-floppy" className="mr-2" />
                    Update Details
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={saveBasicDetails}
                  loading={loading}
                  variant="primary"
                >
                  <Icon icon="tabler:arrow-right" className="mr-2" />
                  Save & Continue
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Medical Form Card */}
        {user?.userType !== "receptionist" && (
          <Card className="group relative overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60  transition-all duration-300">
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 bg-emerald-500" />

            <div className="p-8 z-10">
              <SectionHeader
                title="Medical Information"
                icon="tabler:file-medical"
              />
              <PatientMedicalForm fetchPatientMedical={fetchPatientMedical} />
              {formData._id && (
                <div className="flex justify-end mt-8 pt-6 border-t border-slate-200 ">
                  <Button
                    onClick={conformationToTreatmentHistory}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 py-3 font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <Icon icon="tabler:circle-check" className="text-lg" />
                    Confirm Treatment Complete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default EnquiryRegistraionForm;
