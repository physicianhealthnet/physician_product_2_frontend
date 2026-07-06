import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import CreatableSelect from "react-select/creatable";

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

function TeethChartTesing() {
  const [inputString, setInputString] = useState("");
  const [activeTooth, setActiveTooth] = useState(null);
  const [teethRecords, setTeethRecords] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoverDialogOpen, setHoverDialogOpen] = useState(false);
  const [hoveredTooth, setHoveredTooth] = useState(null); // Track hovered tooth for complaints
  const [point, setPoint] = useState({ x: 0, y: 0 }); // Numeric defaults for positioning
  const [selectedTeethData, setSelectedTeethData] = useState({
    teethNo: null,
    complaints: [],
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValue, setEditValue] = useState("");

  const addComplaint = (option) => {
    if (!option || !activeTooth) return;

    const complaintValue = option.value;
    setTeethRecords((prev) => {
      const toothKey = String(activeTooth);
      const existing = prev[toothKey]?.complaints || [];
      if (existing.includes(complaintValue)) return prev;

      const newComplaints = [...existing, complaintValue];
      setSelectedTeethData((prev) => ({
        ...prev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [toothKey]: {
          complaints: newComplaints,
        },
      };
    });

    setInputString("");
  };

  const removeComplaint = (complaint, index) => {
    const toothKey = String(activeTooth);
    setTeethRecords((prev) => {
      const newComplaints =
        prev[toothKey]?.complaints.filter((_, i) => i !== index) || [];
      setSelectedTeethData((prev) => ({
        ...prev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [toothKey]: {
          complaints: newComplaints,
        },
      };
    });
    // If editing this item, exit edit mode
    if (editingIndex === index) {
      setEditingIndex(-1);
      setEditValue("");
    }
  };

  const startEdit = (complaint, index) => {
    setEditingIndex(index);
    setEditValue(complaint);
  };

  const saveEdit = () => {
    if (editingIndex === -1 || !editValue.trim()) return;

    const toothKey = String(activeTooth);
    setTeethRecords((prev) => {
      const newComplaints = [...(prev[toothKey]?.complaints || [])];
      newComplaints[editingIndex] = editValue.trim();
      setSelectedTeethData((prev) => ({
        ...prev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [toothKey]: {
          complaints: newComplaints,
        },
      };
    });

    setEditingIndex(-1);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(-1);
    setEditValue("");
  };

  const openTeethDialog = (toothNo) => {
    if (!toothNo) return;

    const toothKey = String(toothNo);
    setActiveTooth(toothNo);
    setSelectedTeethData({
      teethNo: toothNo,
      complaints: teethRecords[toothKey]?.complaints || [],
    });
    setDialogOpen(true);
    setInputString("");
    setEditingIndex(-1);
    setEditValue("");
  };

  const handleMouseEnter = (e, cell) => {
    if (!cell) return;
    setPoint({ x: e.clientX, y: e.clientY });
    setHoveredTooth(cell);
    setHoverDialogOpen(true);
  };

  const handleMouseLeave = () => {
    setHoverDialogOpen(false);
    setHoveredTooth(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setInputString("");
    setEditingIndex(-1);
    setEditValue("");
  };

  // New: Submit button handler to log total data
  const handleSubmit = () => {
    console.log('Total Teeth Data:', JSON.stringify(teethRecords, null, 2));
  };

  const complaints = selectedTeethData.complaints;
  const hoveredComplaints = hoveredTooth ? teethRecords[String(hoveredTooth)]?.complaints || [] : [];

  return (
    <StaggerContainer>
      <div className="w-full text-center">
        <StaggerItem>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Teeth <span className="text-blue-500">Assessment Chart</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">
              Select teeth to record clinical findings and complaints
            </p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <table className="w-full border rounded-2xl overflow-hidden shadow-sm">
            <tbody className="divide-x divide-y">
              {[
                ["", "", "", 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, "", "", ""],
                [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
                [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
                ["", "", "", 85, 84, 83, 82, 81, 71, 72, 73, 74, 75, "", "", ""],
              ].map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      onClick={() => openTeethDialog(cell)}
                      onMouseEnter={(e) => handleMouseEnter(e, cell)}
                      onMouseLeave={handleMouseLeave}
                      className={`p-2 border cursor-pointer transition-all duration-200
                        ${teethRecords[String(cell)]?.complaints?.length
                          ? "bg-blue-500 text-white font-bold"
                          : "hover:bg-blue-50"
                        }
                        ${!cell && "bg-gray-50 cursor-default"}
                      `}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </StaggerItem>

        {/* New: Submit button below table */}
        <StaggerItem>
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Submit & Log Data
            </button>
          </div>
        </StaggerItem>

        {/* Hover Popup: Shows complaints for hovered tooth, positioned above mouse */}
        {hoverDialogOpen && hoveredComplaints.length > 0 && (
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl h-fit p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: `${Math.max(0, point.y - 140)}px`, // Above mouse; adjust offset as needed, clamp to 0
              left: `${point.x}px`,
            }}
          >
            <h4 className="font-black text-[10px] uppercase tracking-widest mb-3 text-slate-400">
              Tooth {hoveredTooth} Findings
            </h4>
            <ul className="text-xs space-y-2 h-full overflow-y-auto">
              {hoveredComplaints.map((c, i) => (
                <li key={i} className="bg-slate-50 px-3 py-2 rounded-lg text-left break-words font-bold text-slate-700 border border-slate-100">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dialogOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="w-[600px] bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
                <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                    Tooth {selectedTeethData.teethNo}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Clinical findings entry</p>
                </div>
                <button 
                  onClick={closeDialog}
                  className="w-10 h-10 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Icon icon="material-symbols:close-rounded" width={20} />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Add Complaint</label>
                  <CreatableSelect
                    isClearable
                    isSearchable
                    classNamePrefix="select"
                    options={[]}
                    placeholder="Type and press Enter..."
                    value={null}
                    inputValue={inputString}
                    onChange={addComplaint}
                    onInputChange={setInputString}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '1rem',
                        padding: '4px 8px',
                        border: '1px solid #e2e8f0',
                        fontWeight: 'bold',
                        boxShadow: 'none',
                        '&:hover': { border: '#3b82f6' }
                      })
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Complaints</h3>
                  {complaints.length > 0 ? (
                    <ul className="space-y-2">
                      {complaints.map((c, i) => (
                        <li
                          key={i}
                          className="flex justify-between bg-slate-50 border border-slate-100 hover:bg-slate-100/50 items-center px-4 py-3 rounded-xl transition-all"
                        >
                          {editingIndex === i ? (
                            <div className="flex-1 flex items-center space-x-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg font-bold text-sm outline-none focus:border-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={saveEdit}
                                className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center"
                                title="Save"
                              >
                                <Icon icon="material-symbols:save" width={16} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="w-8 h-8 bg-slate-400 text-white rounded-lg flex items-center justify-center"
                                title="Cancel"
                              >
                                <Icon icon="material-symbols:cancel" width={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-slate-700 text-sm">{c}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => startEdit(c, i)}
                                  className="w-8 h-8 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                  title="Edit"
                                >
                                  <Icon icon="material-symbols:edit" width={16} />
                                </button>
                                <button
                                  onClick={() => removeComplaint(c, i)}
                                  className="w-8 h-8 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                  title="Remove"
                                >
                                  <Icon
                                    icon="material-symbols:close-rounded"
                                    width={16}
                                  />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <Icon icon="tabler:mood-empty" className="text-3xl text-slate-200 mb-2" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No complaints recorded</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={closeDialog}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaggerContainer>

  );
}

export default TeethChartTesing;