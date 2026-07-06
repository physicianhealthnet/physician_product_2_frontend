import React from "react";

function PatientInformation({ patientInfo, patientMedicalData }) {
  if (!patientInfo) {
    return (
      <div className="mt-4 w-full min-h-[40vh] shadow-lg rounded-md border-t-4 border-gray-400 bg-white">
        <div className="p-6 text-center text-gray-600">
          No patient information available.
        </div>
      </div>
    );
  }

  const formatedDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="mt-4 w-full min-h-[40vh] shadow-lg rounded-md border-t-4 border-gray-400 bg-white">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            { label: "DoA:", value: formatedDate(patientMedicalData?.DoA) },
            { label: "By:", value: patientMedicalData?.By },
            { label: "Referred by:", value: patientMedicalData?.ReferredBy },
            { label: "Name:", value: patientInfo?.patientName },
            { label: "Age:", value: patientInfo?.patientAge },
            { label: "DoB:", value: patientInfo?.patientDOB },
            { label: "Sex:", value: patientInfo?.patientGender },
            {
              label: "Dominant Hand:",
              value: patientMedicalData?.dominantHand,
            },
            { label: "Somatotype:", value: patientMedicalData?.somatotype },
            { label: "Ht:", value: patientMedicalData?.patient_hight },
            { label: "Wt:", value: patientMedicalData?.patient_weight },
            { label: "BP:", value: patientMedicalData?.patient_BP },
            { label: "time :", value: patientMedicalData?.time },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-2">
              <p className="font-bold">{item.label}</p>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Primary Complaints
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Primary complaints:",
              value: patientMedicalData?.primaryComplaints,
            },
            {
              label: "When did symptoms begin?",
              value: patientMedicalData?.primary_whenDidSymptomsBegin,
            },
            {
              label: "How did symptoms start?",
              value: patientMedicalData?.primary_HowDidSymptomsStart,
            },
            {
              label: "Have you had this condition before?",
              value: patientMedicalData?.primary_haveYouHadThisConditionBefore,
            },
            {
              label: "If yes, when?",
              value: patientMedicalData?.primary_ifYesWhen,
            },
            {
              label: "How was it treated?",
              value: patientMedicalData?.primary_howWasItTreated,
            },
            {
              label: "Is your condition:",
              value: patientMedicalData?.primary_isYourCondition,
            },
            {
              label: "symptoms are:",
              value: patientMedicalData?.primary_symptomsAre,
            },
            {
              label: "Pain Rating At rest:",
              value: patientMedicalData?.primary_atRest,
            },
            {
              label: "Pain Rating During activity:",
              value: patientMedicalData?.primary_duringActivity,
            },
            {
              label: "Pain Rating At its worst:",
              value: patientMedicalData?.primary_atItsWorst,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-2">
              <p className="font-bold">{item.label}</p>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Secondary Complaints
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Secondary complaints:",
              value: patientMedicalData?.secondaryComplaints,
            },
            {
              label: "When did symptoms begin?",
              value: patientMedicalData?.secondary_whenDidSymptomsBegin,
            },
            {
              label: "How did symptoms start?",
              value: patientMedicalData?.secondary_HowDidSymptomsStart,
            },
            {
              label: "Have you had this condition before?",
              value:
                patientMedicalData?.secondary_haveYouHadThisConditionBefore,
            },
            {
              label: "If yes, when?",
              value: patientMedicalData?.secondary_ifYesWhen,
            },
            {
              label: "How was it treated?",
              value: patientMedicalData?.secondary_howWasItTreated,
            },
            {
              label: "Is your condition:",
              value: patientMedicalData?.secondary_isYourCondition,
            },
            {
              label: "symptoms are:",
              value: patientMedicalData?.secondary_symptomsAre,
            },
            {
              label: "Pain Rating At rest:",
              value: patientMedicalData?.secondary_atRest,
            },
            {
              label: "Pain Rating During activity:",
              value: patientMedicalData?.secondary_duringActivity,
            },
            {
              label: "Pain Rating At its worst:",
              value: patientMedicalData?.secondary_atItsWorst,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-2">
              <p className="font-bold">{item.label}</p>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Medical History
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Medical History:",
              value: patientMedicalData?.medicalHistory,
            },
            {
              label: "Other",
              value: patientMedicalData?.medicalHistoryOther,
            },
            {
              label: "Diabetes Type?",
              value: patientMedicalData?.diabetesType,
            },
            {
              label: "COVID 19 Date?",
              value: patientMedicalData?.COVID_19Date,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Diagnostic Tests
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label:
                "Have you had any of the following tests for your current condition?",
              value: patientMedicalData?.diagnosticTest_forYourCurrentCondition,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Nature of Work
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Occupation/Primary Role:",
              value: patientMedicalData?.NOF_occupationOrPrimaryRole,
            },
            {
              label: "Work Environment:",
              value:
                patientMedicalData?.NOF_workEnvironment ||
                patientMedicalData?.NOF_workEnvironmentOther,
            },
            {
              label: "Common Physical Activities:",
              value:
                patientMedicalData?.NOF_commonPhysicalActivities ||
                patientMedicalData?.NOF_commonPhysicalActivities,
            },
            {
              label: "Duration of Work Hours:",
              value: patientMedicalData?.NOF_commonPhysicalActivities,
            },
            {
              label: "hours/day Any Work-Related Pain or Discomfort?",
              value: patientMedicalData?.NOF_anyWorkRelatedPain,
            },
            {
              label: "If yes, specify:",
              value: patientMedicalData?.NOF_ifYesSpecify,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Daily Activity Level
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "General Activity Level:",
              value: patientMedicalData?.DAL_GeneralActivityLevel,
            },
            {
              label: "Regular Activities:",
              value: patientMedicalData?.DAL_regularActivities,
            },
            {
              label: "Exercise Routine Type:",
              value: patientMedicalData?.ER_type,
            },
            {
              label: "Frequency:",
              value: patientMedicalData?.ER_frequency,
            },
            {
              label: "Duration:",
              value: patientMedicalData?.ER_duration,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Sporting Activity
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Type of Sport:",
              value: patientMedicalData?.SA_typeOfSports,
            },
            {
              label: "Level:",
              value: patientMedicalData?.SA_level,
            },
            {
              label: "Frequency:",
              value: patientMedicalData?.SA_frequency,
            },
            {
              label: "Duration:",
              value: patientMedicalData?.SA_duration,
            },
            {
              label: "Any Sports-Related Injuries?",
              value: patientMedicalData?.SA_anySportsRelatedInjuries,
            },
            {
              label: "if yes, specify:",
              value: patientMedicalData?.SA_ifYesSpecify,
            },
            {
              label: "Any Physical Limitations or Restrictions?",
              value:
                patientMedicalData?.SA_anyPhysicalLimitationsOrRestrictions,
            },
            {
              label: "if yes, specify:",
              value:
                patientMedicalData?.SA_anyPhysicalLimitationsOrRestrictionsIfYesSpecify,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Previous Rehabilitation/Treatment
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Have you previously received:",
              value: patientMedicalData?.PRT_haveYouPreviouslyReceived,
            },
            {
              label: "Dates:",
              value: patientMedicalData?.PRT_Dates,
            },
            {
              label: "for what condition?",
              value: patientMedicalData?.PRT_forWhatCondition,
            },
            {
              label: "Results:",
              value: patientMedicalData?.PRT_results,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-5 w-full my-5">
          <p className="text-nowrap text-lg text-center m-0 font-bold">
            Additional Information
          </p>
          <hr className="w-full border border-gray-300" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[
            {
              label: "Do you smoke?",
              value: patientMedicalData?.AI_doYouSmoke,
            },
            {
              label: "Do you consume alcohol?",
              value: patientMedicalData?.AI_doYouConsumeAlcohol,
            },
            {
              label:
                "Is there anything else about your medical history that might be helpful for your Doctor to know?",
              value:
                patientMedicalData?.AI_isThereAnyThingElseAboutYourMedicalHistory,
            },
          ].map((item,index) => (
            <div key={index} className="flex flex-row w-full justify-between gap-4">
              <p className="font-bold">{item.label}</p>
              <p>
                {Array.isArray(item.value)
                  ? item.value.join(", ")
                  : item.value || "nill"}
              </p>{" "}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientInformation;
