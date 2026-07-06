import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";
import { useRef } from "react";
import html2pdf from "html2pdf.js";

function ConsentFormView({ form }) {
  const consentRef = useRef();
  return (
    <>
      <button
        className="bg-blue-500 font-bold text-white p-4 text-base py-2 rounded ml-4"
        onClick={() => {
          const element = consentRef.current;
          const options = {
            margin: 0,
            with: 850,
            filename: `${form.patientName || "invoice"}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              onclone: (clonedDoc) => {
                clonedDoc.documentElement.classList.remove("dark");
              },
            },
            jsPDF: {
              unit: "in",
              format: "a4",
              orientation: "portrait",
            },
          };
          html2pdf().from(element).set(options).save();
        }}
      >
        Print
      </button>
      <div ref={consentRef} className="border rounded-xl shadow-md p-8">
        <h1 className="font-semibold text-4xl">
          PHYSICIAN TREATMENT CONSENT FORM
        </h1>
        <hr className="my-2" />

        <div>
          I, <span className="font-bold">{form.patientName}</span>, hereby give
          my consent to undergo physician evaluation and treatment provided by the
          licensed physicians at this Physician Clinic.
          <br />
          <br />I understand that physician treatment may include, but is not
          limited to: examinations, X-rays, cleaning, fillings, root canals,
          extractions, crowns, scaling, periodontal therapy, dentures,
          orthodontic procedures, and minor surgical procedures.
          <h1 className="font-bold text-xl mt-5">
            Acknowledgments and Agreements
          </h1>
          <hr className="my-2" />
          <p className="font-bold text-base">
            By signing this form, I acknowledge and agree that:
          </p>
          <div className="px-4">
            <p>
              <span className="font-bold">1) Nature of Treatment – </span>I
              understand the nature of the proposed physician treatment and that
              the treatment plan may change depending on diagnosis or response.
            </p>

            <p>
              <span className="font-bold">2) Risks & Complications – </span>I
              understand physician procedures may involve risks such as pain,
              swelling, bleeding, infection, numbness, sensitivity, or the need
              for additional procedures.
            </p>

            <p>
              <span className="font-bold">3) Patient Responsibility – </span>I
              agree to follow the physician’s instructions and inform them of any
              changes in my health or medications.
            </p>

            <p>
              <span className="font-bold">4) Confidentiality – </span>
              My records will be kept confidential and shared only with
              authorized healthcare or insurance providers involved in my care.
              De-identified data may be used for research or education.
            </p>

            <p>
              <span className="font-bold">5) Alternatives – </span>I understand
              I may decline treatment or choose alternative options, which have
              been explained to me.
            </p>

            <p>
              <span className="font-bold">6) Local Anesthesia Consent – </span>I
              consent to the use of local anesthesia when required, and I
              understand the possible side effects.
            </p>

            <p>
              <span className="font-bold">7) Payment Responsibility – </span>I
              acknowledge that I am responsible for payment of services received
              and understand the clinic’s cancellation policy.
            </p>

            <p>
              <span className="font-bold">8) Right to Withdraw – </span>I may
              withdraw consent at any time by informing the physician.
            </p>

            <p>
              <span className="font-bold">9) Communication Consent – </span>I
              consent to receive communication from the clinic regarding
              appointments and treatment.
            </p>
          </div>
        </div>

        <div className="flex flex-row gap-5 mt-4">
          <p className="font-bold text-lg">Phone calls: {form.phoneCalls}</p>
          <p className="font-bold text-lg">Text messages: {form.textMessage}</p>
          <p className="font-bold text-lg">Email: {form.email}</p>
        </div>

        <p className="mt-6">
          <strong>Acknowledgment & Signature:</strong> I confirm that I have
          read and understood this consent form. I have had the opportunity to
          ask questions, and all concerns have been addressed. I voluntarily
          agree to undergo physician treatment.
        </p>

        <div className="flex flex-row items-start justify-between mt-10">
          {/* Patient Section */}
          <div>
            <div className="mb-2 flex flex-row gap-2 text-base">
              <p className="font-bold m-0">Patient/Guardian Name:</p>
              <p className="m-0 font-bold text-gray-700">{form.guardianName}</p>
            </div>

            <p className="font-bold">Signature: </p>
            <img
              src={
                form?.guardianSign && form.guardianSign.trim() !== ""
                  ? form.guardianSign
                  : "/placeholder-sign.png"
              }
              alt="Guardian Signature"
              className="w-40 h-auto"
            />

            <p className="font-bold mt-2">Date: {form.guardianDate}</p>
          </div>

          {/* Doctor Section */}
          <div>
            <div className="mb-2 flex flex-row gap-2 text-base">
              <p className="font-bold m-0">Doctor Name:</p>
              <p className="m-0 font-bold text-gray-700">{form.doctorName}</p>
            </div>

            <p className="font-bold">Signature: </p>
            <img
              src={
                form?.doctorSign && form.doctorSign.trim() !== ""
                  ? form.doctorSign
                  : "/placeholder-sign.png"
              }
              alt="Doctor Signature"
              className="w-40 h-auto"
            />

            <p className="font-bold mt-2">Date: {form.doctorDate}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConsentFormView;
