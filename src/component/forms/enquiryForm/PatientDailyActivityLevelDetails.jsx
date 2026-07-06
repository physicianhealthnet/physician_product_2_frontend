import React from "react";

function PatientDailyActivityLevelDetails({ setFormData, formData }) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const updatedValues = formData?.[name] || [];
      if (checked) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: [...updatedValues, value],
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          [name]: updatedValues.filter((item) => item !== value),
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
      <div className="flex flex-col gap-4 w-full">
        <div>
          <label>General Activity Level</label>
          <div className="flex flex-row gap-4">
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.DAL_GeneralActivityLevel === "Sedentary"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="DAL_GeneralActivityLevel"
                value="Sedentary"
                onChange={handleInputChange}
                checked={formData?.DAL_GeneralActivityLevel === "Sedentary"}
              />
              Sedentary
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.DAL_GeneralActivityLevel === "Light"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="DAL_GeneralActivityLevel"
                value="Light"
                onChange={handleInputChange}
                checked={formData?.DAL_GeneralActivityLevel === "Light"}
              />
              Light
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.DAL_GeneralActivityLevel === "Moderate"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="DAL_GeneralActivityLevel"
                value="Moderate"
                onChange={handleInputChange}
                checked={formData?.DAL_GeneralActivityLevel === "Moderate"}
              />
              Moderate
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.DAL_GeneralActivityLevel === "High"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="DAL_GeneralActivityLevel"
                value="High"
                onChange={handleInputChange}
                checked={formData?.DAL_GeneralActivityLevel === "High"}
              />
              High
            </label>
          </div>
        </div>
        <div>
          <label>Regular Activities</label>
          <input
            type="text"
            name="DAL_regularActivities"
            value={formData?.DAL_regularActivities || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Exercise/Recreation Type</label>
          <input
            type="text"
            name="ER_type"
            value={formData?.ER_type || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Exercise/Recreation Frequency</label>
          <input
            type="text"
            name="ER_frequency"
            value={formData?.ER_frequency || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Exercise/Recreation Duration</label>
          <input
            type="text"
            name="ER_duration"
            value={formData?.ER_duration || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
      </div>
    </div>
  );
}

export default PatientDailyActivityLevelDetails;
