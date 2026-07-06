// Updated TreatmentTracker.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Collapse, message, TimePicker } from "antd";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { useParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

const { Panel } = Collapse;

const TreatmentTracker = ({ tracker }) => {
  const { patient_id: patientId } = useParams();
  const clinicId = JSON?.parse(sessionStorage?.getItem("user"))?.clinicId;
  const [patientDetails, setPatientDetails] = useState({});
  const [sessions, setSessions] = useState([1]);
  const [data, setData] = useState({
    patientId: patientId || "", // Use prop or state
    // Session 1 data
    "1-date": "",
    "1-protocol": "",
    "1-treatments": ["", ""],
    "1-homeAdvice": "",
    "1-notes": "",
    "1-nextReview": "",
    "1-startTime": "",
    "1-doctor": "",
    // Session 2 data
    "2-date": "",
    "2-vas": "10/10",
    "2-protocol": "",
    "2-treatments": ["", ""],
    "2-homeAdvice": "",
    "2-exercises": "",
    "2-noOfTimes": "",
    "2-notes": "",
    "2-nextReview": "",
    "2-startTime": "",
    "2-doctor": "",
    "2-patientName": "",
    "2-patientPhone": "",
    "2-patientId": "",
    "2-clinicId": "",
    "2-patientAddress": "",
  });
  const [doctorList, setDoctorList] = useState([]);

  const [trackerId, setTrackerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [homeAdviceOptions, setHomeAdviceOptions] = useState([]);
  const [hardTissueData, setHardTissueData] = useState({}); // Updated: {sessionNo: {toothNo: {complaints: [], details: ""}}}
  const [currentSession, setCurrentSession] = useState(1); // For dialog context
  const [inputString, setInputString] = useState("");
  const [activeTooth, setActiveTooth] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoverDialogOpen, setHoverDialogOpen] = useState(false);
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [selectedTeethData, setSelectedTeethData] = useState({
    teethNo: null,
    complaints: [],
    details: "",
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValue, setEditValue] = useState("");

  /* ================= TEETH OPTIONS ================= */
  const upperTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const lowerTeeth = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];
  const teethFDI = [...upperTeeth, ...lowerTeeth];
  const teethOptions = useMemo(
    () => teethFDI.map((t) => ({ label: t.toString(), value: t.toString() })),
    []
  );

  const extractHardTissueData = (tracker) => {
    const dataMap = {};

    // Session 1
    const session1Records = {};
    (tracker?.teethStatus || []).forEach((item) => {
      const toothKey = String(item.teethName);
      let complaints = item.complaints || item.complaint || [];
      if (typeof complaints === "string") {
        complaints = [complaints];
      } else if (!Array.isArray(complaints)) {
        complaints = [];
      }
      session1Records[toothKey] = {
        complaints,
        details: item.details || "",
      };
    });
    dataMap[1] = session1Records;

    // Upcoming sessions
    if (Array.isArray(tracker?.upcomming_sessions)) {
      tracker.upcomming_sessions.forEach((session) => {
        const sessionNo = session?.sessionNo;
        if (sessionNo) {
          const sessionRecords = {};
          (session.teethStatus || []).forEach((item) => {
            const toothKey = String(item.teethName);
            let complaints = item.complaints || item.complaint || [];
            if (typeof complaints === "string") {
              complaints = [complaints];
            } else if (!Array.isArray(complaints)) {
              complaints = [];
            }
            sessionRecords[toothKey] = {
              complaints,
              details: item.details || "",
            };
          });
          dataMap[sessionNo] = sessionRecords;
        }
      });
    }

    return dataMap;
  };

  const handleGetPatientDetails = async () => {
    try {
      const res = await AxiosInstance.get(`/patient/get-by-id/${patientId}`);
      setPatientDetails(res?.data?.patient);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await AxiosInstance.get("/treatment-tracker/get-home-advise");

      // Convert array of strings → [{label, value}]
      const formatted = res.data.data.map((item) => ({
        label: item,
        value: item,
      }));

      setHomeAdviceOptions(formatted);
    } catch (error) {
      console.error("Error loading home advice options:", error);
    }
  };

  useEffect(() => {
    handleGetPatientDetails();
  }, [patientId]);

  useEffect(() => {
    if (tracker && tracker.length > 0) {
      const trackerData = tracker[0];
      setTrackerId(trackerData._id);
      setData({
        patientId,
        ...extractDataFromTracker(trackerData),
      });
      setHardTissueData(extractHardTissueData(trackerData));
      const allSessions = [
        1,
        ...(Array.isArray(trackerData?.upcomming_sessions)
          ? trackerData.upcomming_sessions.map((s) => s?.sessionNo)
          : []),
      ];
      setSessions(allSessions);
    } else if (patientId) {
      fetchTreatmentTracker();
    }
  }, [patientId, tracker]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchTreatmentTracker = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(
        `/treatment-tracker/patient/${patientId}`
      );
      const tracker = response?.data;
      if (tracker) {
        setTrackerId(tracker._id);

        setData({
          patientId,
          ...extractDataFromTracker(tracker),
        });
        setHardTissueData(extractHardTissueData(tracker));
        const allSessions = [
          1,
          ...(Array.isArray(tracker.upcomming_sessions)
            ? tracker.upcomming_sessions.map((s) => s.sessionNo)
            : []),
        ];
        setSessions(allSessions);
      }
    } catch (error) {
      console.error("Error fetching tracker:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractDataFromTracker = (tracker) => {
    const extracted = {};
    extracted["1-date"] = tracker?.date || "";
    extracted["1-protocol"] = tracker?.protocol || "";
    extracted["1-treatments"] = Array.isArray(tracker?.treatments)
      ? tracker.treatments
      : ["", ""];
    extracted["1-homeAdvice"] = tracker?.homeAdvice || "";
    // Fixed: Use consistent key "exercises" instead of "exerciseList"
    extracted["1-exercises"] = tracker?.exercises || ""; // Assuming backend uses "exercises"
    extracted["1-noOfTimes"] = tracker?.noOfTimes || "";
    extracted["1-notes"] = tracker?.notes || "";
    extracted["1-nextReview"] = tracker?.nextReview || "";
    extracted["1-startTime"] = tracker?.startTime || "";
    extracted["1-doctor"] = tracker?.doctor || "";
    extracted["1-patientName"] = tracker?.patientName || "";
    extracted["1-patientPhone"] = tracker?.patientPhone || "";
    extracted["1-patientAddress"] = tracker?.patientAddress || "";
    if (Array.isArray(tracker?.upcomming_sessions)) {
      tracker.upcomming_sessions.forEach((session) => {
        const sessionNo = session?.sessionNo;
        if (sessionNo) {
          extracted[`${sessionNo}-date`] = session?.date || "";
          extracted[`${sessionNo}-subjective`] = session?.subjective || "";
          extracted[`${sessionNo}-vas`] = session?.vas || "";
          extracted[`${sessionNo}-protocol`] = session?.protocol || "";
          extracted[`${sessionNo}-treatments`] = Array.isArray(
            session?.treatments
          )
            ? session.treatments
            : ["", ""];
          extracted[`${sessionNo}-homeAdvice`] = session?.homeAdvice || "";
          extracted[`${sessionNo}-exercises`] = session?.exercises || "";
          extracted[`${sessionNo}-noOfTimes`] = session?.noOfTimes || "";
          extracted[`${sessionNo}-notes`] = session?.notes || "";
          extracted[`${sessionNo}-nextReview`] = session?.nextReview || "";
          extracted[`${sessionNo}-startTime`] = session?.startTime || "";
          extracted[`${sessionNo}-doctor`] = session?.doctor || "";
          extracted[`${sessionNo}-patientName`] = session?.patientName || "";
          extracted[`${sessionNo}-patientPhone`] = session?.patientPhone || "";
          extracted[`${sessionNo}-patientId`] = session?.patientId || "";
          extracted[`${sessionNo}-clinicId`] = session?.clinicId || "";
          extracted[`${sessionNo}-patientAddress`] =
            session?.patientAddress || "";
        }
      });
    }
    return extracted;
  };

  const updateField = (sessionNo, field, value) => {
    if (field === "patientId") {
      setData((prev) => ({ ...prev, patientId: value }));
      return;
    }
    setData((prev) => ({
      ...prev,
      [`${sessionNo}-${field}`]: value,
    }));
  };

  const addSession = () => {
    const nextSession = Math.max(...sessions) + 1;
    setSessions((prev) => [...prev, nextSession]);
    updateField(nextSession, "date", "");
    updateField(nextSession, "subjective", "");
    updateField(nextSession, "vas", "");
    updateField(nextSession, "protocol", "");
    updateField(nextSession, "treatments", ["", ""]);
    updateField(nextSession, "homeAdvice", "");
    updateField(nextSession, "exercises", "");
    updateField(nextSession, "noOfTimes", "");
    updateField(nextSession, "notes", "");
    updateField(nextSession, "nextReview", "");
    updateField(nextSession, "startTime", "");
    updateField(nextSession, "doctor", "");
    setHardTissueData((prev) => ({
      ...prev,
      [nextSession]: {},
    }));
  };

  const deleteSession = (sessionNo) => {
    if (sessionNo === 1) return;
    setSessions((prev) => prev.filter((s) => s !== sessionNo));
    setData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (key.startsWith(`${sessionNo}-`)) {
          delete newData[key];
        }
      });
      return newData;
    });
    setHardTissueData((prev) => {
      const newData = { ...prev };
      delete newData[sessionNo];
      return newData;
    });
  };

  // Teeth Chart Functions (session-aware)
  const addComplaint = (option) => {
    if (!option || !activeTooth || !currentSession) return;

    const complaintValue = option.value;
    setHardTissueData((prev) => {
      const sessionKey = currentSession;
      const sessionData = prev[sessionKey] || {};
      const toothKey = String(activeTooth);
      const existing = sessionData[toothKey]?.complaints || [];
      if (existing.includes(complaintValue)) return prev;

      const newComplaints = [...existing, complaintValue];
      setSelectedTeethData((selPrev) => ({
        ...selPrev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [sessionKey]: {
          ...sessionData,
          [toothKey]: {
            ...sessionData[toothKey],
            complaints: newComplaints,
          },
        },
      };
    });

    setInputString("");
  };

  const removeComplaint = (complaint, index) => {
    const sessionKey = currentSession;
    const toothKey = String(activeTooth);
    setHardTissueData((prev) => {
      const sessionData = prev[sessionKey] || {};
      const newComplaints =
        sessionData[toothKey]?.complaints.filter((_, i) => i !== index) || [];
      setSelectedTeethData((prev) => ({
        ...prev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [sessionKey]: {
          ...sessionData,
          [toothKey]: {
            ...sessionData[toothKey],
            complaints: newComplaints,
          },
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

    const sessionKey = currentSession;
    const toothKey = String(activeTooth);
    setHardTissueData((prev) => {
      const sessionData = prev[sessionKey] || {};
      const newComplaints = [...(sessionData[toothKey]?.complaints || [])];
      newComplaints[editingIndex] = editValue.trim();
      setSelectedTeethData((prev) => ({
        ...prev,
        complaints: newComplaints,
      }));
      return {
        ...prev,
        [sessionKey]: {
          ...sessionData,
          [toothKey]: {
            ...sessionData[toothKey],
            complaints: newComplaints,
          },
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

  const openTeethDialog = (toothNo, sessionNo) => {
    if (!toothNo) return;

    setCurrentSession(sessionNo);
    const sessionKey = sessionNo;
    const sessionData = hardTissueData[sessionKey] || {};
    const toothKey = String(toothNo);
    setActiveTooth(toothNo);
    setSelectedTeethData({
      teethNo: toothNo,
      complaints: sessionData[toothKey]?.complaints || [],
      details: sessionData[toothKey]?.details || "",
    });
    setDialogOpen(true);
    setInputString("");
    setEditingIndex(-1);
    setEditValue("");
  };

  const handleMouseEnter = (e, cell, sessionNo) => {
    if (!cell) return;
    setPoint({ x: e.clientX, y: e.clientY });
    setHoveredTooth(cell);
    setCurrentSession(sessionNo); // For hover context
    setHoverDialogOpen(true);
  };

  const handleMouseLeave = () => {
    setHoverDialogOpen(false);
    setHoveredTooth(null);
  };

  const closeDialog = () => {
    // Save details on close
    if (activeTooth && currentSession) {
      const sessionKey = currentSession;
      const toothKey = String(activeTooth);
      setHardTissueData((prev) => ({
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          [toothKey]: {
            ...prev[sessionKey]?.[toothKey],
            details: selectedTeethData.details,
          },
        },
      }));
    }
    setDialogOpen(false);
    setInputString("");
    setEditingIndex(-1);
    setEditValue("");
  };

  const complaints = selectedTeethData.complaints;
  const hoveredComplaints =
    hoveredTooth && currentSession
      ? hardTissueData[currentSession]?.[String(hoveredTooth)]?.complaints || []
      : [];

  const renderHardTissueChart = (sessionNo) => {
    const sessionData = hardTissueData[sessionNo] || {};

    // Helper to render a tooth cell
    const ToothCell = ({ cell }) => {
      if (!cell) return <td className="p-1"></td>;

      const isSelected = !!sessionData[String(cell)]?.complaints?.length;

      return (
        <td className="p-1 text-center align-middle">
          <div
            onClick={() => openTeethDialog(cell, sessionNo)}
            onMouseEnter={(e) => handleMouseEnter(e, cell, sessionNo)}
            onMouseLeave={handleMouseLeave}
            className={`
              w-10 h-10 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer border
              ${isSelected ? "bg-red-500 border-red-600 text-white scale-110 shadow-red-500/30" : "bg-white  border-slate-200  text-slate-600  hover:border-primary-500 hover:text-primary-600 :border-primary-400 :text-primary-400"}
            `}
          >
            {cell}
          </div>
        </td>
      );
    };

    return (
      <div className="w-full mb-6 overflow-x-auto pb-2">
        <div className="min-w-[600px] bg-slate-50  rounded-xl p-4 border border-slate-100 ">
          <table className="w-full mx-auto border-separate border-spacing-y-2">
            <tbody>
              {/* Upper Quadrants */}
              <tr>
                <td colSpan={8} className="text-center pb-2 text-xs uppercase tracking-widest text-slate-400 font-bold border-r border-slate-200  pr-2">Upper Right (55-51, 18-11)</td>
                <td colSpan={8} className="text-center pb-2 text-xs uppercase tracking-widest text-slate-400 font-bold pl-2">Upper Left (61-65, 21-28)</td>
              </tr>
              {[
                ["", "", "", 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, "", "", ""],
                [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
              ].map((row, rowIndex) => (
                <tr key={`upper-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <ToothCell key={colIndex} cell={cell} />
                  ))}
                </tr>
              ))}

              {/* Spacer */}
              <tr><td colSpan={16} className="h-4"></td></tr>

              {/* Lower Quadrants */}
              {[
                [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
                ["", "", "", 85, 84, 83, 82, 81, 71, 72, 73, 74, 75, "", "", ""],
              ].map((row, rowIndex) => (
                <tr key={`lower-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <ToothCell key={colIndex} cell={cell} />
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={8} className="text-center pt-2 text-xs uppercase tracking-widest text-slate-400 font-bold border-r border-slate-200  pr-2">Lower Right (48-41, 85-81)</td>
                <td colSpan={8} className="text-center pt-2 text-xs uppercase tracking-widest text-slate-400 font-bold pl-2">Lower Left (31-38, 71-75)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hover Popup */}
        {hoverDialogOpen && hoveredComplaints.length > 0 && (
          <div
            className="fixed z-[9999] bg-white  border border-slate-300  rounded-md shadow-lg h-fit p-3 pointer-events-none text-left"
            style={{
              top: `${Math.max(0, point.y - 140)}px`,
              left: `${point.x}px`,
            }}
          >
            <h4 className="font-bold text-sm mb-2 text-slate-800 ">
              Teeth {hoveredTooth}: Complaints (Session {currentSession})
            </h4>
            <ul className="text-xs space-y-1 h-full overflow-y-auto">
              {hoveredComplaints.map((c, i) => (
                <li
                  key={i}
                  className="bg-slate-100  text-slate-800  list-disc px-2 py-1 rounded text-left break-words"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dialog for Tooth Complaints & Details */}
        {dialogOpen && currentSession === sessionNo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999999]">
            <div className="w-[90vw] h-[90vh] bg-white  rounded-xl overflow-hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 ">
                <h1 className="text-2xl font-bold text-slate-800 ">
                  Teeth No: {selectedTeethData.teethNo} (Session{" "}
                  {currentSession})
                </h1>
                <button onClick={closeDialog} className="text-slate-500 hover:text-slate-700  :text-slate-200">
                  <Icon icon="material-symbols:close-rounded" width={32} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-xl font-bold mb-3 text-slate-800 ">Complaints:</p>
                <div className="mb-4">
                  <CreatableSelect
                    isClearable
                    isSearchable
                    classNamePrefix="select"
                    placeholder="Add complaint and press Enter"
                    value={null}
                    inputValue={inputString}
                    options={homeAdviceOptions || []}
                    onChange={addComplaint}
                    onInputChange={setInputString}
                    className="basic-multi-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                      }),
                    }}
                  />
                </div>
                <div className="flex justify-end mt-4 mb-4">
                  <Button
                    onClick={closeDialog}
                    className="px-6 py-2 font-bold"
                  >
                    Save & Close
                  </Button>
                </div>
                {complaints.length > 0 ? (
                  <ul className="mt-4 space-y-2 divide-y divide-slate-200 ">
                    {complaints.map((c, i) => (
                      <li
                        key={i}
                        className="flex justify-between bg-slate-100  items-center px-3 py-2 rounded-lg"
                      >
                        {editingIndex === i ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-md   "
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="text-green-600  font-bold p-1"
                              title="Save"
                            >
                              <Icon icon="material-symbols:save" width={20} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-600  font-bold p-1"
                              title="Cancel"
                            >
                              <Icon icon="material-symbols:cancel" width={20} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-slate-800 ">{c}</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startEdit(c, i)}
                                className="text-blue-600  font-bold p-1"
                                title="Edit"
                              >
                                <Icon icon="material-symbols:edit" width={20} />
                              </button>
                              <button
                                onClick={() => removeComplaint(c, i)}
                                className="text-red-600  font-bold p-1"
                                title="Remove"
                              >
                                <Icon
                                  icon="material-symbols:close-rounded"
                                  width={20}
                                />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500  italic">No complaints added.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderField = (label, component) => (
    <div className="mb-5">
      <label className="block mb-2 text-sm font-semibold text-slate-700  uppercase tracking-wide">
        {label}
      </label>
      {component}
    </div>
  );

  const renderSession1 = (sessionNo) => (
    <div className="p-2 md:p-4">
      <div className=" bg-slate-50  rounded-lg p-5 mb-8 border border-slate-100 ">
        <h3 className="text-lg font-bold text-slate-800  mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
          General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField(
            "Date",
            <Input
              value={data[`${sessionNo}-date`]}
              onChange={(e) => updateField(sessionNo, "date", e.target.value)}
              type="date"
            />
          )}
          {renderField("Session No", <Input value={sessionNo} disabled className="bg-slate-100  text-slate-500" />)}
        </div>
      </div>

      <div className="mb-8">
        {renderField(
          "Treatment Protocol",
          <Textarea
            rows={2}
            value={data[`${sessionNo}-protocol`]}
            onChange={(e) => updateField(sessionNo, "protocol", e.target.value)}
            placeholder="Enter detailed treatment protocol"
          />
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 bg-slate-100  rounded-lg">
            <Icon icon="tabler:physician" width="24" className="text-slate-600 " />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-800 ">Physician Chart</h3>
            <p className="text-xs text-slate-500 ">Hard Tissue Assessment</p>
          </div>
        </div>
        {renderHardTissueChart(sessionNo)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {renderField(
            "Home Advice",
            <CreatableSelect
              isClearable
              isSearchable
              classNamePrefix="select"
              value={
                data[`${sessionNo}-homeAdvice`]
                  ? {
                    label: data[`${sessionNo}-homeAdvice`],
                    value: data[`${sessionNo}-homeAdvice`],
                  }
                  : null
              }
              options={homeAdviceOptions || []}
              onChange={(newValue) => {
                updateField(
                  sessionNo,
                  "homeAdvice",
                  newValue ? newValue.value : ""
                );
              }}
              className="basic-single"
            />
          )}
          {renderField(
            "Notes",
            <Textarea
              rows={4}
              value={data[`${sessionNo}-notes`]}
              onChange={(e) => updateField(sessionNo, "notes", e.target.value)}
              placeholder="Add session notes..."
            />
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-blue-50  p-5 rounded-xl border border-blue-100 ">
            <h4 className="font-bold text-blue-900  mb-4 flex items-center gap-2">
              <Icon icon="solar:calendar-date-bold" /> Next Review
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-800  mb-1 block">Date</label>
                <Input
                  value={data[`${sessionNo}-nextReview`]}
                  onChange={(e) => updateField(sessionNo, "nextReview", e.target.value)}
                  type="date"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-blue-800  mb-1 block">Time</label>
                <TimePicker
                  format="hh:mm A"
                  use12Hours
                  className="w-full h-11 border border-slate-300  rounded-lg bg-white  text-slate-900 "
                  popupClassName=" "
                  value={
                    data[`${sessionNo}-startTime`]
                      ? dayjs(data[`${sessionNo}-startTime`], "hh:mm A")
                      : null
                  }
                  onChange={(time, timeString) => {
                    updateField(sessionNo, "startTime", timeString);
                  }}
                />
              </div>
            </div>
          </div>

          {renderField(
            "Doctor",
            <CreatableSelect
              isClearable
              isSearchable
              classNamePrefix="select"
              value={
                data[`${sessionNo}-doctor`]
                  ? {
                    label: data[`${sessionNo}-doctor`],
                    value: data[`${sessionNo}-doctor`],
                  }
                  : null
              }
              options={doctorList || []}
              onChange={(newValue) => {
                updateField(sessionNo, "doctor", newValue ? newValue.value : "");
              }}
              className="basic-single"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderSubsequentSession = (sessionNo) => (
    <div className="p-2 md:p-4">
      <div className="bg-slate-50  rounded-lg p-5 mb-8 border border-slate-100 ">
        <h3 className="text-lg font-bold text-slate-800  mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
          Session Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField(
            "Date",
            <Input
              value={data[`${sessionNo}-date`]}
              onChange={(e) => updateField(sessionNo, "date", e.target.value)}
              type="date"
            />
          )}
          {renderField("Session No", <Input value={sessionNo} disabled className="bg-slate-100  text-slate-500" />)}
        </div>
      </div>

      <div className="mb-8">
        {renderField(
          "VAS Score (Pain Level)",
          <div className="flex flex-row flex-nowrap gap-4 items-center bg-white  p-4 rounded-lg border border-slate-200 ">
            <div className="flex-1">
              <Input
                value={data[`${sessionNo}-vas`]}
                onChange={(e) => updateField(sessionNo, "vas", e.target.value)}
                type="range"
                max={10}
                min={0}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer  accent-primary-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>0 (No Pain)</span>
                <span>5</span>
                <span>10 (Worst Pain)</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[4rem]">
              <span className={`text-2xl font-bold ${(data?.[`${sessionNo}-vas`] || 0) > 7 ? 'text-red-500' :
                (data?.[`${sessionNo}-vas`] || 0) > 4 ? 'text-orange-500' : 'text-green-500'
                }`}>
                {data?.[`${sessionNo}-vas`] || 0}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Score</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        {renderField(
          "Treatment Protocol",
          <Textarea
            rows={2}
            value={data[`${sessionNo}-protocol`]}
            onChange={(e) => updateField(sessionNo, "protocol", e.target.value)}
            placeholder="Enter detailed treatment protocol"
          />
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 bg-slate-100  rounded-lg">
            <Icon icon="tabler:physician" width="24" className="text-slate-600 " />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-800 ">Physician Chart</h3>
            <p className="text-xs text-slate-500 ">Hard Tissue Assessment</p>
          </div>
        </div>
        {renderHardTissueChart(sessionNo)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {renderField(
            "Home Advice",
            <CreatableSelect
              isClearable
              isSearchable
              classNamePrefix="select"
              value={
                data[`${sessionNo}-homeAdvice`]
                  ? {
                    label: data[`${sessionNo}-homeAdvice`],
                    value: data[`${sessionNo}-homeAdvice`],
                  }
                  : null
              }
              options={homeAdviceOptions || []}
              onChange={(newValue) => {
                updateField(
                  sessionNo,
                  "homeAdvice",
                  newValue ? newValue.value : ""
                );
              }}
              className="basic-single"
            />
          )}
          {renderField(
            "Notes",
            <Textarea
              rows={4}
              value={data[`${sessionNo}-notes`]}
              onChange={(e) => updateField(sessionNo, "notes", e.target.value)}
              placeholder="Add session notes..."
            />
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-blue-50  p-5 rounded-xl border border-blue-100 ">
            <h4 className="font-bold text-blue-900  mb-4 flex items-center gap-2">
              <Icon icon="solar:calendar-date-bold" /> Next Review
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-800  mb-1 block">Date</label>
                <Input
                  value={data[`${sessionNo}-nextReview`]}
                  onChange={(e) => updateField(sessionNo, "nextReview", e.target.value)}
                  type="date"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-blue-800  mb-1 block">Time</label>
                <TimePicker
                  format="hh:mm A"
                  use12Hours
                  className="w-full h-11 border border-slate-300  rounded-lg bg-white  text-slate-900 "
                  popupClassName=" "
                  value={
                    data[`${sessionNo}-startTime`]
                      ? dayjs(data[`${sessionNo}-startTime`], "hh:mm A")
                      : null
                  }
                  onChange={(time, timeString) => {
                    updateField(sessionNo, "startTime", timeString);
                  }}
                />
              </div>
            </div>
          </div>

          {renderField(
            "Doctor",
            <CreatableSelect
              isClearable
              isSearchable
              classNamePrefix="select"
              value={
                data[`${sessionNo}-doctor`]
                  ? {
                    label: data[`${sessionNo}-doctor`],
                    value: data[`${sessionNo}-doctor`],
                  }
                  : null
              }
              options={doctorList || []}
              onChange={(newValue) => {
                updateField(sessionNo, "doctor", newValue ? newValue.value : "");
              }}
              className="basic-single"
            />
          )}
        </div>
      </div>
    </div>
  );

  const buildStructuredData = () => {
    const session1Data = {
      sessionNo: 1,
      date: data["1-date"] || "",
      protocol: data["1-protocol"] || "",
      treatments: Array.isArray(data["1-treatments"])
        ? data["1-treatments"]
        : ["", ""],
      homeAdvice: data["1-homeAdvice"] || "",
      exercises: data["1-exercises"] || "",
      noOfTimes: data["1-noOfTimes"] || "",
      notes: data["1-notes"] || "",
      nextReview: data["1-nextReview"] || "",
      startTime: data["1-startTime"] || "",
      doctor: data["1-doctor"] || "",
      teethStatus: Object.entries(hardTissueData[1] || {}).map(
        ([toothNo, toothData]) => ({
          teethName: toothNo,
          complaints: toothData.complaints || [],
          details: toothData.details || "",
        })
      ),
    };

    const upcomingSessions = sessions
      .filter((s) => s > 1)
      .map((sessionNo) => ({
        sessionNo,
        date: data[`${sessionNo}-date`] || "",
        subjective: data[`${sessionNo}-subjective`] || "",
        vas: data[`${sessionNo}-vas`] || "",
        protocol: data[`${sessionNo}-protocol`] || "",
        treatments: Array.isArray(data[`${sessionNo}-treatments`])
          ? data[`${sessionNo}-treatments`]
          : ["", ""],
        homeAdvice: data[`${sessionNo}-homeAdvice`] || "",
        exercises: data[`${sessionNo}-exercises`] || "",
        noOfTimes: data[`${sessionNo}-noOfTimes`] || "",
        notes: data[`${sessionNo}-notes`] || "",
        nextReview: data[`${sessionNo}-nextReview`] || "",
        startTime: data[`${sessionNo}-startTime`] || "",
        doctor: data[`${sessionNo}-doctor`] || "",
        patientName: patientDetails.patientName,
        patientPhone: patientDetails.patientPhone,
        patientId: patientDetails.patientId,
        clinicId: patientDetails.clinicId,
        patientAddress: patientDetails.patientAddress,
        teethStatus: Object.entries(hardTissueData[sessionNo] || {}).map(
          ([toothNo, toothData]) => ({
            teethName: toothNo,
            complaints: toothData.complaints || [],
            details: toothData.details || "",
          })
        ),
      }));

    return {
      ...session1Data,
      upcomming_sessions: upcomingSessions,
    };
  };

  const handleSubmit = async () => {
    if (!data.patientId) {
      message.warning("Patient ID is required");
      return;
    }
    try {
      setLoading(true);
      const structuredData = buildStructuredData();
      const payload = {
        patientId: data.patientId,
        clinicId: clinicId,
        patientName: patientDetails.patientName,
        patientPhone: patientDetails.patientPhone,
        patientAddress: patientDetails.patientAddress,
        ...structuredData,
      };
      let response;
      if (trackerId) {
        response = await AxiosInstance.put(
          `/treatment-tracker/${trackerId}`,
          payload
        );
        console.log("data");

        message.success("Data saved successfully!");
      } else {
        response = await AxiosInstance.post("/treatment-tracker", payload);
        setTrackerId(response.data._id);
        message.success("Data saved successfully!");
      }
      message.warning(response.data.message);
    } catch (error) {
      console.error("Error saving data:", error);
      // message.error("Error saving data: " + error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareTreatment = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.post("/share/treatment", {
        patientId: data.patientId,
      });
      message.success(
        response.data.message || "Treatment record shared successfully!"
      );
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to share treatment record"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (sessionNo) => (
    <div className="flex justify-between items-center w-full py-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100  text-primary-600  flex items-center justify-center font-bold text-sm border-2 border-white  shadow-sm">
          {sessionNo}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800  text-lg">Session {sessionNo}</span>
          {data[`${sessionNo}-date`] && (
            <span className="text-xs text-slate-500  font-medium">
              {dayjs(data[`${sessionNo}-date`]).format("DD MMM YYYY")}
            </span>
          )}
        </div>
      </div>
      {sessionNo > 1 && !tracker && (
        <Button
          variant="danger"
          onClick={(e) => {
            e.stopPropagation();
            deleteSession(sessionNo);
          }}
          className="!px-3 !py-1 text-xs"
        >
          <Icon icon="solar:trash-bin-trash-bold" /> Delete
        </Button>
      )}
    </div>
  );

  const getAllDoctorList = async () => {
    try {
      const res = await AxiosInstance.get(
        `/user/get-doctor?clinicId=${clinicId}`
      );
      console.log(res);
      setDoctorList(() =>
        res.data.users
          .filter((data) => data.userType === "doctor")
          .map((data) => ({ label: data.userName, value: data.userName }))
      );
      console.log(doctorList);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllDoctorList();
  }, []);

  return (
    <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto">
      {patientId ? null : (
        <div className="mb-6 w-full md:w-1/3">
          <Input
            placeholder="Enter Patient ID"
            value={data.patientId}
            onChange={(e) => updateField(null, "patientId", e.target.value)}
            label="Patient ID"
          />
        </div>
      )}
      <Collapse
        defaultActiveKey={["1"]}
        className="bg-transparent border-none shadow-none flex flex-col gap-6"
      >
        {sessions.map((sessionNo) => (
          <Panel
            header={renderHeader(sessionNo)}
            key={sessionNo}
            className="border border-slate-200  bg-white  rounded-xl shadow-sm"
          >
            {sessionNo === 1
              ? renderSession1(sessionNo)
              : renderSubsequentSession(sessionNo)}
          </Panel>
        ))}
      </Collapse>

      {/* Sticky Action Footer */}
      {!tracker && (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-white/80  backdrop-blur-md border-t border-slate-200  p-4 shadow-lg shadow-black/5">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Button
              onClick={addSession}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Icon icon="solar:add-circle-bold" width="20" /> Add Session
            </Button>
            <div className="flex items-center gap-3">
              {trackerId && (
                <Button
                  onClick={handleShareTreatment}
                  disabled={loading}
                  className="!px-6 !py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Icon icon="solar:share-bold" width="20" /> Share Treatment History
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <Icon icon="solar:disk-bold" width="20" /> {trackerId ? "Update" : "Save"} All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentTracker;
