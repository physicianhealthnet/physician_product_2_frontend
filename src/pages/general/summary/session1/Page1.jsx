import formatDateToDDMMYYYY from "../../../../utilities/formatter";
import { useEffect, useState } from "react";
function Page1({ page1Ref, patientMinimalData, patientMedicalData }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const patientAssessmentData = [
    {
      section: "Basic Info",
      fields: [
        { label: "Patient ID", data: patientMedicalData?.patientId },
        {
          label: "Treatment Start Date",
          data: patientMedicalData?.treatment_start_date,
        },
        {
          label: "Treatment End Date",
          data: patientMedicalData?.treatment_start_end,
        },
        { label: "Date of Assessment", data: patientMedicalData?.DoA },
        { label: "Referred By", data: patientMedicalData?.ReferredBy },
        { label: "Assessed By", data: patientMedicalData?.By },
        { label: "Time", data: patientMedicalData?.time },
      ],
    },
    {
      section: "Physical Details",
      fields: [
        { label: "Dominant Hand", data: patientMedicalData?.dominantHand },
        {
          label: "Somatotype",
          data: patientMedicalData?.somatotype?.join(", "),
        },
        { label: "Height (cm)", data: patientMedicalData?.patient_hight },
        { label: "Weight (kg)", data: patientMedicalData?.patient_weight },
        { label: "Blood Pressure", data: patientMedicalData?.patient_BP },
      ],
    },
    {
      section: "Primary Complaints",
      fields: [
        { label: "Complaint", data: patientMedicalData?.primaryComplaints },
        {
          label: "When Did Symptoms Begin",
          data: patientMedicalData?.primary_whenDidSymptomsBegin,
        },
        {
          label: "How Did Symptoms Start",
          data: patientMedicalData?.primary_HowDidSymptomsStart,
        },
        {
          label: "After Specific Incident",
          data: patientMedicalData?.primary_afterSpecificIncident,
        },
        {
          label: "Had This Condition Before",
          data: patientMedicalData?.primary_haveYouHadThisConditionBefore,
        },
        { label: "If Yes, When", data: patientMedicalData?.primary_ifYesWhen },
        {
          label: "How Was It Treated",
          data: patientMedicalData?.primary_howWasItTreated,
        },
        {
          label: "Condition Status",
          data: patientMedicalData?.primary_isYourCondition,
        },
        {
          label: "Symptoms Are",
          data: patientMedicalData?.primary_symptomsAre,
        },
        { label: "At Rest", data: patientMedicalData?.primary_atRest },
        {
          label: "During Activity",
          data: patientMedicalData?.primary_duringActivity,
        },
        { label: "At Its Worst", data: patientMedicalData?.primary_atItsWorst },
      ],
    },
  ];

  return (
    <div ref={page1Ref} className="p-5 flex flex-col w-full gap-5">
      <div className="w-full flex flex-col items-center justify-between">
        <h1 className="font-bold text-3xl text-gray-800 m-0">
          Patient & Treatment Summary
        </h1>
        <div className="w-full flex flex-row items-center justify-between gap-2">
          <div>
            <div className="flex flex-row items-center gap-2 w-full">
              <h1 className="text-blue-600 font-bold text-2xl">Physician</h1>
            </div>
            <p className="m-0 text-gray-600 w-full font-bold">Address</p>
          </div>
          <div className="font-bold text-gray-600">
            <p>
              Date:{" "}
              {formatDateToDDMMYYYY(new Date().toISOString().split("T")[0])}
            </p>
            <p>Time: {time}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-gray-700 text-2xl m-0">
          Patient Details
        </h1>
        <div>
          {[
            { lable: "Name", data: patientMinimalData?.patientName },
            { lable: "Id", data: patientMinimalData?.patientId },
            { lable: "Age", data: patientMinimalData?.patientAge },
            { lable: "Gender", data: patientMinimalData?.patientGender },
            {
              lable: "DOB",
              data: formatDateToDDMMYYYY(patientMinimalData?.patientDOB),
            },
            { lable: "Email", data: patientMinimalData?.patientEmail },
            { lable: "Phone", data: patientMinimalData?.patientPhone },
            { lable: "Address", data: patientMinimalData?.patientAddress },
            { lable: "Aadhar", data: patientMinimalData?.patientAadhar },
          ].map((data, index) => (
            <p key={index} className="text-gray-600 font-medium m-0">
              <span className="text-gray-700 font-bold">{data?.lable} :</span>{" "}
              {data?.data}
            </p>
          ))}
        </div>
        <h1 className="font-bold text-gray-700 text-2xl mt-2 m-0">
          Patient Medical Information
        </h1>
        <div className="flex flex-col gap-4">
          {patientAssessmentData.map((section, sectionIndex) => (
            <div key={sectionIndex} className="">
              <div className="flex flex-row items-center gap-2 ">
                <h2 className="font-semibold text-gray-800 text-xl text-nowrap my-2">
                  {section.section}
                </h2>
                <hr className="w-full border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="flex flex-row gap-3">
                    <span className="text-gray-700 font-bold">
                      {field.label}:
                    </span>
                    <span className="text-gray-600">{field.data || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Page1;
