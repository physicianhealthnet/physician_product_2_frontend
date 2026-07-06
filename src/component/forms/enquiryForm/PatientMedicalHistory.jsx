import React from "react";

function PatientMedicalHistory({ setFormData, formData }) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const updatedValues = formData?.medicalHistory || [];
      if (checked) {
        setFormData((prevData) => ({
          ...prevData,
          medicalHistory: [...updatedValues, value],
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          medicalHistory: updatedValues.filter((item) => item !== value),
        }));
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-4 p-4">
      <div className="flex flex-row flex-wrap gap-4">
        <label>Medical History</label>
        <div className="flex flex-row flex-wrap gap-4">
          {[
            "High blood pressure",
            "heart disease/condition",
            "Stroke/TIA",
            "Cancer",
            "Lung/respiratory condition",
            "Epilepsy/seizures",
            "Osteoporosis",
            "Arthritis",
            "Neurological disorder",
            "Fibromyalgia",
            "Kidney/liver disease",
            "Thyroid condition",
            "Pregnancy (current)",
            "Fractures/Significant Injuries",
            "Surgeries/Hospitalizations",
            "Medications/Current Medications",
            "Blood clots/DVT",
            "Family Medical History",
            "COVID-19",
            "Diabetes",
            "Other",
          ].map((value, valueIndex) => (
            <label
              key={valueIndex}
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
               formData?.medicalHistory?.includes(value)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="checkbox"
                name="medicalHistory"
                value={value}
                onChange={handleInputChange}
                checked={formData?.medicalHistory?.includes(value) || false}
              />
              {value}
            </label>
          ))}
        </div>
      </div>
      {formData?.medicalHistory?.includes("Other") && (
        <div>
          <label>Other Details</label>
          <input
            type="text"
            name="medicalHistoryOther"
            value={formData?.medicalHistoryOther || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
      )}
      {formData?.medicalHistory?.includes("Diabetes") && (
        <div>
          <label>Diabetes Type</label>
          <input
            type="text"
            name="diabetesType"
            value={formData?.diabetesType || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
      )}
      {formData?.medicalHistory?.includes("COVID-19") && (
        <div>
          <label>COVID19 Date</label>
          <input
            type="text"
            name="COVID_19Date"
            value={formData?.COVID_19Date || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
      )}
    </div>
  );
}

export default PatientMedicalHistory;
