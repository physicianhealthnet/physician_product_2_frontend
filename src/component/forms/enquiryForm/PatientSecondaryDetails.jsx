import React from "react";

function PatientSecondaryDetails({ setFormData, formData }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  return (
    <div className="grid grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 max-md:grid-cols-1 gap-4 p-4">
      {[
        {
          name: "secondaryComplaints",
          label: "Secondary Complaints",
          type: "text",
        },
        {
          name: "secondary_whenDidSymptomsBegin",
          label: "When Did Symptoms Begin?",
          type: "text",
        },
        {
          name: "secondary_HowDidSymptomsStart",
          label: "How Did Symptoms Start?",
          type: "radio",
          values: ["Gradually", "Suddenly", "After specific incident"],
        },
        {
          name: "secondary_afterSpecificIncident",
          label: "After Specific Incident",
          type: "text",
        },
        {
          name: "secondary_haveYouHadThisConditionBefore",
          label: "Have You Had This Condition Before",
          type: "radio",
          values: ["Yes", "No"],
        },
        { name: "secondary_ifYesWhen", label: "If Yes When?", type: "text" },
        {
          name: "secondary_howWasItTreated",
          label: "How Was It Treated?",
          type: "text",
        },
        {
          name: "secondary_isYourCondition",
          label: "Is Your Condition",
          type: "radio",
          values: ["Improving", "Worsening", "Stable"],
        },
        {
          name: "secondary_symptomsAre",
          label: "Symptoms Are",
          type: "radio",
          values: ["Constant", "Intermittent"],
        },
        { name: "secondary_atRest", label: "At Rest", type: "number" },
        {
          name: "secondary_duringActivity",
          label: "During Activity",
          type: "number",
        },
        {
          name: "secondary_atItsWorst",
          label: "At Its Worst",
          type: "number",
        },
      ].map((item, index) => (
        <div key={index}>
          <label>{item.label}</label>
          {item.type === "radio" ? (
            <div className="flex flex-row flex-wrap gap-2 min-h-10">
              {item.values.map((value, index1) => (
                <label key={index1} className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                      formData?.[item.name] === value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    } rounded-full`}>
                  <input
                    onChange={handleInputChange}
                    type="radio"
                    name={item.name}
                    value={value}
                    checked={formData?.[item?.name] === value}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : (
            <input
              type={item.type}
              className="w-full border p-2 rounded-md shadow"
              onChange={handleInputChange}
              name={item.name}
              value={formData?.[item.name]}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default PatientSecondaryDetails;
