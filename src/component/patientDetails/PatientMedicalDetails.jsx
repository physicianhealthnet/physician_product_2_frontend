import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import formatDateToDDMMYYYY from "../../utilities/formatter";
import { useEffect, useState } from "react";
import Button from "../ui/Button";

function PatientMedicalDetails({
  page1Ref,
  patientMedicalData,
  swaper,
  showTitle,
}) {
  console.log(patientMedicalData);

  const navigate = useNavigate();
  const { patient_id } = useParams();

  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const symptomLabels = {
    toothache: "Toothache",
    sensitivity: "Sensitivity",
    swelling: "Swelling",
    bleeding: "Bleeding Gums",
    bitingPain: "Pain on Biting",
  };

  const Section = ({ title, items }) => {
    // Filter items to only those with non-empty values
    const filteredItems = items.filter(
      (item) => item.value !== null && item.value !== undefined && item.value.toString().trim() !== ""
    );

    // Only render section if there are filtered items
    if (filteredItems.length === 0) return null;

    return (
      <div className="mb-6 p-4 rounded-none bg-slate-50  border border-slate-200 ">
        <h1 className="text-lg font-bold text-primary-700  mb-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary-600 rounded-full inline-block"></span>
          {title}
        </h1>
        <hr className="mb-4 border-slate-200 " />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
          {filteredItems.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-dashed border-slate-200  pb-2 last:border-0">
              <span className="font-semibold text-slate-700  text-sm whitespace-nowrap">{item.label}</span>
              <span className="text-slate-600  text-sm break-words text-left sm:text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!patientMedicalData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-500  mb-4 text-lg">
          No Physician Medical Details found for this patient.
        </p>

        {!swaper && (
          <Button
            onClick={() => navigate(`/enquiry-registration/${patient_id}`)}
            className="flex items-center gap-2"
          >
            <Icon icon="material-symbols:add-circle-outline" width={22} />
            Add Physician Medical Details
          </Button>
        )}
      </div>
    );
  }

  // Prepare symptoms items - only include those that are present
  const symptomsItems = (patientMedicalData.symptomData || [])
    .filter((symptom) => symptom.present)
    .map((symptom) => ({
      label: symptomLabels[symptom.key] || symptom.key,
      value: `Severity: ${symptom.severity}/10${symptom.notes ? `, Notes: ${symptom.notes}` : ""}`,
    }));

  return (
    <div ref={page1Ref}>
      {/* Patient Info */}
      {showTitle && (
        <div className="w-full flex flex-col items-center justify-between mb-8">
          <h1 className="font-bold text-3xl text-slate-800  m-0">
            Patient & Treatment Summary
          </h1>
          <div className="w-full flex flex-row items-center justify-between gap-2 mt-4">
            <div>
              <div className="flex flex-row items-center gap-2 w-full">
                <h1 className="text-primary-600  font-bold text-2xl">
                  Physician Clinic
                </h1>
              </div>
              <p className="m-0 text-slate-600  w-full font-medium">
                {" "}
                Reg. No 12345, Physician Clinic, <br />
                Central Medical Complex, Main Road, <br />
                City, State - 123456.
              </p>
            </div>
            <div className="font-bold text-slate-600  text-right">
              <p>
                Date:{" "}
                {formatDateToDDMMYYYY(new Date().toISOString().split("T")[0])}
              </p>
              <p>Time: {time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Information Section */}
      <Section
        title="Patient Information"
        items={[
          { label: "Patient ID", value: patientMedicalData.patientId },
          { label: "Name", value: patientMedicalData.patientName },
          { label: "Age", value: patientMedicalData.patientAge },
          { label: "Gender", value: patientMedicalData.patientGender },
          {
            label: "DOB",
            value: patientMedicalData.patientDOB
              ? formatDateToDDMMYYYY(patientMedicalData.patientDOB)
              : "",
          },
          { label: "Phone", value: patientMedicalData.patientPhone },
          { label: "Email", value: patientMedicalData.patientEmail },
          { label: "Address", value: patientMedicalData.patientAddress },
          { label: "Aadhar", value: patientMedicalData.patientAadhar },
        ]}
      />

      {/* Chief Complaint Section */}
      <Section
        title="Chief Complaint"
        items={[
          {
            label: "Primary Complaint",
            value: patientMedicalData.primaryComplaint,
          },
          { label: "Duration", value: patientMedicalData.duration },
          { label: "Pain Score", value: patientMedicalData.painScore },
        ]}
      />

      {/* General Data Section */}
      <Section
        title="General Data"
        items={[
          {
            label: "BP (mm Hg)",
            value: patientMedicalData.bp,
          },
          {
            label: "RBS (mg/dL)",
            value: patientMedicalData.rbs,
          },
        ]}
      />

      {/* Symptoms Section */}
      <Section title="Symptoms" items={symptomsItems} />

      {/* Physician History Section */}
      <Section
        title="Physician History"
        items={[
          {
            label: "Last Physician Visit",
            value: patientMedicalData.lastPhysicianVisit,
          },
          {
            label: "Previous Treatments",
            value: patientMedicalData.previousTreatments,
          },
          {
            label: "History of Extraction",
            value: patientMedicalData.historyExtraction,
          },
          {
            label: "Orthodontic Treatment",
            value: patientMedicalData.orthodontic,
          },
          { label: "Bruxism", value: patientMedicalData.bruxism },
          { label: "Floss", value: patientMedicalData.floss },
        ]}
      />

      {/* Oral Hygiene Habits Section */}
      <Section
        title="Oral Hygiene Habits"
        items={[
          { label: "Smoking", value: patientMedicalData.smoking },
          { label: "Alcohol Consumption", value: patientMedicalData.alcohol },
        ]}
      />

      {/* Medical History Section */}
      <Section
        title="Medical History"
        items={[
          { label: "Known Conditions", value: patientMedicalData.conditions },
          { label: "Allergies", value: patientMedicalData.allergies },
          {
            label: "Current Medications",
            value: patientMedicalData.medications,
          },
          {
            label: "Under Physician Care",
            value: patientMedicalData.underCare,
          },
          {
            label: "Physician Reason",
            value: patientMedicalData.physicianReason,
          },
          { label: "Pregnant", value: patientMedicalData.pregnant },
        ]}
      />
    </div>
  );
}

export default PatientMedicalDetails;