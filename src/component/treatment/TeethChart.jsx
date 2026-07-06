import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { AxiosInstance } from "../../utilities/AxiosInstance";

const TeethChart = ({ status: propStatus = {}, onUpdate }) => {
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [options, setOptions] = useState([]);

  const openToothDialog = (tooth) => {
    setSelectedTooth(tooth);
    setShowDialog(true);
  };

  const upperTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const lowerTeeth = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];

  const renderConditionsText = (tooth) => {
    const data = propStatus?.[tooth];
    return Array.isArray(data) ? data.join(", ") : "";
  };

  const fetchConditions = async () => {
    try {
      const res = await AxiosInstance.get("/assessment/get-all-conditions");
      setOptions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  return (
    <>
      <div className="overflow-x-auto w-full">
        <table className="border-collapse mx-auto w-full">
          <tbody>
            {/* Upper conditions */}
            <tr>
              {upperTeeth.map((t) => (
                <td
                  key={`u-cond-${t}`}
                  className="border h-10 text-xs text-center"
                >
                  {renderConditionsText(t)}
                </td>
              ))}
            </tr>

            {/* Upper teeth */}
            <tr>
              {upperTeeth.map((t) => (
                <td
                  key={`u-${t}`}
                  className="border text-center font-semibold p-2 cursor-pointer hover:bg-blue-100"
                  onClick={() => openToothDialog(t)}
                >
                  {t}
                </td>
              ))}
            </tr>

            {/* Lower teeth */}
            <tr>
              {lowerTeeth.map((t) => (
                <td
                  key={`l-${t}`}
                  className="border text-center font-semibold p-2 cursor-pointer hover:bg-blue-100"
                  onClick={() => openToothDialog(t)}
                >
                  {t}
                </td>
              ))}
            </tr>

            {/* Lower conditions */}
            <tr>
              {lowerTeeth.map((t) => (
                <td
                  key={`l-cond-${t}`}
                  className="border h-10 text-xs text-center"
                >
                  {renderConditionsText(t)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* TOOTH DIALOG */}
      {showDialog && selectedTooth && (
        <div className="flex gap-2 w-full items-center mt-2 border rounded p-2">
          <CreatableSelect
            isMulti
            isSearchable
            options={options?.map((o) => ({ label: o, value: o })) || []}
            value={
              Array.isArray(propStatus?.[selectedTooth])
                ? propStatus[selectedTooth].map((v) => ({
                  label: v,
                  value: v,
                }))
                : []
            }
            onChange={(selected) => {
              const values = Array.isArray(selected)
                ? selected.map((s) => s.value)
                : [];

              onUpdate({
                ...propStatus,
                [selectedTooth]: values,
              });
            }}
            placeholder="Add or select conditions"
            className="w-full"
            classNamePrefix="select"
          />
        </div>
      )}
    </>
  );
};

export default TeethChart;
