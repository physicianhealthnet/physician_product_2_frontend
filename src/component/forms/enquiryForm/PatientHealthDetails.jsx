import React from "react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

function PatientHealthDetails({ setFormData, formData }) {
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
     
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTimeChange = (value) => {
    setFormData((prev) => ({ ...prev, time: value }));
   };

  return (
    <div className="grid grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 max-md:grid-cols-1 gap-4 p-4">
      {[
        { name: "DoA", label: "DoA", type: "date" },
        { name: "By", label: "By" },
        { name: "ReferredBy", label: "Referred By" },
        {
          name: "dominantHand",
          label: "Dominant Hand",
          type: "radio",
          values: ["Left", "Right"],
        },
        {
          name: "somatotype",
          label: "Somato Type",
          type: "radio",
          values: ["Ecto", "Endo", "Meso"],
        },
        {
          name: "patient_hight",
          label: "Patient Hight",
          type: "number",
          suffix: "cm",
        },
        {
          name: "patient_weight",
          label: "Patient Weight",
          type: "number",
          suffix: "kgs",
        },
        { name: "patient_BP", label: "BP", type: "text", suffix: "mm Hg" },
        { name: "time", label: "Time", type: "time" },
      ].map((item, index) => (
        <div key={index}>
          <label>{item.label}</label>
          {item.type === "radio" ? (
            <div className="flex flex-row flex-wrap gap-2 h-10">
              {item.values.map((value, idx) => (
                <label
                  key={idx}
                  className={`flex flex-row gap-2 text-center items-center px-4 py-2 ${
                    formData?.[item.name] === value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } rounded-full`}
                >
                  <input
                    type="radio"
                    name={item.name}
                    value={value}
                    checked={formData?.[item.name] === value}
                    className={``}
                    onChange={handleInputChange}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : item.name === "time" ? (
            <TimePicker
              onChange={handleTimeChange}
              name={item.name}
              value={formData?.time || ""}
              format="h:mm a"
              disableClock={true}
              locale="en-US"
              className="w-full border rounded-md shadow react-time-picker__inputGroup__input"
            />
          ) : (
            <div className="flex flex-row items-center justify-between gap-2 w-full text-center">
              <input
                type={item.type ? item.type : "text"}
                name={item.name}
                value={formData?.[item.name] || ""}
                onChange={handleInputChange}
                className="w-full border p-2 rounded-md shadow flex-grow"
              />
              {item.suffix && (
                <p className="m-0 text-nowrap font-bold">{item.suffix}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PatientHealthDetails;
