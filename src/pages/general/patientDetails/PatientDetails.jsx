import React, { useEffect, useState } from "react";
import { MdOutlineAddChart } from "react-icons/md";
import { message, Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import TabPane from "antd/es/tabs/TabPane";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import PatientMedicalDetails from "../../../component/patientDetails/PatientMedicalDetails";
import PatientDocuments from "../../../component/patientDetails/PatientDocuments";
import BillsEntery from "../../../component/bills/BillsEntery";
import TreatmentTracker from "../../../component/treatment/TreatmentTracker";
import SessionNotes from "../../../component/sessionNotes/SessionNotes";
import Exercise from "../../../component/exercise/Exercise";
import ConsentForm from "../consentForm/ConsentForm";
import Feedback from "../feedback/Feedback";
import PatientHistory from "../../../component/patientDetails/PatientHistory";
import Summary from "../summary/Summary";
import Prescription from "../../general/prescription/Prescription";
import Button from "../../../component/ui/Button";
import Card from "../../../component/ui/Card";
import { Skeleton } from "../../../component/ui/Skeleton";

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

const PatientDetails = () => {
  const usertype = JSON.parse(sessionStorage.getItem("user"));
  const [patientInfo, setPatientInfo] = useState([]);
  const [patientMedicalData, setPatientMedicalData] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);
  const { patient_id } = useParams();
  const navigate = useNavigate();

  // Vibrant colors for active tabs with modern gradients
  const tabColors = {
    1: { bg: "#23b8ff", gradient: "from-cyan-500 to-blue-500" },
    2: { bg: "#fe8325", gradient: "from-orange-500 to-red-500" },
    3: { bg: "#9a3412", gradient: "from-orange-800 to-red-900" },
    4: { bg: "#ff297f", gradient: "from-pink-500 to-rose-500" },
    5: { bg: "#047857", gradient: "from-emerald-700 to-teal-700" },
    7: { bg: "#ffb823", gradient: "from-yellow-500 to-amber-500" },
    8: { bg: "#2971ff", gradient: "from-blue-600 to-indigo-600" },
    10: { bg: "#f13636", gradient: "from-red-500 to-rose-600" },
    11: { bg: "#a929ff", gradient: "from-purple-600 to-violet-600" },
  };

  const getPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(
        `/patient/get-by-id/${patient_id}`
      );

      setPatientInfo(response?.data?.patient);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientMedicalDetails = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patientregistration/get-by-patient/${patient_id}`
      );
      setPatientMedicalData(response?.data?.patient);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getPatientDetails();
    if (activeTab === "1") {
      getPatientMedicalDetails();
    }
  }, [patient_id, activeTab]);

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  const userInfo = JSON.parse(sessionStorage.getItem("user"));

  const [sharing, setSharing] = useState(false);
  const handleShareEmail = async () => {
    try {
      setSharing(true);
      const response = await AxiosInstance.post("/share/email", {
        patientId: patientInfo.patientId,
      });
      message.success(response.data.message || "Records shared successfully!");
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to share records via email"
      );
    } finally {
      setSharing(false);
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
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* Modern Header */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-slate-800  text-4xl tracking-tight">
                Patient <span className="text-blue-500">Details</span>
              </h1>
              <p className="text-slate-500  font-medium">
                Comprehensive medical records and treatment history
              </p>
            </div>
            <div className="flex flex-row flex-wrap gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="secondary"
                className="rounded-xl px-4 py-2 flex items-center gap-2"
              >
                <Icon icon="tabler:arrow-left" />
                Back
              </Button>

              <Button
                onClick={handleShareEmail}
                loading={sharing}
                disabled={sharing}
                variant="secondary"
                className="rounded-xl px-4 py-2 flex items-center gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 :bg-emerald-500/10"
              >
                <Icon icon="tabler:share" />
                Share Records
              </Button>

              <Button
                onClick={() => {
                  if (
                    usertype?.userType === "accountant" ||
                    usertype?.userType === "generalManager" ||
                    usertype?.userType === "receptionist"
                  ) {
                    message.warning(
                      "Doctor & CEO Only Able Access This Assessment"
                    );
                    return;
                  }
                  navigate(`/assessment/${patient_id}`);
                }}
                className="rounded-xl px-4 py-2 flex items-center gap-2"
              >
                <MdOutlineAddChart />
                Assessment
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* Patient Info Card with Glassmorphism */}
        <StaggerItem>
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border-slate-200/60 ">
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 bg-blue-500" />

            <div className="p-8 z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-200/50">
                  {patientInfo?.profileImg || patientInfo?.photo ? (
                    <img
                      src={getImageUrl(patientInfo.profileImg || patientInfo.photo)}
                      alt={patientInfo.patientName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon icon="tabler:user-circle" className="text-5xl text-blue-600 " />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-400  uppercase tracking-widest m-0">
                    {loading ? <Skeleton className="h-4 w-20" /> : patientInfo.patientId}
                  </p>
                  <h2 className="font-black text-3xl md:text-4xl uppercase text-slate-800  tracking-tight m-0 mt-1">
                    {loading ? <Skeleton className="h-10 w-48" /> : patientInfo.patientName}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3 bg-slate-50/50  rounded-xl p-3 border border-slate-100 ">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon="tabler:info-circle" className="text-xl text-blue-600 " />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest m-0">Info</p>
                    <div className="font-black text-slate-800  m-0 truncate">
                      {loading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        `${patientInfo.patientAge} Y / ${patientInfo.patientGender}`
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/50  rounded-xl p-3 border border-slate-100 ">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon="tabler:calendar" className="text-xl text-emerald-600 " />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest m-0">DOB</p>
                    <div className="font-black text-slate-800  m-0 truncate">
                      {loading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        formatDate(patientInfo.patientDOB)
                      )}
                    </div>
                  </div>
                </div>

                {(loading || patientInfo.patientPhone) && (
                  <div className="flex items-center gap-3 bg-slate-50/50  rounded-xl p-3 border border-slate-100 ">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon icon="tabler:phone" className="text-xl text-purple-600 " />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest m-0">Phone</p>
                      <div className="font-black text-slate-800  m-0 truncate">
                        {loading ? (
                          <Skeleton className="h-4 w-32" />
                        ) : (
                          patientInfo.patientPhone
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(loading || patientInfo.patientEmail) && (
                  <div className="flex items-center gap-3 bg-slate-50/50  rounded-xl p-3 border border-slate-100 ">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon icon="tabler:mail" className="text-xl text-amber-600 " />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest m-0">Email</p>
                      <div className="font-black text-slate-800  m-0 truncate">
                        {loading ? (
                          <Skeleton className="h-4 w-40" />
                        ) : (
                          patientInfo.patientEmail
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(loading || patientInfo.patientAddress) && (
                  <div className="flex items-center gap-3 bg-slate-50/50  rounded-xl p-3 border border-slate-100  md:col-span-2 lg:col-span-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon icon="tabler:map-pin" className="text-xl text-rose-600 " />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest m-0">Address</p>
                      <div className="font-black text-slate-800  m-0 capitalize">
                        {loading ? (
                          <Skeleton className="h-4 w-3/4" />
                        ) : (
                          patientInfo.patientAddress
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </StaggerItem>

        {/* Modern Tabs Section */}
        <StaggerItem>
          <div className="w-full">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              destroyInactiveTabPane={true}
              animated={{ inkBar: true, tabPane: true }}
              tabBarStyle={{ borderBottom: 'none' }}
              className="custom-tabs "
              renderTabBar={(props, DefaultTabBar) => (
                <div className="bg-slate-100/50  backdrop-blur-xl p-2 rounded-2xl overflow-x-auto border border-slate-200/50 ">
                  <DefaultTabBar {...props} style={{ background: "transparent", border: "none" }} />
                </div>
              )}
            >
              {usertype?.userType !== "accountant" &&
                usertype?.userType !== "generalManager" && (
                  <TabPane
                    tab={
                      <div
                        className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "1"
                          ? `bg-gradient-to-r ${tabColors[1].gradient} text-white shadow-lg`
                          : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                          }`}
                      >
                        Patient Medical Data
                      </div>
                    }
                    key="1"
                  >
                    <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                      <PatientMedicalDetails
                        patientMedicalData={patientMedicalData}
                      />
                    </div>
                  </TabPane>
                )}

              {usertype?.userType !== "generalManager" && (
                <TabPane
                  tab={
                    <div
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "2"
                        ? `bg-gradient-to-r ${tabColors[2].gradient} text-white shadow-lg`
                        : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                        }`}
                    >
                      Lab Reports
                    </div>
                  }
                  key="2"
                >
                  <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                    <PatientDocuments />
                  </div>
                </TabPane>
              )}
              <TabPane
                tab={
                  <div
                    className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "4"
                      ? `bg-gradient-to-r ${tabColors[4].gradient} text-white shadow-lg`
                      : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                      }`}
                  >
                    Treatment Data
                  </div>
                }
                key="4"
              >
                <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                  <TreatmentTracker />
                </div>
              </TabPane>
              <TabPane
                tab={
                  <div
                    className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "11"
                      ? `bg-gradient-to-r ${tabColors[11].gradient} text-white shadow-lg`
                      : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                      }`}
                  >
                    Prescription
                  </div>
                }
                key="11"
              >
                <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                  <Prescription />
                </div>
              </TabPane>
              <TabPane
                tab={
                  <div
                    className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "3"
                      ? `bg-gradient-to-r ${tabColors[3].gradient} text-white shadow-lg`
                      : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                      }`}
                  >
                    Billing
                  </div>
                }
                key="3"
              >
                <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                  <BillsEntery />
                </div>
              </TabPane>
              {usertype?.userType !== "generalManager" && (
                <TabPane
                  tab={
                    <div
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "5"
                        ? `bg-gradient-to-r ${tabColors[5].gradient} text-white shadow-lg`
                        : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                        }`}
                    >
                      Session Notes
                    </div>
                  }
                  key="5"
                >
                  <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                    <SessionNotes />
                  </div>
                </TabPane>
              )}

              {usertype?.userType !== "generalManager" && (
                <TabPane
                  tab={
                    <div
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "8"
                        ? `bg-gradient-to-r ${tabColors[8].gradient} text-white shadow-lg`
                        : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                        }`}
                    >
                      Feedback
                    </div>
                  }
                  key="8"
                >
                  <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                    <Feedback />
                  </div>
                </TabPane>
              )}
              {usertype?.userType !== "generalManager" && (
                <TabPane
                  tab={
                    <div
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "7"
                        ? `bg-gradient-to-r ${tabColors[7].gradient} text-white shadow-lg`
                        : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                        }`}
                    >
                      Consent Form
                    </div>
                  }
                  key="7"
                >
                  <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                    <ConsentForm />
                  </div>
                </TabPane>
              )}
              <TabPane
                tab={
                  <div
                    className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${activeTab === "10"
                      ? `bg-gradient-to-r ${tabColors[10].gradient} text-white shadow-lg`
                      : "bg-slate-200  text-slate-600  hover:bg-slate-300 :bg-slate-600"
                      }`}
                  >
                    Summary
                  </div>
                }
                key="10"
              >
                <div className="bg-white/40  backdrop-blur-md border border-slate-200  p-6 rounded-2xl min-h-[400px] mt-2">
                  <Summary />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default PatientDetails;
