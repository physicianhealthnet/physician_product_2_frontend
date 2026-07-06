import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Icon } from "@iconify/react";
import { Modal, DatePicker, TimePicker, AutoComplete, Input, message, Tooltip } from "antd";
import dayjs from "dayjs";
import { AxiosInstance, AxiosInstanceDependency } from "../../../utilities/AxiosInstance";
import Button from "../../../component/ui/Button";

const VideoConsult = () => {
  // Navigation tabs: "instant" or "scheduled"
  const [activeTab, setActiveTab] = useState("scheduled");
  
  // Instant Meet states
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [copied, setCopied] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  
  // Scheduled Meetings states
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  
  // Schedule Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const initialFormState = {
    patientId: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    date: "",
    time: "",
    duration: 30,
    notes: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  
  const [googleConnected, setGoogleConnected] = useState(true); // Keeping state for backwards compat if needed, but not used
  
  // Get doctor user details from sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  // The patient side creates video meetings using the clinic ID (cid) as the doctorId
  const doctorId = user?.cid || user?.clinicId || user?._id || "";
  const doctorName = user?.userName || "Specialist (Doctor)";

  // Load scheduled meetings
  const fetchMeetings = async () => {
    if (!doctorId) return;
    try {
      setLoadingMeetings(true);
      const res = await AxiosInstanceDependency.get(`/video-meetings?doctorId=${doctorId}`);
      if (res.data && res.data.success) {
        setMeetings(res.data.data);
      }
    } catch (err) {
      console.error("Error loading meetings:", err);
      message.error("Failed to load scheduled video consultations.");
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [doctorId]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.roomName) {
      setActiveTab("instant");
      setRoomName(location.state.roomName);
      setMeetingStarted(true);
      
      // Clear the state so it doesn't auto-join on subsequent navigation
      window.history.replaceState({}, document.title);
    } else {
      setRoomName("");
    }
  }, [location.state]);

  const handleStartMeet = async (customRoomName = null) => {
    let targetRoom = customRoomName || roomName;

    // If no room is specified, auto-generate a Jitsi room name
    if (!targetRoom || !targetRoom.trim()) {
      const randomString = Math.random().toString(36).substring(2, 12);
      targetRoom = `PHN-Consultation-${randomString}`;
    } else {
      // If the user provided a full URL, extract the room name
      if (targetRoom.startsWith("http")) {
        const parts = targetRoom.split("/");
        targetRoom = parts[parts.length - 1];
      }
    }

    setRoomName(targetRoom);
    setMeetingStarted(true);
  };

  const handleEndMeet = () => {
    setMeetingStarted(false);
    setRoomName("");
    fetchMeetings();
  };

  const handleCopyLink = (codeToCopy = null) => {
    let target = codeToCopy || roomName;
    if (target && !target.startsWith("http")) {
      target = `https://meet.jit.si/${target}`;
    }
    if (target) {
      navigator.clipboard.writeText(target);
      message.success("Join link copied to clipboard!");
      if (!codeToCopy) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Autocomplete patient search
  const handlePatientSearch = async (value) => {
    if (!value) return;
    try {
      setSearchLoading(true);
      const res = await AxiosInstance.get(`/appointments/search?query=${value}`);
      if (res.data?.patients) {
        setSearchResults(
          res.data.patients.map((p) => ({
            value: p.patientName,
            label: (
              <div className="flex flex-col p-1.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded">
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Icon icon="solar:user-bold" className="text-primary-500" />
                  {p.patientName}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Icon icon="solar:phone-bold" className="text-green-500" /> {p.patientPhone}</span>
                  <span className="flex items-center gap-1"><Icon icon="solar:id-card-bold" className="text-purple-500" /> ID: {p.patientId}</span>
                </div>
              </div>
            ),
            data: p,
          }))
        );
      }
    } catch (err) {
      console.error("Patient search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = (value, option) => {
    const p = option.data;
    setFormData((prev) => ({
      ...prev,
      patientId: p.patientId,
      patientName: p.patientName,
      patientPhone: p.patientPhone || "",
      patientEmail: p.patientEmail || "",
    }));
    message.success(`Patient "${p.patientName}" selected`);
  };

  const handleScheduleSubmit = async () => {
    const { patientName, date, time } = formData;
    if (!patientName.trim() || !date || !time) {
      message.error("Please fill all required fields: Patient Name, Date, Time");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        doctorId,
        doctorName,
      };

      const res = await AxiosInstanceDependency.post("/video-meetings", payload);
      if (res.data && res.data.success) {
        message.success("Video Consultation scheduled successfully!");
        setIsModalOpen(false);
        setFormData(initialFormState);
        fetchMeetings();
      }
    } catch (err) {
      console.error("Error scheduling video meeting:", err);
      message.error("Failed to schedule meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (meetingDbId, newStatus) => {
    try {
      const res = await AxiosInstanceDependency.patch(`/video-meetings/${meetingDbId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        message.success(`Consultation successfully marked as ${newStatus}`);
        fetchMeetings();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      message.error("Failed to update status.");
    }
  };

  return (
    <div className="w-full h-full p-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-start min-h-[calc(100vh-120px)] bg-slate-50/30">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px]">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-center relative overflow-hidden flex flex-col sm:flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-left z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
              <Icon icon="solar:videocamera-record-bold-duotone" className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-0">Video Consultation Portal</h1>
              <p className="text-sm text-primary-100">Schedule & conduct secure video calls</p>
            </div>
          </div>

          {meetingStarted ? (
            <div className="flex items-center gap-3 mt-4 sm:mt-0 z-10">
              <button
                onClick={() => handleCopyLink()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-none flex items-center gap-1.5 cursor-pointer ${
                  copied ? "bg-green-500 text-white" : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Icon icon="solar:check-circle-bold" className="text-sm" /> Copied Code
                  </>
                ) : (
                  <>
                    <Icon icon="solar:copy-bold-duotone" className="text-sm" /> Copy Code
                  </>
                )}
              </button>
              <Button
                onClick={handleEndMeet}
                className="bg-red-500 hover:bg-red-600 text-white border-none shadow-none text-xs px-4 py-1.5 rounded-xl font-bold"
              >
                End Call
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 sm:mt-0 z-10">
              <button
                onClick={() => {
                  setFormData(initialFormState);
                  setIsModalOpen(true);
                }}
                className="bg-white/25 hover:bg-white/35 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border border-white/30 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Icon icon="solar:calendar-add-bold" className="text-sm" />
                Schedule Consultation
              </button>
            </div>
          )}
        </div>



        {/* Tab Headers - Hidden during an active call to maximize Jitsi space */}
        {!meetingStarted && (
          <div className="flex bg-slate-100/80 border-b border-slate-200 shrink-0 p-1">
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                activeTab === "scheduled"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              <Icon icon="solar:calendar-bold" className="text-base" />
              Scheduled Consultations
            </button>
            <button
              onClick={() => setActiveTab("instant")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                activeTab === "instant"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              <Icon icon="solar:play-circle-bold" className="text-base" />
              Instant Meet Room
            </button>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 bg-slate-50 relative p-0 sm:p-6 overflow-hidden flex flex-col justify-center">
          {meetingStarted ? (
            <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900 rounded-none sm:rounded-xl">
              <JitsiMeeting
                domain="alpha.jitsi.net"
                roomName={roomName}
                configOverwrite={{
                  startWithAudioMuted: false,
                  startWithVideoMuted: false,
                  disableModeratorIndicator: true,
                  prejoinPageEnabled: false,
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }}
                userInfo={{
                  displayName: doctorName
                }}
                onApiReady={(externalApi) => {
                  externalApi.addListener("videoConferenceLeft", () => {
                    handleEndMeet();
                  });
                }}
                getIFrameRef={(iframeRef) => {
                  iframeRef.style.height = '100%';
                  iframeRef.style.width = '100%';
                  iframeRef.style.border = 'none';
                }}
              />
            </div>
          ) : activeTab === "instant" ? (
            /* Instant Meet View */
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center animate-in slide-in-from-bottom duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                <Icon icon="solar:play-circle-bold-duotone" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Create Consultation Room</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Start a secure video consultation session immediately. Leave blank to auto-generate a unique meeting space.
              </p>
              
              <div className="text-left mb-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room Code / Meeting URL (Optional)</label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-shadow font-semibold"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleStartMeet()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-md cursor-pointer text-sm font-semibold"
              >
                <Icon icon="solar:videocamera-bold" className="text-lg" />
                Start Video Consultation
              </Button>
            </div>
          ) : (
            /* Scheduled Consultations Dashboard List */
            <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
              {/* List Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Scheduled Sessions</span>
                <button
                  onClick={fetchMeetings}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-all cursor-pointer"
                  title="Refresh List"
                >
                  <Icon icon="solar:refresh-linear" className={loadingMeetings ? "animate-spin" : ""} />
                </button>
              </div>
              
              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingMeetings ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <Icon icon="solar:spinner-bold animate-spin" className="text-4xl text-primary-500" />
                    <span className="text-sm font-semibold animate-pulse">Loading consultations...</span>
                  </div>
                ) : meetings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meetings.map((meet) => {
                      const isCancelled = meet.status === "Cancelled";
                      const isCompleted = meet.status === "Completed";
                      const isScheduled = meet.status === "Scheduled";
                      const isRequested = meet.status === "Requested";
                      
                      return (
                        <div 
                          key={meet._id}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-44 hover:shadow-md ${
                            isCancelled 
                              ? "bg-slate-50/50 border-slate-100 opacity-60" 
                              : isCompleted 
                              ? "bg-emerald-50/10 border-emerald-100" 
                              : isRequested
                              ? "bg-amber-50/10 border-amber-200"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          {/* Top row: Patient details & Status Badge */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-black text-slate-800 mb-0.5 flex items-center gap-1.5">
                                <Icon icon="solar:user-circle-bold" className="text-slate-400 text-lg" />
                                {meet.patientName}
                              </h3>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {meet.patientPhone || "No Phone"} • {meet.patientEmail || "No Email"}
                              </span>
                            </div>
                            
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCancelled 
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : isCompleted 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : isRequested
                                ? "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {meet.status}
                            </span>
                          </div>

                          {/* Mid row: Date & Time details */}
                          <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between text-xs text-slate-600 my-2">
                            <span className="flex items-center gap-1 font-semibold">
                              <Icon icon="solar:calendar-minimalistic-bold" className="text-slate-400" />
                              {dayjs(meet.date).format("DD MMM YYYY")}
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Icon icon="solar:clock-circle-bold" className="text-slate-400" />
                              {meet.time} ({meet.duration}m)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]" title={meet.roomName || meet.meetingId}>
                              {meet.roomName || meet.meetingId}
                            </span>
                          </div>

                          {/* Bottom Row: Actions */}
                          <div className="flex justify-between items-center gap-2 mt-1">
                            <div className="flex gap-2">
                              {isScheduled && (
                                <>
                                  <Tooltip title="Copy Room Code">
                                    <button 
                                      onClick={() => handleCopyLink(meet.roomName)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 border-none cursor-pointer flex items-center justify-center"
                                    >
                                      <Icon icon="solar:copy-bold" />
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Cancel Meeting">
                                    <button 
                                      onClick={() => handleStatusChange(meet._id, "Cancelled")}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border-none cursor-pointer flex items-center justify-center"
                                    >
                                      <Icon icon="solar:trash-bin-trash-bold" />
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Mark Completed">
                                    <button 
                                      onClick={() => handleStatusChange(meet._id, "Completed")}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border-none cursor-pointer flex items-center justify-center"
                                    >
                                      <Icon icon="solar:check-circle-bold" />
                                    </button>
                                  </Tooltip>
                                </>
                              )}

                              {isRequested && (
                                <>
                                  <Tooltip title="Decline Request">
                                    <button 
                                      onClick={() => handleStatusChange(meet._id, "Cancelled")}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border-none cursor-pointer flex items-center justify-center"
                                    >
                                      <Icon icon="solar:close-circle-bold" />
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Approve Request">
                                    <button 
                                      onClick={() => handleStatusChange(meet._id, "Scheduled")}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border-none cursor-pointer flex items-center justify-center"
                                    >
                                      <Icon icon="solar:check-circle-bold" />
                                    </button>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                            
                            {isScheduled ? (
                              <button
                                onClick={() => handleStartMeet(meet.roomName)}
                                className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1 border-none cursor-pointer transition-colors shadow-sm active:scale-95 ml-auto"
                              >
                                <Icon icon="solar:videocamera-bold" />
                                Join Call
                              </button>
                            ) : isRequested ? (
                              <button
                                onClick={() => handleStatusChange(meet._id, "Scheduled")}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1 border-none cursor-pointer transition-colors shadow-sm active:scale-95 ml-auto animate-pulse"
                              >
                                <Icon icon="solar:check-circle-bold" />
                                Approve Request
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Call closed</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <Icon icon="solar:calendar-add-linear" className="text-5xl opacity-40" />
                    <span className="text-sm font-semibold">No scheduled video consultations.</span>
                    <button 
                      onClick={() => {
                        setFormData(initialFormState);
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-xs font-bold text-primary-500 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      Schedule One Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Consultation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
              <Icon icon="solar:calendar-add-bold" className="text-lg" />
            </div>
            <span className="text-base font-black text-slate-800">Schedule Video Consultation</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setIsModalOpen(false)} className="mr-2">
            Cancel
          </Button>,
          <Button key="submit" onClick={handleScheduleSubmit} disabled={submitting}>
            {submitting ? "Scheduling..." : "Schedule Meeting"}
          </Button>,
        ]}
        width={650}
        centered
        className="rounded-2xl overflow-hidden shadow-xl"
        styles={{
          mask: { backdropFilter: "blur(4px)" },
          content: { padding: "24px", borderRadius: "16px" },
        }}
      >
        <div className="space-y-4 pt-4 text-slate-700">
          {/* Patient Autocomplete Search */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
              Search Registered Patient (Optional)
            </label>
            <AutoComplete
              style={{ width: "100%" }}
              options={searchResults}
              onSearch={handlePatientSearch}
              onSelect={handleSelectPatient}
              placeholder="🔍 Search Patient by Name, Phone, Email or ID..."
              allowClear
              loading={searchLoading}
              className="h-10 border border-slate-200 rounded-lg hover:border-slate-300 focus:border-primary-500 transition-colors"
              popupClassName="rounded-xl shadow-lg border border-slate-100"
            />
            <p className="text-[10px] text-slate-400 italic">
              Type to search from database. Selecting auto-fills the patient details.
            </p>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Details</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Patient Name *</label>
              <Input
                placeholder="Enter patient full name"
                value={formData.patientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                className="h-10 rounded-lg border-slate-200 focus:border-primary-500 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
              <Input
                placeholder="Enter 10-digit number"
                value={formData.patientPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientPhone: e.target.value.replace(/[^0-9]/g, "") }))}
                className="h-10 rounded-lg border-slate-200 focus:border-primary-500 text-sm font-semibold"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Email ID</label>
              <Input
                placeholder="patient@example.com"
                value={formData.patientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientEmail: e.target.value }))}
                className="h-10 rounded-lg border-slate-200 focus:border-primary-500 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Schedule</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Date *</label>
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current < dayjs().startOf("day")}
                onChange={(date, dateString) => setFormData((prev) => ({ ...prev, date: dateString }))}
                className="h-10 rounded-lg border-slate-200 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Start Time *</label>
              <TimePicker
                style={{ width: "100%" }}
                format="hh:mm A"
                use12Hours
                onChange={(time, timeString) => setFormData((prev) => ({ ...prev, time: timeString }))}
                className="h-10 rounded-lg border-slate-200 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Duration (Min)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full h-10 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 px-3 text-sm font-semibold bg-white"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">Consultation Notes / Reason</label>
            <Input.TextArea
              placeholder="Provide a brief summary or symptoms description..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="rounded-lg border-slate-200 focus:border-primary-500 text-sm font-semibold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VideoConsult;
