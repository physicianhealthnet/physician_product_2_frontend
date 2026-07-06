import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import Input from "../../ui/Input";
import Textarea from "../../ui/Textarea";
import Button from "../../ui/Button";

export default function PatientMedicalForm({ fetchPatientMedical }) {
  const { patient_id } = useParams();
  const navigate = useNavigate();

  const physicianFields = [
    { name: "primaryComplaint", label: "Primary Complaint", type: "textarea" },
    {
      name: "duration",
      label: "Duration",
      type: "radio",
      options: [
        "Less than 1 week",
        "1–4 weeks",
        "1–6 months",
        "More than 6 months",
      ],
    },
    { name: "lastPhysicianVisit", label: "Last Physician Visit", type: "date" },
    {
      name: "previousTreatments",
      label: "Previous Treatments",
      type: "textarea",
    },
    {
      name: "floss",
      label: "Do you floss?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      name: "historyExtraction",
      label: "History of extraction?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      name: "orthodontic",
      label: "Orthodontic treatment?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      name: "bruxism",
      label: "Teeth grinding?",
      type: "radio",
      options: ["Yes", "No"],
    },
  ];

  const medicalFields = [
    { name: "bp", label: "Blood Pressure (mm Hg)", type: "text" },
    { name: "rbs", label: "Random Blood Sugar (mg/dL)", type: "text" },
    {
      name: "underCare",
      label: "Under physician care?",
      type: "radio",
      options: ["Yes", "No"],
    },
    { name: "physicianReason", label: "If yes, reason", type: "text" },
    { name: "medications", label: "Current Medications", type: "textarea" },
    { name: "allergies", label: "Known Allergies", type: "textarea" },
    { name: "conditions", label: "Medical Conditions", type: "text" },
    {
      name: "smoking",
      label: "Smoking",
      type: "radio",
      options: ["No", "Yes"],
    },
    {
      name: "alcohol",
      label: "Alcohol",
      type: "radio",
      options: ["No", "Yes"],
    },
    {
      name: "pregnant",
      label: "Pregnant?",
      type: "radio",
      options: ["No", "Yes", "Not Applicable"],
    },
    { name: "painScore", label: "Pain Score (0-10)", type: "number" },
  ];

  const symptoms = [
    { label: "Toothache", key: "toothache" },
    { label: "Sensitivity", key: "sensitivity" },
    { label: "Swelling", key: "swelling" },
    { label: "Bleeding Gums", key: "bleeding" },
    { label: "Pain on Biting", key: "bitingPain" },
  ];

  const emptyForm = {
    clinicId: "",
    patientId: "",
    patientName: "",
    patientPhone: "",
    patientAddress: "",
    patientEmail: "",
    patientDOB: "",
    patientGender: "",
    patientAge: "",
    patientAadhar: "",

    primaryComplaint: "",
    duration: "",
    lastPhysicianVisit: "",
    previousTreatments: "",
    floss: "",
    historyExtraction: "",
    orthodontic: "",
    bruxism: "",

    bp: "",
    rbs: "",
    underCare: "",
    physicianReason: "",
    medications: "",
    allergies: "",
    conditions: "",
    smoking: "",
    alcohol: "",
    pregnant: "",
    painScore: "0",

    symptomData: symptoms.map((s) => ({
      key: s.key,
      present: false,
      severity: 5,
      notes: "",
    })),
  };

  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  const handleGetPatientInfo = async () => {
    try {
      const res = await AxiosInstance.get(`/patient/get-by-id/${patient_id}`);
      const data = res.data.patient;

      setForm((prev) => ({
        ...prev,
        clinicId: data?.clinicId,
        patientAadhar: data?.patientAadhar,
        patientAddress: data?.patientAddress,
        patientAge: data?.patientAge,
        patientDOB: data?.patientDOB,
        patientEmail: data?.patientEmail,
        patientGender: data?.patientGender,
        patientId: data?.patientId,
        patientName: data?.patientName,
        patientPhone: data?.patientPhone,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadExistingMedical = async () => {
    try {
      const res = await AxiosInstance.get(
        `/patientregistration/get-by-patient/${patient_id}`
      );

      // Adjust based on actual response structure; assuming { success: true, data: patient } or { patient }
      const existingData = res.data.data || res.data.patient || null;
      if (existingData) {
        // Merge with defaults to ensure symptomData is an array
        setForm((prev) => ({
          ...prev,
          ...existingData,
          symptomData: existingData.symptomData || emptyForm.symptomData,
        }));
      }
    } catch (err) {
      // If no existing data, form remains with patient info and defaults
      console.error(err);
    }
  };

  useEffect(() => {
    handleGetPatientInfo();
    handleLoadExistingMedical();
  }, [patient_id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (form?._id) {
        await AxiosInstance.patch(
          `/patientregistration/edit/${form._id}`,
          form
        );
        message.success("Updated Successfully");
      } else {
        await AxiosInstance.post(`/patientregistration/create`, form);
        message.success("Created Successfully");
      }
      // navigate(-1); // Don't navigate away, let user confirm treatment
      fetchPatientMedical();
    } catch (err) {
      message.error("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const updateSymptom = (index, updates) => {
    setForm((prev) => ({
      ...prev,
      symptomData: prev.symptomData.map((sym, i) =>
        i === index ? { ...sym, ...updates } : sym
      ),
    }));
  };

  const renderField = (fld) => {
    if (fld.type === "textarea") {
      return (
        <Textarea
          key={fld.name}
          label={fld.label}
          name={fld.name}
          value={form[fld.name] || ""}
          onChange={handleChange}
        />
      );
    }
    if (fld.type === "radio") {
      return (
        <div key={fld.name} className="flex flex-col gap-1.5 mb-2">
          <label className="text-sm font-medium text-slate-700 ">
            {fld.label}
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {fld.options.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="radio"
                    name={fld.name}
                    value={option}
                    checked={form[fld.name] === option}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300  rounded-full peer-checked:border-primary-600 peer-checked:after:opacity-100 after:content-[''] after:absolute after:top-1 after:left-1 after:w-2.5 after:h-2.5 after:bg-primary-600 after:rounded-full after:opacity-0 after:transition-all transition-all"></div>
                </div>
                <span className="text-slate-700  group-hover:text-primary-600 transition-colors">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    return (
      <Input
        key={fld.name}
        type={fld.type}
        label={fld.label}
        name={fld.name}
        value={form[fld.name] || ""}
        onChange={handleChange}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 ">Physician & Medical History</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Physician History Section */}
        <section className="bg-slate-50  p-6 rounded-xl border border-slate-200 ">
          <h3 className="text-lg font-semibold text-primary-700  mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full inline-block"></span>
            Physician History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {physicianFields.map(renderField)}
          </div>
        </section>

        {/* Symptoms Section */}
        <section className="bg-slate-50  p-6 rounded-xl border border-slate-200 ">
          <h3 className="text-lg font-semibold text-primary-700  mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full inline-block"></span>
            Symptoms
          </h3>
          <div className="space-y-4">
            {symptoms.map((s, index) => {
              const currentSymptom = form.symptomData[index] || {
                present: false,
                severity: 5,
                notes: "",
              };
              return (
                <div key={s.key} className={`p-4 rounded-lg border transition-all ${currentSymptom.present ? 'bg-white  border-primary-200  shadow-sm' : 'border-transparent hover:bg-white :bg-slate-800'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={currentSymptom.present}
                      onChange={(e) =>
                        updateSymptom(index, { present: e.target.checked })
                      }
                    />
                    <span className={`font-medium ${currentSymptom.present ? 'text-slate-900 ' : 'text-slate-600 '}`}>
                      {s.label}
                    </span>
                  </label>

                  {currentSymptom.present && (
                    <div className="mt-4 pl-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Severity (1-10)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            className="flex-1 h-2 bg-slate-200  rounded-lg appearance-none cursor-pointer accent-primary-600"
                            value={currentSymptom.severity}
                            onChange={(e) =>
                              updateSymptom(index, {
                                severity: parseInt(e.target.value),
                              })
                            }
                          />
                          <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white ${currentSymptom.severity < 4 ? 'bg-green-500' :
                            currentSymptom.severity < 7 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                            {currentSymptom.severity}
                          </span>
                        </div>
                      </div>

                      <Input
                        placeholder="Add specific notes about this symptom..."
                        value={currentSymptom.notes}
                        onChange={(e) =>
                          updateSymptom(index, { notes: e.target.value })
                        }
                        containerClassName="md:col-span-1"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Medical History Section */}
        <section className="bg-slate-50  p-6 rounded-xl border border-slate-200 ">
          <h3 className="text-lg font-semibold text-primary-700  mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full inline-block"></span>
            Medical History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medicalFields.map(renderField)}
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            loading={loading}
            size="lg"
          >
            {form?._id ? "Update Medical History" : "Submit Medical History"}
          </Button>
        </div>
      </form>
    </div>
  );
}
