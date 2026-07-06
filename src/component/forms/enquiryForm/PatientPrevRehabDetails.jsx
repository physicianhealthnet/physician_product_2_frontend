import React from "react";

function PatientPrevRehabDetails({ setFormData, formData }) {
  const treatments = [
    "Doctor",
    "Chiropractic",
    "Massage therapy",
    "Acupuncture",
    "Osteopathy",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        type === "checkbox"
          ? checked
            ? [...(prevData?.[name] || []), value]
            : (prevData?.[name] || []).filter((item) => item !== value)
          : value,
    }));
  };

  const renderInput = (label, name) => (
    <div>
      <label>{label}</label>
      <input
        type="text"
        name={name}
        value={formData?.[name] || ""}
        onChange={handleInputChange}
        className="w-full border p-2 rounded-md shadow"
      />
    </div>
  );

  return (
    <div className="flex flex-row flex-wrap gap-4 p-4">
      <div className="flex flex-col gap-4 w-full">
        <div>
          <label>Have you previously received:</label>
          <div className="flex flex-row gap-4">
            {treatments.map((treatment) => (
              <label
                key={treatment}
                className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                  formData?.PRT_haveYouPreviouslyReceived?.includes(treatment)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                } rounded-full`}
              >
                <input
                  type="checkbox"
                  name="PRT_haveYouPreviouslyReceived"
                  value={treatment}
                  onChange={handleInputChange}
                  checked={formData?.PRT_haveYouPreviouslyReceived?.includes(
                    treatment
                  )}
                />
                {treatment}
              </label>
            ))}
          </div>
        </div>
        {formData?.PRT_haveYouPreviouslyReceived?.includes("Other") &&
          renderInput(
            "Other treatments received",
            "PRT_haveYouPreviouslyReceivedOther"
          )}
        {renderInput("Treatment Dates", "PRT_Dates")}
        {renderInput("For what condition", "PRT_forWhatCondition")}
        {renderInput("Results", "PRT_results")}
      </div>
    </div>
  );
}

export default PatientPrevRehabDetails;
