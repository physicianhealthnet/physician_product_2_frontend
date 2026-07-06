import React, { useEffect, useState, useRef, useCallback } from "react";
import Input from "../../ui/Input";
import { AxiosInstance, AxiosInstanceSecondryServer } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";

function PatientBasicDetails({
  patientSSDetails,
  setPatientFormData,
  patientFormData,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const suggestionRef = useRef(null);

  const userInfo = JSON.parse(
    sessionStorage.getItem("user") || sessionStorage.getItem("master")
  );
  const clinicId = userInfo?.cid || userInfo?.clinicId;

  const searchTimeout = useRef(null);

  // Handle clicking outside of suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!clinicId) return;
      try {
        const res = await AxiosInstance.get(`/user/get-doctor?clinicId=${clinicId}`);
        setDoctors(res.data.users || []);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDoctors();
  }, [clinicId]);

  const performSearch = async (value) => {
    if (value.length < 3 || !clinicId) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    try {
      const response = await AxiosInstanceSecondryServer.post("/patientregistration/list", {
        clinicId,
        search: value,
      });
      console.log(response);
      
      setSuggestions(response.data.patients || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "patientName") {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        performSearch(value);
      }, 400);
    }
  };

  const handleSuggestionClick = (patient) => {
    setPatientFormData(patient);
    setShowSuggestions(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size should be less than 10MB");
        return;
      }
      setPatientFormData(prev => ({
        ...prev,
        profileImgFile: file,
        profileImgPreview: URL.createObjectURL(file)
      }));
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const rawBaseUrl = AxiosInstance.defaults.baseURL || "http://localhost:3026";
    const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Image Section */}
      <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
        <div className="relative group w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
          {patientFormData.profileImgPreview || patientFormData.profileImg ? (
            <img 
              src={patientFormData.profileImgPreview || getImageUrl(patientFormData.profileImg)} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Icon icon="solar:user-bold-duotone" className="text-4xl text-slate-400" />
          )}
          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Icon icon="solar:camera-add-bold-duotone" className="text-white text-2xl mb-1" />
            <span className="text-white text-[10px] font-bold tracking-wider">UPLOAD</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />
          </label>
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-slate-800">Profile Picture</h3>
          <p className="text-xs text-slate-500 max-w-sm">Upload a clear photo of the patient. If no photo is uploaded, an avatar will be generated based on age and gender.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: "patientName", label: "Patient Name", imp_label: true },
        { name: "patientPhone", label: "Patient Phone", type: "tel", imp_label: true },
        { name: "patientAddress", label: "Patient Address", imp_label: false },
        { name: "patientEmail", label: "Patient Email", type: "email", imp_label: false },
        { name: "patientDOB", label: "Date of Birth", type: "date", imp_label: false },
        {
          name: "patientGender",
          label: "Patient Gender",
          type: "radio",
          values: ["male", "female"],
          imp_label: false,
        },
        { name: "patientAge", label: "Patient Age", type: "number", imp_label: false },
        { name: "patientAadhar", label: "Aadhar Number", type: "number", imp_label: false },
        { name: "guardianName", label: "Patient Attender", imp_label: false },
        { name: "attenderPhone", label: "Attender Ph no", type: "tel", imp_label: false },
        { 
          name: "attenderRelationship", 
          label: "Attender Relationship", 
          type: "select", 
          options: ["son", "daughter", "wife", "husband", "brother", "sister", "friends", "relative"],
          imp_label: false 
        },
        { name: "location", label: "Location", imp_label: false },
        { name: "ref_dr_name", label: "Referred Doctor Name (Primary Doctor)" ,type: "select", options: "doctors", imp_label: false},
      ].map((item, index) => (
        <div key={index} className="relative">
          {item.type === "radio" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 ">
                {item.label} {item.imp_label && <span className="text-red-500">*</span>}
              </label>
              <div className="flex gap-4 min-h-[42px] items-center px-1">
                {item.values.map((value, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        name={item.name}
                        value={value}
                        onChange={handleInputChange}
                        checked={patientFormData?.[item.name] === value}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-300  rounded-full peer-checked:border-primary-600 peer-checked:after:opacity-100 after:content-[''] after:absolute after:top-1 after:left-1 after:w-2.5 after:h-2.5 after:bg-primary-600 after:rounded-full after:opacity-0 after:transition-all transition-all"></div>
                    </div>
                    <span className="text-slate-700  capitalize group-hover:text-primary-600 transition-colors">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : item.type === "select" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 ">
                {item.label} {item.imp_label && <span className="text-red-500">*</span>}
              </label>
              <select
                name={item.name}
                value={patientFormData?.[item.name] || ""}
                onChange={(e) => {
                  handleInputChange(e);
                  if (item.name === "ref_dr_name") {
                    const selectedDoc = doctors.find(doc => doc.userName === e.target.value);
                    if (selectedDoc) {
                      setPatientFormData(prev => ({ ...prev, ref_dr_id: selectedDoc.userId || selectedDoc._id || "" }));
                    } else {
                      setPatientFormData(prev => ({ ...prev, ref_dr_id: "" }));
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-slate-900"
              >
                <option value="">Select {item.label}</option>
                {item.options === "doctors" ? (
                  doctors.map((doc, idx) => (
                    <option key={idx} value={doc.userName}>
                      {doc.userName}
                    </option>
                  ))
                ) : (
                  item.options && item.options.map((opt, idx) => (
                    <option key={idx} value={opt} className="capitalize">
                      {opt}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <>
              <Input
                type={item.type || "text"}
                label={<>{item.label} {item.imp_label && <span className="text-red-500">*</span>}</>}
                name={item.name}
                value={patientFormData?.[item.name] || ""}
                onChange={handleInputChange}
                onFocus={() => {
                  if (item.name === "patientName" && patientFormData?.patientName?.length >= 3) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder={`Enter ${item.label.toLowerCase()}`}
                autoComplete="off"
              />
              {item.name === "patientName" && (showSuggestions || searching) && (
                <div
                  ref={suggestionRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {searching ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                      <Icon icon="tabler:loader-2" className="animate-spin text-xl" />
                      <span className="text-sm font-medium">Searching patients...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSuggestionClick(p)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none group transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {p.patientName}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              ID: {p.patientId} • Ph: {p.patientPhone}
                            </span>
                          </div>
                          <Icon icon="tabler:chevron-right" className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 flex flex-col items-center gap-1 text-slate-400">
                      <Icon icon="tabler:user-x" className="text-xl" />
                      <span className="text-sm font-medium">No patients found</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

export default PatientBasicDetails;
