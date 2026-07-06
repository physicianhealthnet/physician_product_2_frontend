import React from "react";

function Page2({ patientMedicalData, page2Ref }) {
  const patientAssessmentData = [
    {
      section: "Secondary Complaints",
      fields: [
        { label: "Complaint", data: patientMedicalData?.secondaryComplaints },
        {
          label: "When Did Symptoms Begin",
          data: patientMedicalData?.secondary_whenDidSymptomsBegin,
        },
        {
          label: "How Did Symptoms Start",
          data: patientMedicalData?.secondary_HowDidSymptomsStart,
        },
        {
          label: "After Specific Incident",
          data: patientMedicalData?.secondary_afterSpecificIncident,
        },
        {
          label: "Had This Condition Before",
          data: patientMedicalData?.secondary_haveYouHadThisConditionBefore,
        },
        {
          label: "If Yes, When",
          data: patientMedicalData?.secondary_ifYesWhen,
        },
        {
          label: "How Was It Treated",
          data: patientMedicalData?.secondary_howWasItTreated,
        },
        {
          label: "Condition Status",
          data: patientMedicalData?.secondary_isYourCondition,
        },
        {
          label: "Symptoms Are",
          data: patientMedicalData?.secondary_symptomsAre,
        },
        { label: "At Rest", data: patientMedicalData?.secondary_atRest },
        {
          label: "During Activity",
          data: patientMedicalData?.secondary_duringActivity,
        },
        {
          label: "At Its Worst",
          data: patientMedicalData?.secondary_atItsWorst,
        },
      ],
    },
    {
      section: "Medical History",
      fields: [
        {
          label: "Conditions",
          data: patientMedicalData?.medicalHistory?.join(", "),
        },
        { label: "Other", data: patientMedicalData?.medicalHistoryOther },
        { label: "Diabetes Type", data: patientMedicalData?.diabetesType },
        { label: "COVID-19 Date", data: patientMedicalData?.COVID_19Date },
        {
          label: "Diagnostic Tests",
          data: patientMedicalData?.diagnosticTest_forYourCurrentCondition?.join(
            ", "
          ),
        },
        {
          label: "Other Diagnostic Test",
          data: patientMedicalData?.diagnosticTest_forYourCurrentConditionOther,
        },
        {
          label: "Diagnosis Description",
          data: patientMedicalData?.discribeDiagnosis,
        },
      ],
    },
    {
      section: "Occupation Details",
      fields: [
        {
          label: "Occupation / Role",
          data: patientMedicalData?.NOF_occupationOrPrimaryRole,
        },
        {
          label: "Work Environment",
          data: patientMedicalData?.NOF_workEnvironment?.join(", "),
        },
        {
          label: "Other Work Environment",
          data: patientMedicalData?.NOF_workEnvironmentOther,
        },
        {
          label: "Common Physical Activities",
          data: patientMedicalData?.NOF_commonPhysicalActivities?.join(", "),
        },
        {
          label: "Other Physical Activities",
          data: patientMedicalData?.NOF_commonPhysicalActivitiesOther,
        },
        {
          label: "Work Hours",
          data: patientMedicalData?.NOF_durationofWorkHours,
        },
        {
          label: "Any Work-Related Pain",
          data: patientMedicalData?.NOF_anyWorkRelatedPain,
        },
        {
          label: "If Yes, Specify",
          data: patientMedicalData?.NOF_ifYesSpecify,
        },
      ],
    },
    {
      section: "Daily Activity Level",
      fields: [
        {
          label: "General Activity Level",
          data: patientMedicalData?.DAL_GeneralActivityLevel,
        },
        {
          label: "Regular Activities",
          data: patientMedicalData?.DAL_regularActivities,
        },
      ],
    },
    {
      section: "Exercise Routine",
      fields: [
        { label: "Type", data: patientMedicalData?.ER_type },
        { label: "Frequency", data: patientMedicalData?.ER_frequency },
        { label: "Duration", data: patientMedicalData?.ER_duration },
      ],
    },
    {
      section: "Sports Activity",
      fields: [
        { label: "Type of Sports", data: patientMedicalData?.SA_typeOfSports },
        { label: "Level", data: patientMedicalData?.SA_level },
        { label: "Frequency", data: patientMedicalData?.SA_frequency },
        { label: "Duration", data: patientMedicalData?.SA_duration },
        {
          label: "Sports Injuries",
          data: patientMedicalData?.SA_anySportsRelatedInjuries,
        },
        { label: "If Yes, Specify", data: patientMedicalData?.SA_ifYesSpecify },
        {
          label: "Physical Limitations",
          data: patientMedicalData?.SA_anyPhysicalLimitationsOrRestrictions,
        },
        {
          label: "If Yes, Specify",
          data: patientMedicalData?.SA_anyPhysicalLimitationsOrRestrictionsIfYesSpecify,
        },
      ],
    },
    {
      section: "Previous Rehabilitation / Treatment",
      fields: [
        {
          label: "Previously Received",
          data: patientMedicalData?.PRT_haveYouPreviouslyReceived?.join(", "),
        },
        {
          label: "Other",
          data: patientMedicalData?.PRT_haveYouPreviouslyReceivedOther,
        },
        { label: "Dates", data: patientMedicalData?.PRT_Dates },
        {
          label: "For What Condition",
          data: patientMedicalData?.PRT_forWhatCondition,
        },
        { label: "Results", data: patientMedicalData?.PRT_results },
      ],
    },
    {
      section: "Additional Information",
      fields: [
        { label: "Do You Smoke", data: patientMedicalData?.AI_doYouSmoke },
        {
          label: "Do You Consume Alcohol",
          data: patientMedicalData?.AI_doYouConsumeAlcohol,
        },
        {
          label: "Any Other Medical History Info",
          data: patientMedicalData?.AI_isThereAnyThingElseAboutYourMedicalHistory,
        },
      ],
    },
  ];
  return (
    <div
      ref={page2Ref}
      className="p-5 flex flex-col w-full gap-5"
    >
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
  );
}

export default Page2;
