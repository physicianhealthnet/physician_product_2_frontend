import React from "react";

function PatientNatureOfWorkDetails({ setFormData, formData }) {
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
          <label>Occupation or Primary Role</label>
          <input
            type="text"
            name="NOF_occupationOrPrimaryRole"
            value={formData?.NOF_occupationOrPrimaryRole || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Work Environment</label>
          <div className="flex flex-row flex-wrap gap-4">
            {["Office", "Factory", "Field", "Home", "Other"].map(
              (value, valueIndex) => (
                <label
                  key={valueIndex}
                  className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                    formData?.NOF_workEnvironment?.includes(value)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded-full`}
                >
                  <input
                    type="checkbox"
                    name="NOF_workEnvironment"
                    value={value}
                    onChange={handleInputChange}
                    checked={
                      formData?.NOF_workEnvironment?.includes(value) || false
                    }
                  />
                  {value}
                </label>
              )
            )}
          </div>
        </div>
        {formData?.NOF_workEnvironment?.includes("Other") && (
          <div>
            <label>Other Work Environment Details</label>
            <input
              type="text"
              name="NOF_workEnvironmentOther"
              value={formData?.NOF_workEnvironmentOther || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        )}
        <div>
          <label>Common Physical Activities</label>
          <div className="flex flex-row flex-wrap gap-4">
            {[
              "Sitting",
              "Standing",
              "Walking",
              "Lifting",
              "Bending",
              "Other",
            ].map((value, valueIndex) => (
              <label
                key={valueIndex}
                className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                  formData?.NOF_commonPhysicalActivities?.includes(value)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                } rounded-full`}
              >
                <input
                  type="checkbox"
                  name="NOF_commonPhysicalActivities"
                  value={value}
                  onChange={handleInputChange}
                  checked={
                    formData?.NOF_commonPhysicalActivities?.includes(value) ||
                    false
                  }
                />
                {value}
              </label>
            ))}
          </div>
        </div>
        {formData?.NOF_commonPhysicalActivities?.includes("Other") && (
          <div>
            <label>Other Physical Activities Details</label>
            <input
              type="text"
              name="NOF_commonPhysicalActivitiesOther"
              value={formData?.NOF_commonPhysicalActivitiesOther || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        )}
        <div>
          <label>Duration of Work Hours</label>
          <input
            type="text"
            name="NOF_durationofWorkHours"
            value={formData?.NOF_durationofWorkHours || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-md shadow"
          />
        </div>
        <div>
          <label>Any Work Related Pain?</label>
          <div className="flex flex-row gap-2">
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.NOF_anyWorkRelatedPain === "Yes"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="NOF_anyWorkRelatedPain"
                value="Yes"
                onChange={handleInputChange}
                checked={formData?.NOF_anyWorkRelatedPain === "Yes"}
              />
              Yes
            </label>
            <label
              className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                formData?.NOF_anyWorkRelatedPain === "No"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              } rounded-full`}
            >
              <input
                type="radio"
                name="NOF_anyWorkRelatedPain"
                value="No"
                onChange={handleInputChange}
                checked={formData?.NOF_anyWorkRelatedPain === "No"}
              />
              No
            </label>
          </div>
        </div>
        {formData?.NOF_anyWorkRelatedPain === "Yes" && (
          <div>
            <label>Specify Work Related Pain</label>
            <input
              type="text"
              name="NOF_ifYesSpecify"
              value={formData?.NOF_ifYesSpecify || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientNatureOfWorkDetails;
