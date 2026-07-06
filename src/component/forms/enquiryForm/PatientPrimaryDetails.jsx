import React from "react";

function PatientPrimaryDetails({ setFormData, formData }) {
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
          name: "primaryComplaints",
          label: "Primary Complaints",
          type: "text",
        },
        {
          name: "primary_whenDidSymptomsBegin",
          label: "When Did Symptoms Begin?",
          type: "text",
        },
        {
          name: "primary_HowDidSymptomsStart",
          label: "How Did Symptoms Start?",
          type: "radio",
          values: ["Gradually", "Suddenly", "After specific incident"],
        },
        {
          name: "primary_afterSpecificIncident",
          label: "After Specific Incident",
          type: "text",
        },
        {
          name: "primary_haveYouHadThisConditionBefore",
          label: "Have You Had This Condition Before",
          type: "radio",
          values: ["Yes", "No"],
        },
        { name: "primary_ifYesWhen", label: "If Yes When?", type: "text" },
        {
          name: "primary_howWasItTreated",
          label: "How Was It Treated?",
          type: "text",
        },
        {
          name: "primary_isYourCondition",
          label: "Is Your Condition",
          type: "radio",
          values: ["Improving", "Worsening", "Stable"],
        },
        {
          name: "primary_symptomsAre",
          label: "Symptoms Are",
          type: "radio",
          values: ["Constant", "Intermittent"],
        },
        {
          name: "primary_atRest",
          label: "At Rest",
          type: "range",
          min: 1,
          max: 10,
        },
        {
          name: "primary_duringActivity",
          label: "During Activity",
          type: "range",
          min: 1,
          max: 10,
        },
        {
          name: "primary_atItsWorst",
          label: "At Its Worst",
          type: "range",
          min: 1,
          max: 10,
        },
      ].map((item, index) => (
        <div key={index}>
          <label>{item.label}</label>
          {item.type === "radio" ? (
            <div className="flex flex-row flex-wrap gap-2 min-h-10">
              {item.values.map((value, index1) => (
                <label
                  key={index1}
                  className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                    formData?.[item.name] === value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded-full`}
                >
                  <input
                    onChange={handleInputChange}
                    type="radio"
                    name={item.name}
                    value={value}
                    checked={formData?.[item.name] === value}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : (
            <div className="w-full border p-2 rounded-md shadow flex flex-row gap-3 items-center justify-center">
              <input
                type={item.type}
                className="w-full"
                onChange={handleInputChange}
                name={item.name}
                value={formData?.[item?.name]}
                min={item.min ? item.min : null}
                max={item.max ? item.max : null}
              />
              <p className="font-bold m-0">{item.type === "range" && formData?.[item?.name]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PatientPrimaryDetails;
