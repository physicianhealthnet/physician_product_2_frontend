import React from "react";

function PatientAssessmentDetails({ setFormData, formData }) {
  const assessmentsList = [
    "Ankle & Foot Assessment",
    "Shoulder & ARM Assessment",
    "Knee & Thigh Assessment",
    "Cervical Spine & Neck Assessment",
    "Lumbar Spine Assessment",
    "Hip & Thigh Assessment",
    "Elbow & Forearm Assessment",
    "Dorsal Spine Assessment",
    "Temporomandibular Joint (TMJ) Assessment",
    "Coccygeal Joint Assessment",
    "Iliac Joint Assessment",
  ];
  const handleInputChange = (e) => {
    const { value, checked } = e.target;
    const updatedValues = formData?.assessments || [];

    if (checked) {
      setFormData((prevData) => ({
        ...prevData,
        assessments: [...updatedValues, value],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        assessments: updatedValues.filter((item) => item !== value),
      }));
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-4 p-4">
      <div className="flex flex-col gap-4">
        <label className="font-semibold text-lg">Assessments</label>
        <div className="flex flex-row flex-wrap gap-4">
          {assessmentsList.map((label, index) => {
            const keyString = (index + 1).toString(); // "1" to "11"
            return (
              <label
                key={keyString}
                className={`flex flex-row gap-2 items-center px-4 py-2 rounded-full cursor-pointer ${
                  formData?.assessments?.includes(keyString)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  name="assessments"
                  value={keyString}
                  onChange={handleInputChange}
                  checked={formData?.assessments?.includes(keyString) || false}
                  className="hidden"
                />
                {label}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PatientAssessmentDetails;
