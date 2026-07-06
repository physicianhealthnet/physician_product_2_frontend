import React from "react";

function PatientSportingLevelDetails({ setFormData, formData }) {
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
          <label>Type of Sports</label>
          <input
            type="text"
            name="SA_typeOfSports"
            value={formData?.SA_typeOfSports || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Level</label>
          <div className="flex flex-row gap-4">
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_level === "Recreational"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_level"
                value="Recreational"
                onChange={handleInputChange}
                checked={formData?.SA_level === "Recreational"}
              />
              Recreational
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_level === "Amateur"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_level"
                value="Amateur"
                onChange={handleInputChange}
                checked={formData?.SA_level === "Amateur"}
              />
              Amateur
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_level === "Professional"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_level"
                value="Professional"
                onChange={handleInputChange}
                checked={formData?.SA_level === "Professional"}
              />
              Professional
            </label>
          </div>
        </div>
        <div>
          <label>Frequency</label>
          <input
            type="text"
            name="SA_frequency"
            value={formData?.SA_frequency || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Duration</label>
          <input
            type="text"
            name="SA_duration"
            value={formData?.SA_duration || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Any Sports Related Injuries?</label>
          <div className="flex flex-row gap-2">
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_anySportsRelatedInjuries === "Yes"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_anySportsRelatedInjuries"
                value="Yes"
                onChange={handleInputChange}
                checked={formData?.SA_anySportsRelatedInjuries === "Yes"}
              />
              Yes
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_anySportsRelatedInjuries === "No"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_anySportsRelatedInjuries"
                value="No"
                onChange={handleInputChange}
                checked={formData?.SA_anySportsRelatedInjuries === "No"}
              />
              No
            </label>
          </div>
        </div>
        {formData?.SA_anySportsRelatedInjuries === "Yes" && (
          <div>
            <label>Specify Sports Related Injuries</label>
            <input
              type="text"
              name="SA_ifYesSpecify"
              value={formData?.SA_ifYesSpecify || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        )}
        <div>
          <label>Any Physical Limitations or Restrictions?</label>
          <div className="flex flex-row gap-2">
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_anyPhysicalLimitationsOrRestrictions === "Yes"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_anyPhysicalLimitationsOrRestrictions"
                value="Yes"
                onChange={handleInputChange}
                checked={
                  formData?.SA_anyPhysicalLimitationsOrRestrictions === "Yes"
                }
              />
              Yes
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.SA_anyPhysicalLimitationsOrRestrictions === "No"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="SA_anyPhysicalLimitationsOrRestrictions"
                value="No"
                onChange={handleInputChange}
                checked={
                  formData?.SA_anyPhysicalLimitationsOrRestrictions === "No"
                }
              />
              No
            </label>
          </div>
        </div>
        {formData?.SA_anyPhysicalLimitationsOrRestrictions === "Yes" && (
          <div>
            <label>Specify Physical Limitations or Restrictions</label>
            <input
              type="text"
              name="SA_anyPhysicalLimitationsOrRestrictionsIfYesSpecify"
              value={
                formData?.SA_anyPhysicalLimitationsOrRestrictionsIfYesSpecify ||
                ""
              }
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientSportingLevelDetails;
