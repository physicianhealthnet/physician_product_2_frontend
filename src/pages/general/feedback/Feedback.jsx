import React, { useEffect, useState } from "react";
import {
  Rate,
  Radio,
  Select,
  message,
} from "antd";
import { useParams } from "react-router-dom";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";

function Feedback() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { patient_id } = useParams();

  const [patientDetails, setPatientDetails] = useState({});
  const [formData, setFormData] = useState({});

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetPatientDetails = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patient/get-by-id/${patient_id}`
      );
      setPatientDetails(response.data.patient);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetPatientDetails();
  }, []);

  const handleGetFeedback = async () => {
    try {
      const response = await AxiosInstance.get(`/feedback/get/${patient_id}`);
      setFormData(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    handleGetFeedback();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      clinicId: user.clinicId,
      patientId: patient_id,
      patientName: patientDetails.patientName,
      patientGender: patientDetails.patientGender,
      patientAge: patientDetails.patientAge,
      patientPhone: patientDetails.patientPhone,
    };

    if (!formData.overallExperience) {
      message.warning("Please provide at least the overall experience rating.");
      return;
    }
    try {
      await AxiosInstance.post("/feedback/add", payload);
      message.success("Thank you for your feedback!");
      handleGetFeedback();
    } catch (error) {
      console.error(error);
      message.error("Failed to submit feedback. Please try again.");
    }
  };

  const handleUpdate = async () => {
    try {
      await AxiosInstance.patch(
        `/feedback/edit/${formData._id}`,
        formData
      );
      handleGetFeedback();
      message.success("Feedback Updated");
    } catch (error) {
      message.error("Fail to Update Feedback");
      console.error(error);
    }
  };

  const SectionTitle = ({ children }) => (
    <h3 className="text-lg font-bold text-slate-800  mt-6 mb-4 pb-2 border-b border-slate-100 ">
      {children}
    </h3>
  );

  const QuestionLabel = ({ children }) => (
    <p className="text-sm font-medium text-slate-600  mb-2">
      {children}
    </p>
  );

  // --- UI ---
  return (
    <div className="max-w-3xl mx-auto">
      <Card title="📝 Doctor Feedback">

        {/* Service Feedback */}
        <SectionTitle>Service Feedback</SectionTitle>

        <div className="mb-6">
          <QuestionLabel>How would you rate your overall experience?</QuestionLabel>
          <Rate
            className="text-2xl"
            value={formData?.overallExperience}
            onChange={(value) => handleCustomChange("overallExperience", value)}
          />
        </div>

        <div className="mb-6">
          <QuestionLabel>Was the doctor polite and professional?</QuestionLabel>
          <Radio.Group
            className=""
            value={formData?.politeAndProfessional}
            onChange={(e) =>
              handleCustomChange("politeAndProfessional", e.target.value)
            }
          >
            <Radio value="yes" className="">Yes</Radio>
            <Radio value="no" className="">No</Radio>
          </Radio.Group>
        </div>

        <div className="mb-6">
          <QuestionLabel>Was the treatment explained clearly?</QuestionLabel>
          <Radio.Group
            value={formData?.treatmentExplainedClearly}
            onChange={(e) =>
              handleCustomChange("treatmentExplainedClearly", e.target.value)
            }
          >
            <Radio value="yes" className="">Yes</Radio>
            <Radio value="no" className="">No</Radio>
          </Radio.Group>
        </div>

        <div className="mb-6">
          <QuestionLabel>Was your pain/problem addressed effectively?</QuestionLabel>
          <Radio.Group
            value={formData?.painAddressedEffectively}
            onChange={(e) =>
              handleCustomChange("painAddressedEffectively", e.target.value)
            }
          >
            <Radio value="yes" className="">Yes</Radio>
            <Radio value="no" className="">No</Radio>
          </Radio.Group>
        </div>

        {/* Clinic/Facility Feedback */}
        <SectionTitle>Clinic / Facility Feedback</SectionTitle>

        <div className="mb-6">
          <QuestionLabel>Waiting time satisfaction:</QuestionLabel>
          <Select
            placeholder="Select option"
            className="w-full max-w-xs"
            value={formData?.waitingTimeSatisfaction}
            onChange={(value) =>
              handleCustomChange("waitingTimeSatisfaction", value)
            }
          >
            <Select.Option value="good">Good</Select.Option>
            <Select.Option value="average">Average</Select.Option>
            <Select.Option value="poor">Poor</Select.Option>
          </Select>
        </div>

        <div className="mb-6">
          <QuestionLabel>Cleanliness & comfort of the clinic:</QuestionLabel>
          <Rate
            value={formData?.cleanlinessComfort}
            onChange={(value) => handleCustomChange("cleanlinessComfort", value)}
          />
        </div>

        <div className="mb-6">
          <QuestionLabel>Appointment booking & process ease:</QuestionLabel>
          <Rate
            value={formData?.appointmentEase}
            onChange={(value) => handleCustomChange("appointmentEase", value)}
          />
        </div>

        {/* Outcome Feedback */}
        <SectionTitle>Outcome Feedback</SectionTitle>

        <div className="mb-6">
          <QuestionLabel>Have you noticed improvement since treatment?</QuestionLabel>
          <Radio.Group
            value={formData?.improvementAfterTreatment}
            onChange={(e) =>
              handleCustomChange("improvementAfterTreatment", e.target.value)
            }
          >
            <Radio value="yes" className="">Yes</Radio>
            <Radio value="partially" className="">Partially</Radio>
            <Radio value="no" className="">No</Radio>
          </Radio.Group>
        </div>

        <div className="mb-6">
          <QuestionLabel>Would you recommend this clinic/doctor to others?</QuestionLabel>
          <Radio.Group
            value={formData?.recommendClinic}
            onChange={(e) =>
              handleCustomChange("recommendClinic", e.target.value)
            }
          >
            <Radio value="yes" className="">Yes</Radio>
            <Radio value="no" className="">No</Radio>
          </Radio.Group>
        </div>

        {/* Suggestions */}
        <div className="mb-6">
          <QuestionLabel>Suggestions / Comments:</QuestionLabel>
          <textarea
            rows={4}
            name="remarks"
            placeholder="Write your feedback here..."
            value={formData?.remarks || ""}
            onChange={handleInputChange}
            className="w-full border border-slate-300  rounded-lg p-3 text-base bg-white  text-slate-900  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 :text-slate-600"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 ">
          <Button
            variant="primary"
            onClick={formData?._id ? handleUpdate : handleSubmit}
            className="w-full sm:w-auto"
          >
            {formData?._id ? "Update Feedback" : "Submit Feedback"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Feedback;
