import React from "react";

function PatientDiagnosticDetails({ formData, setFormData }) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "diagnosticTest_forYourCurrentCondition") {
      setFormData((prevData) => ({
        ...prevData,
        diagnosticTest_forYourCurrentCondition: checked
          ? [...(prevData?.diagnosticTest_forYourCurrentCondition || []), value]
          : (prevData?.diagnosticTest_forYourCurrentCondition || []).filter(
              (item) => item !== value
            ),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  return (
    <div className="flex flex-row flex-wrap gap-4 p-4">
      {[
        {
          name: "diagnosticTest_forYourCurrentCondition",
          label:
            "Have you had any of the following tests for your current condition?",
          type: "checkbox",
          values: [
            "X-ray",
            "MRI",
            "CT scan",
            "EMG/NCS",
            "Ultrasound",
            "Blood tests",
            "Other",
          ],
        },
      ].map((item, index) => (
        <div key={index} className="flex flex-row flex-wrap gap-4">
          <label>{item.label}</label>
          {item.type === "checkbox" && (
            <div className="flex flex-row flex-wrap gap-4">
              {item.values.map((value, valueIndex) => (
                <label
                  key={valueIndex}
                  className={`flex flex-row gap-2 text-center items-center px-4 py-2  ${
                    formData?.diagnosticTest_forYourCurrentCondition?.includes(
                      value
                    )
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded-full`}
                >
                  <input
                    type="checkbox"
                    name={item.name}
                    value={value}
                    onChange={handleInputChange}
                    checked={
                      formData?.diagnosticTest_forYourCurrentCondition?.includes(
                        value
                      ) || false
                    }
                  />
                  {value}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      {[
        {
          name: "diagnosticTest_forYourCurrentConditionOther",
          label: "Other Details",
          type: "text",
          showIf:
            formData?.diagnosticTest_forYourCurrentCondition?.includes(
              "Other"
            ) || false,
        },
      ].map((item, index) =>
        item.showIf !== false ? (
          <div key={index}>
            <label>{item.label}</label>
            <input
              type={item.type || "text"}
              name={item.name}
              value={formData?.[item.name] || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded-md shadow"
            />
          </div>
        ) : null
      )}
      {formData?.diagnosticTest_forYourCurrentCondition?.length >= 1 && (
        <div className="flex flex-col justify-center w-full">
          <label>Discribe:</label>
          <textarea
            name="discribeDiagnosis"
            onChange={handleInputChange}
            value={formData?.discribeDiagnosis}
            rows={2}
            className="w-full border p-2 rounded-md shadow"
          ></textarea>
        </div>
      )}
    </div>
  );
}

export default PatientDiagnosticDetails;
