import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { AxiosInstance } from "../../../../utilities/AxiosInstance";
import Button from "../../../../component/ui/Button";

const Page6 = () => {
  const printRef = useRef();
  const { patient_id } = useParams();
  const [data, setData] = useState({});
  const handlePrint = useReactToPrint({
    contentRef: printRef, // <-- REQUIRED in v3
  });
  const handleDataFetch = async () => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-tracker/patient/${patient_id}`
      );
      setData(response?.data || {});
    } catch (error) {
      console.error(error);
    }
  };

  const renderTeethGrid = (teethStatus) => {
    // Check if teethStatus is an array with items
    if (!teethStatus || !Array.isArray(teethStatus) || teethStatus.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        {teethStatus.map((data, index) => (
          <div
            key={index}
            className="p-3 border border-green-200  rounded-none w-full bg-green-50  text-green-900 "
          >
            <h1 className="font-bold text-xl text-nowrap mb-2">
              Teeth No: {data.teethName}
            </h1>
            <ul className="list-disc pl-5">
              {data?.complaints?.map((innerData, innerIndex) => (
                <li className="text-base font-medium capitalize" key={innerIndex}>
                  {innerData}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };


  const renderSessionDetails = (session, index) => {
    const hasSessionTeethData =
      session?.teethStatus && Array.isArray(session?.teethStatus) && session.teethStatus.length > 0;
    const hasSessionOtherData =
      session?.date ||
      session?.therapist ||
      session?.subjective ||
      session?.homeAdvice ||
      session?.nextReview ||
      session?.vas ||
      session?.protocol;

    return (
      <div key={index} className="border border-slate-200  p-4 mb-4 rounded-none bg-white ">
        <h3 className="text-lg font-bold mb-3 text-slate-800 ">Session {session.sessionNo}</h3>

        {hasSessionOtherData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4 text-slate-700 ">
            {session.date && (
              <p>
                <strong className="text-slate-900 ">Date:</strong> {session.date}
              </p>
            )}
            {session.therapist && (
              <p>
                <strong className="text-slate-900 ">Doctor:</strong> {session.therapist}
              </p>
            )}
            {session?.subjective && (
              <p>
                <strong className="text-slate-900 ">Subjective:</strong> {session.subjective}
              </p>
            )}
            {session?.homeAdvice && (
              <p>
                <strong className="text-slate-900 ">Home Advice:</strong> {session.homeAdvice}
              </p>
            )}
            {session?.nextReview && (
              <p>
                <strong className="text-slate-900 ">Next Review:</strong> {session.nextReview}
              </p>
            )}
            {session?.vas && (
              <p>
                <strong className="text-slate-900 ">VAS:</strong> {session.vas}
              </p>
            )}
            {session?.protocol && (
              <p>
                <strong className="text-slate-900 ">Protocol:</strong> {session.protocol}
              </p>
            )}
          </div>
        )}

        {hasSessionTeethData && (
          <section>{renderTeethGrid(session.teethStatus)}</section>
        )}
      </div>
    );
  };

  useEffect(() => {
    handleDataFetch();
  }, [patient_id]);

  // Check if sections have data
  const hasBasicData =
    data.patientId ||
    data.sessionNo ||
    data.doctor ||
    data.treatment_status ||
    data.date ||
    data.nextReview;
  const hasTeethData =
    data.teethStatus && Array.isArray(data.teethStatus) && data.teethStatus.length > 0;
  const hasOtherData = data.homeAdvice || data.notes || data.protocol;
  const hasUpcomingSessions =
    data.upcomming_sessions && data.upcomming_sessions.length > 0;

  return (
    <div className="p-4">
      <Button
        variant="primary"
        onClick={handlePrint}
        className="mb-6"
      >
        Print Page
      </Button>

      <div ref={printRef} className="p-6 text-[14px] bg-white  rounded-none border border-slate-200 ">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6 bg-blue-100  text-blue-800  p-3 rounded-none border border-blue-200 ">
          Treatment Summary
        </h1>

        {/* Basic Details */}
        {hasBasicData && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-orange-100  text-orange-900  rounded-none p-2 border border-orange-200 ">
              Basic Details
            </h2>
            <div className="grid grid-cols-2 gap-3 text-slate-700 ">
              {data.patientId && (
                <p>
                  <strong className="text-slate-900 ">Patient ID:</strong> {data.patientId}
                </p>
              )}
              {data.sessionNo && (
                <p>
                  <strong className="text-slate-900 ">Session No:</strong> {data.sessionNo}
                </p>
              )}
              {data.doctor && (
                <p>
                  <strong className="text-slate-900 ">Doctor:</strong> {data.doctor}
                </p>
              )}
              {data.treatment_status && (
                <p>
                  <strong className="text-slate-900 ">Status:</strong> {data.treatment_status}
                </p>
              )}
              {data.date && (
                <p>
                  <strong className="text-slate-900 ">Date:</strong> {data.date}
                </p>
              )}
              {data.nextReview && (
                <p>
                  <strong className="text-slate-900 ">Next Review:</strong> {data.nextReview}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Treatments */}
        {hasTeethData && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-orange-100  text-orange-900  rounded-none p-2 border border-orange-200 ">
              Treatments
            </h2>
            {renderTeethGrid(data?.teethStatus)}
          </section>
        )}

        {/* Exercise, Home Advice, Notes */}
        {hasOtherData && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-orange-100  text-orange-900  rounded-none p-2 border border-orange-200 ">
              Other Details
            </h2>
            <div className="flex flex-col gap-2 text-slate-700 ">
              {data.homeAdvice && (
                <p>
                  <strong className="text-slate-900 ">Home Advice:</strong> {data.homeAdvice}
                </p>
              )}
              {data.notes && (
                <p>
                  <strong className="text-slate-900 ">Notes:</strong> {data.notes}
                </p>
              )}
              {data.protocol && (
                <p>
                  <strong className="text-slate-900 ">Protocol:</strong> {data.protocol || "N/A"}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Upcoming Sessions */}
        {hasUpcomingSessions && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-slate-800 ">Upcoming Sessions</h2>
            {data.upcomming_sessions.map((s, i) => renderSessionDetails(s, i))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Page6;
