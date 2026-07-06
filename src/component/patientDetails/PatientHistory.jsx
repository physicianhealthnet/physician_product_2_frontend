import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { useParams } from "react-router-dom";
import formatDateToDDMMYYYY from "../../utilities/formatter";
import PatientMedicalDetails from "./PatientMedicalDetails";
import PatientDocuments from "./PatientDocuments";
import { Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import TreatmentTracker from "../treatment/TreatmentTracker";
import SessionNotes from "../sessionNotes/SessionNotes";
import BillsEntery from "../bills/BillsEntery";
import PhysicianAssessmentView from "../../pages/general/assessment/PhysicianAssessmentView";
import Prescription from "../../pages/general/prescription/Prescription";

function PatientHistory() {
  const { patient_id } = useParams();
  const [allHistory, setAllHistory] = useState([]);

  const [targetedData, setTargetedData] = useState();

  const [swaper, setSwaper] = useState(false);
  const usertype = JSON.parse(sessionStorage.getItem("user"));

  const history = async () => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-history/get-all/${patient_id}`
      );
      setAllHistory(response?.data?.patientRegister);
    } catch (error) {
      console.error(error);
    }
  };

  const targetedHistory = async (data) => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-history/get-targeted/${data?.treatment_id}`
      );
      setTargetedData(response?.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    history();
  }, []);
  return (
    <div>
      {allHistory.length > 0 ? (
        <div className="grid grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 gap-4">
          {allHistory.map((data, index) => (
            <div
              key={index}
              onClick={() => {
                targetedHistory(data);
                setSwaper(true);
              }}
              className="rounded-md border p-4 flex flex-col gap-2 "
            >
              <div className=" flex flex-row flex-wrap items-center justify-between">
                <div className="flex flex-row gap-4">
                  <p className="font-bold m-0">DoA:</p>
                  <p className="m-0">{formatDateToDDMMYYYY(data?.createdAt)}</p>
                </div>
                <div className="flex flex-row gap-4">
                  <p className="font-bold m-0">Treatment End Date:</p>
                  <p className="m-0">{formatDateToDDMMYYYY(data?.updatedAt)}</p>
                </div>
              </div>
              <hr />
              {data?.primaryComplaint && (
                <div className="flex flex-row gap-4">
                  <p className="font-bold m-0">Primary Complaints:</p>
                  <p className="m-0">{data?.primaryComplaint}</p>
                </div>
              )}
              {data?.secondaryComplaint && (
                <div className="flex flex-row gap-4">
                  <p className="font-bold m-0">Secondary Complaints:</p>
                  <p className="m-0">{data?.secondaryComplaint}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No history found for this patient.</p>
      )}
      {swaper && (
        <div className="w-screen h-full z-50 flex justify-center bg-black/50 fixed top-0 left-0 p-20 overflow-auto">
          <div className="w-fit h-fit bg-white p-6 rounded-xl shadow-lg relative">
            <div className="flex flex-row items-center justify-between">
              <h1 className="font-bold text-xl">Treatment History</h1>
              <button
                onClick={() => setSwaper(false)}
                className="top-4 right-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
            <Tabs
              defaultActiveKey="1"
              animated={{ inkBar: true, tabPane: true }}
              tabBarStyle={{ fontWeight: "bold" }}
              className=""
            >
              {usertype?.userType !== "accountant" &&
                usertype?.userType !== "generalManager" && (
                  <TabPane tab="Medical History" key="1">
                    <PatientMedicalDetails
                      patientMedicalData={targetedData?.patientRegdata}
                      swaper={swaper}
                    />
                  </TabPane>
                )}
              {usertype?.userType !== "generalManager" && (
                <TabPane tab=" Patient Document" key="2">
                  <PatientDocuments
                    documents={targetedData?.patientDocuments}
                    swaper={swaper}
                  />
                </TabPane>
              )}
              {usertype?.userType !== "doctor" && (
                <TabPane tab="Patient Bill" key="3">
                  <BillsEntery outerswaper={swaper} />
                </TabPane>
              )}

              <TabPane tab="Treatment Tracker" key="4">
                <TreatmentTracker
                  tracker={targetedData?.treatmentTracker}
                  outerswaper={swaper}
                />
              </TabPane>

              {usertype?.userType !== "generalManager" && (
                <TabPane tab="Session Notes" key="5">
                  <SessionNotes
                    session={targetedData?.sessionNotes}
                    swaper={swaper}
                  />
                </TabPane>
              )}
              {usertype?.userType !== "generalManager" && (
                <TabPane tab="Physician Assessment" key="6">
                  <PhysicianAssessmentView
                    data={targetedData?.assessmentData?.[0]}
                  />
                </TabPane>
              )}
              <TabPane tab="Prescription">
                <Prescription
                  data={targetedData?.prescriptionData}
                  history={true}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHistory;
