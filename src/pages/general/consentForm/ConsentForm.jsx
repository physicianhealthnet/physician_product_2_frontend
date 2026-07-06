import { message } from "antd";
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import ConsentFormView from "./ConsentFormView";
import { useParams } from "react-router-dom";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import Input from "../../../component/ui/Input";

// ---------------- Signature Pad ----------------
const SignaturePad = forwardRef(({ label }, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    },
    save: () => canvasRef.current.toDataURL("image/png"), // PNG export
  }));

  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold text-slate-700 ">{label}</label>
      <div className="border-2 border-slate-300  rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-auto cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => ref.current.clear()}
        className="w-fit"
      >
        Clear Signature
      </Button>
    </div>
  );
});

// ---------------- Consent Form ----------------
const ConsentForm = () => {
  const { patient_id } = useParams();

  const guardianSignRef = useRef();
  const doctorSignRef = useRef();
  const [swaper, setSwaper] = useState(false);
  const [patientDetails, setPatientDetails] = useState({});
  const fieldConfig = [
    { name: "phoneCalls", label: "Phone Calls", type: "radio" },
    { name: "textMessage", label: "Text Message", type: "radio" },
    { name: "email", label: "Email", type: "radio" },
    { name: "consentDate", label: "Consent Date", type: "date" },
    { name: "guardianName", label: "Patient/Guardian Name", type: "text" },
    {
      name: "doctorName",
      label: "Doctor Name",
      type: "text",
    },
    { name: "guardianDate", label: "Patient/Guardian Date", type: "date" },

    {
      name: "doctorDate",
      label: "Doctor Date",
      type: "date",
    },
  ];

  const [form, setForm] = useState(
    fieldConfig.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const handleGetForm = async (e) => {
    try {
      const response = await AxiosInstance.get(
        `/consentfrom/get-patient/${patient_id}`
      );
      setForm(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetForm();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get PNG data URLs from signature pads
    const guardianSign = guardianSignRef.current ? guardianSignRef.current.save() : "";
    const doctorSign = doctorSignRef.current ? doctorSignRef.current.save() : "";

    const finalData = {
      ...form,
      guardianSign,
      doctorSign,
      clinicId: Array.isArray(patientDetails.clinicId) 
        ? patientDetails.clinicId[0] 
        : patientDetails.clinicId,
      patientId: patient_id,
      patientName: patientDetails?.patientName,
    };

    try {
      await AxiosInstance.post("/consentfrom/add", finalData);
      message.success("Consent form created successfully");
      handleGetForm();
      setSwaper(true);
    } catch (error) {
      console.error(error);
      message.error("Error submitting form");
    }
  };

  const handleUpdate = async () => {
    try {
      await AxiosInstance.put(
        `/consentfrom/edit/${form?._id}`,
        form
      );
      message.success("Successfully Update");
      handleGetForm();
      setSwaper(true);
    } catch (error) {
      message.error("Fail to Update");
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <div className="prose  max-w-none text-slate-700 ">
          <h1 className="font-bold text-3xl text-slate-800  mb-4">
            PHYSICIAN TREATMENT CONSENT FORM
          </h1>
          <hr className="my-4 border-slate-200 " />
          <div>
            I, <span className="font-bold text-slate-900  underline decoration-dotted">{patientDetails?.patientName}</span>,
            hereby give my consent to undergo physician evaluation and treatment
            provided by the licensed physicians at this Physician Clinic.
            <br />
            <br />I understand that physician treatment may include, but is not
            limited to: examinations, X-rays, cleaning, fillings, root canals,
            extractions, crowns, scaling, periodontal therapy, dentures,
            orthodontic procedures, and minor surgical procedures.
            <h3 className="font-bold text-xl mt-6 mb-3 text-slate-800 ">
              Acknowledgments and Agreements
            </h3>
            <hr className="mb-4 border-slate-200 " />
            <p className="font-bold text-base mb-4">
              By signing this form, I acknowledge and agree that:
            </p>
            <div className="space-y-3 pl-4 border-l-4 border-slate-100 ">
              <p>
                <span className="font-bold text-slate-900 ">1) Nature of Treatment – </span>I
                understand the nature of the proposed physician treatment and that
                the treatment plan may change depending on diagnosis or response.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">2) Risks & Complications – </span>I
                understand physician procedures may involve risks such as pain,
                swelling, bleeding, infection, numbness, sensitivity, or the need
                for additional procedures.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">3) Patient Responsibility – </span>I
                agree to follow the physician’s instructions and inform them of any
                changes in my health or medications.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">4) Confidentiality – </span>
                My records will be kept confidential and shared only with
                authorized healthcare or insurance providers involved in my care.
                De-identified data may be used for research or education.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">5) Alternatives – </span>I understand
                I may decline treatment or choose alternative options, which have
                been explained to me.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">6) Local Anesthesia Consent – </span>I
                consent to the use of local anesthesia when required, and I
                understand the possible side effects.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">7) Payment Responsibility – </span>I
                acknowledge that I am responsible for payment of services received
                and understand the clinic’s cancellation policy.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">8) Right to Withdraw – </span>I may
                withdraw consent at any time by informing the physician.
              </p>

              <p>
                <span className="font-bold text-slate-900 ">9) Communication Consent – </span>I
                consent to receive communication from the clinic regarding
                appointments and treatment.
              </p>
            </div>
          </div>
          <p className="mt-6 bg-slate-50  p-4 rounded-lg">
            <strong className="text-slate-900 ">Acknowledgment & Signature:</strong> I confirm that I have
            read and understood this consent form. I have had the opportunity to
            ask questions, and all concerns have been addressed. I voluntarily
            agree to undergo physician treatment.
          </p>
          <p className="text-sm italic text-slate-500 mt-2">
            (மேலே குறிப்பிட்டுள்ள அனைத்து கேள்விகளையும் புரிந்து கொண்டு விளக்கம்
            அளித்துள்ளேன். மேலும் பல் மருத்துவரின் சிகிச்சை முறைகளையும், அதன்
            பின்விளைவுகளையும் புரிந்து கொண்டு பல் மருத்துவர் அளிக்கும் அனைத்து
            சிகிச்சை முறைகளுக்கும் முழு மனதுடன் சம்மதிக்கிறேன்)
          </p>
        </div>
      </Card>

      <Card>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (form?._id) {
              handleUpdate(e);
            } else {
              handleSubmit(e);
            }
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-slate-800 ">Consent Details</h3>
            {form?._id && swaper && (
              <Button
                variant="secondary"
                onClick={() => setSwaper(false)}
                type="button"
              >
                Cancel Edit
              </Button>
            )}
            {!form?._id || swaper ? (
              <></>
            ) : (
              <Button
                variant="primary"
                onClick={() => setSwaper(true)}
                type="button"
              >
                Edit Consent
              </Button>
            )}
          </div>

          {!form?._id || swaper ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fieldConfig?.map((field) =>
                field.type === "radio" ? (
                  <div key={field.name} className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 ">{field.label}</label>
                    <div className="flex flex-row gap-4 p-3 border border-slate-300  rounded-lg bg-slate-50 ">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value="Yes"
                          checked={form?.[field.name] === "Yes"}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500   "
                        />
                        <span className="text-slate-700 ">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value="No"
                          checked={form?.[field.name] === "No"}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500   "
                        />
                        <span className="text-slate-700 ">No</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <Input
                    key={field.name}
                    type={field.type}
                    label={field.label}
                    name={field.name}
                    value={form?.[field.name]}
                    onChange={handleChange}
                  />
                )
              )}

              {/* Signature Pads */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <SignaturePad
                  ref={guardianSignRef}
                  label="Patient/Guardian Signature"
                />
                <SignaturePad ref={doctorSignRef} label="Doctor Signature" />
              </div>

              <div className="md:col-span-2 flex justify-end mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full md:w-auto min-w-[150px]"
                >
                  {form?._id ? "Update Consent Form" : "Submit Consent Form"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <ConsentFormView form={form} />
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default ConsentForm;
