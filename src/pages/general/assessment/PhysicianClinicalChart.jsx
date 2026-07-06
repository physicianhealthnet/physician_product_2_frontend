import React, { useState } from "react";
import { Modal, Input } from "antd";

const teethOrder = [
  // Upper Right
  18, 17, 16, 15, 14, 13, 12, 11,
  // Upper Left
  21, 22, 23, 24, 25, 26, 27, 28,
  // Lower Left
  38, 37, 36, 35, 34, 33, 32, 31,
  // Lower Right
  41, 42, 43, 44, 45, 46, 47, 48
];

export default function PhysicianClinicalChart() {
  const [teethData, setTeethData] = useState({});
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [conditionInput, setConditionInput] = useState("");

  const handleClick = (tooth) => {
    setSelectedTooth(tooth);
    setConditionInput(teethData[tooth] || "");
    setIsPromptOpen(true);
  };

  const handleSaveCondition = () => {
    if (selectedTooth) {
      setTeethData({ ...teethData, [selectedTooth]: conditionInput });
    }
    setIsPromptOpen(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Physician Clinical Chart
      </h2>

      <div className="grid grid-cols-8 gap-3 text-center">
        {teethOrder.map((tooth) => (
          <div
            key={tooth}
            onClick={() => handleClick(tooth)}
            className="border border-gray-400 rounded-lg h-20 flex flex-col justify-center items-center cursor-pointer hover:bg-blue-50 transition"
          >
            <span className="text-sm font-semibold">{tooth}</span>
            <span className="text-xs text-red-600 mt-1">
              {teethData[tooth] || "—"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Click a tooth to add clinical condition
      </p>

      <Modal
        title={`Enter condition for Tooth ${selectedTooth}`}
        open={isPromptOpen}
        onOk={handleSaveCondition}
        onCancel={() => setIsPromptOpen(false)}
        okText="Save"
      >
        <Input 
          placeholder="e.g. C, MOD Car, F, M, GD, RS" 
          value={conditionInput} 
          onChange={(e) => setConditionInput(e.target.value)} 
          autoFocus
          onPressEnter={handleSaveCondition}
        />
      </Modal>
    </div>
  );
}
