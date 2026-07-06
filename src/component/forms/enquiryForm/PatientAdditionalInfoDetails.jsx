import React from "react";

function PatientAdditionalInfoDetails({ setFormData, formData }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const renderRadioGroup = (label, name) => (
    <div className="flex flex-col">
      <label className="mb-2">{label}</label>
      <div className="flex gap-4">
        <label
          className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
            formData?.[name] === "No" ? "bg-blue-500 text-white" : "bg-gray-200"
          } rounded-full`}
        >
          <input
            type="radio"
            name={name}
            value="No"
            checked={formData?.[name] === "No"}
            onChange={handleInputChange}
            className="mr-2"
          />
          No
        </label>
        <label
          className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
            formData?.[name] === "Yes"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          } rounded-full`}
        >
          <input
            type="radio"
            name={name}
            value="Yes"
            checked={formData?.[name] === "Yes"}
            onChange={handleInputChange}
            className="mr-2"
          />
          Yes
        </label>
      </div>
    </div>
  );

  const renderTextArea = (label, name) => (
    <div className="flex flex-col">
      <label className="mb-2">{label}</label>
      <textarea
        name={name}
        value={formData?.[name] || ""}
        onChange={handleInputChange}
        className="w-full border p-2 rounded-md shadow"
        rows="3"
      />
    </div>
  );

  return (
    <div className="flex flex-row flex-wrap gap-4 p-4">
      <div className="flex flex-col gap-4 w-full">
        {renderRadioGroup("Do you smoke?", "AI_doYouSmoke")}
        {renderRadioGroup("Do you consume alcohol?", "AI_doYouConsumeAlcohol")}
        {renderTextArea(
          "Is there anything else about your medical history that might be helpful for your Doctor to know?",
          "AI_isThereAnyThingElseAboutYourMedicalHistory"
        )}
      </div>
    </div>
  );
}

export default PatientAdditionalInfoDetails;
