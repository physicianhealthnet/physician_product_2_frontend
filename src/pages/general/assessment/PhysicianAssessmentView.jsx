import React from "react";
import Card from "../../../component/ui/Card";

const Section = ({ title, children }) => (
  <div className="mb-6 border border-slate-200  rounded-lg p-4 bg-slate-50 ">
    <h2 className="text-xl font-bold mb-3 text-slate-800 ">{title}</h2>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex gap-2 mb-1">
    <span className="font-semibold w-64 text-slate-800 ">{label}:</span>
    <span className="text-slate-700 ">{value || "-"}</span>
  </div>
);

export default function PhysicianAssessmentView({ data }) {
  if (!data) return <p className="text-slate-500  text-center py-4">No data available</p>;

  const formatLabel = (str) => {
    if (!str) return "";
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const {
    medicalChecks,
    medicalNotes,
    chiefComplaints,
    historyOfPresentIllness,
    vitals,
    generalExamination,
    systemicExamination,
    treatment,
    patientId,
    createdAt,
    updatedAt,
  } = data;

  const hasMedicalHistoryData = medicalChecks && Object.values(medicalChecks).some(Boolean);
  const hasVitalsData = vitals && Object.values(vitals).some(Boolean);
  const hasSystemicExamData = systemicExamination && Object.values(systemicExamination).some(Boolean);
  const hasTreatmentData =
    treatment &&
    ((treatment.diagnosis && treatment.diagnosis.length > 0) ||
      (treatment.plan && treatment.plan.length > 0) ||
      treatment.cost ||
      treatment.followUp ||
      treatment.consent !== undefined);

  return (
    <Card className="max-w-5xl mx-auto text-sm shadow-sm">
      {/* HEADER */}
      <div className="text-center mb-8 border-b border-slate-200  pb-4">
        <h1 className="text-2xl font-bold text-slate-900  mb-2">Physician Assessment Record</h1>
        <p className="text-slate-600  font-medium">Patient ID: {patientId}</p>
        <div className="flex justify-center gap-4 mt-2">
          {createdAt && (
            <p className="text-slate-500  text-xs">
              Recorded: {new Date(createdAt).toLocaleString()}
            </p>
          )}
          {updatedAt && (
            <p className="text-slate-500  text-xs">
              Last Updated: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* CHIEF COMPLAINTS & HPI */}
      {(chiefComplaints || historyOfPresentIllness) && (
        <Section title="Clinical Presentation">
          {chiefComplaints && (
            <div className="mb-4">
              <strong className="block text-slate-800  mb-1">Chief Complaints:</strong>
              <p className="text-slate-700  bg-white  p-3 rounded border border-slate-100 ">{chiefComplaints}</p>
            </div>
          )}
          {historyOfPresentIllness && (
            <div>
              <strong className="block text-slate-800  mb-1">History of Present Illness (HPI):</strong>
              <p className="text-slate-700  bg-white  p-3 rounded border border-slate-100 ">{historyOfPresentIllness}</p>
            </div>
          )}
        </Section>
      )}

      {/* VITALS */}
      {hasVitalsData && (
        <Section title="Vital Signs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-y-2 gap-x-8 bg-white  p-4 rounded border border-slate-100 ">
            {vitals.bloodPressure && <Row label="Blood Pressure" value={`${vitals.bloodPressure} mmHg`} />}
            {vitals.pulseRate && <Row label="Pulse Rate" value={`${vitals.pulseRate} bpm`} />}
            {vitals.temperature && <Row label="Temperature" value={`${vitals.temperature} \u00B0F/\u00B0C`} />}
            {vitals.respiratoryRate && <Row label="Respiratory Rate" value={`${vitals.respiratoryRate} /min`} />}
            {vitals.spO2 && <Row label="SpO2" value={`${vitals.spO2}%`} />}
            {vitals.weight && <Row label="Weight" value={`${vitals.weight} kg`} />}
          </div>
        </Section>
      )}

      {/* EXAMINATION */}
      {(generalExamination || hasSystemicExamData) && (
        <Section title="Physical Examination">
          {generalExamination && (
            <div className="mb-4">
              <strong className="block text-slate-800  mb-1">General Examination:</strong>
              <p className="text-slate-700  bg-white  p-3 rounded border border-slate-100 ">{generalExamination}</p>
            </div>
          )}
          {hasSystemicExamData && (
            <div>
              <strong className="block text-slate-800  mb-2">Systemic Examination:</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemicExamination.cvs && (
                  <div className="bg-white  p-3 rounded border border-slate-100 ">
                    <span className="font-semibold text-slate-800  block mb-1">Cardiovascular System (CVS):</span>
                    <span className="text-slate-700 ">{systemicExamination.cvs}</span>
                  </div>
                )}
                {systemicExamination.rs && (
                  <div className="bg-white  p-3 rounded border border-slate-100 ">
                    <span className="font-semibold text-slate-800  block mb-1">Respiratory System (RS):</span>
                    <span className="text-slate-700 ">{systemicExamination.rs}</span>
                  </div>
                )}
                {systemicExamination.cns && (
                  <div className="bg-white  p-3 rounded border border-slate-100 ">
                    <span className="font-semibold text-slate-800  block mb-1">Central Nervous System (CNS):</span>
                    <span className="text-slate-700 ">{systemicExamination.cns}</span>
                  </div>
                )}
                {systemicExamination.pa && (
                  <div className="bg-white  p-3 rounded border border-slate-100 ">
                    <span className="font-semibold text-slate-800  block mb-1">Per Abdomen (PA):</span>
                    <span className="text-slate-700 ">{systemicExamination.pa}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* MEDICAL HISTORY */}
      {hasMedicalHistoryData && (
        <Section title="Medical History">
          <div className="bg-white  p-4 rounded border border-slate-100 ">
            {Object.entries(medicalChecks || {}).map(([condition, checked]) =>
              checked ? (
                <Row
                  key={condition}
                  label={formatLabel(condition)}
                  value={medicalNotes?.[condition] || "Yes"}
                />
              ) : null
            )}
          </div>
        </Section>
      )}

      {/* DIAGNOSIS & PLAN */}
      {hasTreatmentData && (
        <Section title="Assessment & Plan">
          {treatment.diagnosis && treatment.diagnosis.length > 0 && (
            <div className="mb-4">
              <strong className="block text-slate-800  mb-2">Diagnosis:</strong>
              <ul className="space-y-2">
                {treatment.diagnosis.map((diag, index) => (
                  <li key={index} className="flex justify-between items-center bg-white  p-3 border border-slate-100  rounded shadow-sm">
                    <span className="text-slate-800  font-medium">{diag.text}</span>
                    <span className="text-sm text-slate-500  bg-slate-100  px-2 py-1 rounded">{diag.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {treatment.plan && treatment.plan.length > 0 && (
            <div className="mb-4">
              <strong className="block text-slate-800  mb-2">Treatment Plan:</strong>
              <ul className="space-y-2">
                {treatment.plan.map((plan, index) => (
                  <li key={index} className="flex justify-between items-center bg-white  p-3 border border-slate-100  rounded shadow-sm">
                    <span className="text-slate-800  font-medium">{plan.text}</span>
                    <span className="text-sm text-slate-500  bg-slate-100  px-2 py-1 rounded">{plan.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-white  p-4 rounded border border-slate-100  flex flex-col gap-2">
              {treatment.cost && (
                <Row label="Estimated Cost" value={`$${treatment.cost}`} />
              )}
              {treatment.followUp && (
                <Row label="Follow Up" value={treatment.followUp} />
              )}
              {treatment.consent !== undefined && (
                <Row
                  label="Consent Given"
                  value={treatment.consent ? "Yes" : "No"}
                />
              )}
          </div>
        </Section>
      )}
    </Card>
  );
}
