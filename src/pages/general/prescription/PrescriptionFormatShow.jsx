import html2pdf from "html2pdf.js";
import { useSelector } from "react-redux";
import rsymb from "../../../assets/rsymb.jpg";
import { message } from "antd";

function PrescriptionFormatShow({
  patientInfo,
  prescription,
  setFormatOpen,
  history,
  handleSharePrescription,
  sharing,
}) {
  const theme = useSelector((state) => state.theme?.theme);

  const handleShareWithPDF = async () => {
    const element = document.getElementById("prescription-content");
    const options = {
      margin: 10,
      filename: `Prescription_${prescription?.prescriptionId || "unknown"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc) => {
          const content = clonedDoc.getElementById("prescription-content");
          if (content) {
            // Force a standard background color and remove problematic modern CSS properties
            content.style.backgroundColor = "#ffffff";
          }
          // Remove any oklch references from all style tags in the cloned document
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (const tag of styleTags) {
            tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, "#333");
          }
        }
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      const pdfBase64 = await html2pdf().from(element).set(options).output('datauristring');
      const base64Data = pdfBase64.split(',')[1];
      await handleSharePrescription(prescription._id, base64Data);
    } catch (error) {
      console.error("Error generating/sharing PDF:", error);
      message.error("Failed to generate PDF for sharing");
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById("prescription-content");
    if (!element) {
      message.warning("Content not found for PDF generation.");
      return;
    }

    try {
      const options = {
        margin: 10,
        filename: `prescription-${prescription?.prescriptionId || "unknown"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            const content = clonedDoc.getElementById("prescription-content");
            if (content) {
              content.style.backgroundColor = "#ffffff";
            }
            const styleTags = clonedDoc.getElementsByTagName("style");
            for (const tag of styleTags) {
              tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, "#333");
            }
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      html2pdf().from(element).set(options).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Error generating PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className={`flex justify-between gap-2 my-4 rounded-md p-2 pl-4 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h1 className="font-bold text-xl m-0 text-center flex items-center justify-center text-slate-800 ">
          Prescription - {patientInfo?.patientName}
        </h1>
        <div className="flex flex-row gap-2">
          <button
            onClick={handleShareWithPDF}
            disabled={sharing}
            className="bg-emerald-600 text-white px-4 py-2 font-bold rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            Share via Email
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 font-bold rounded-md hover:bg-blue-600"
          >
            Print
          </button>
          <button
            onClick={downloadPDF}
            className="bg-green-500 text-white font-bold px-4 py-2 rounded-md hover:bg-green-600"
          >
            Download PDF
          </button>
          <button
            onClick={() => setFormatOpen(false)}
            className="bg-gray-500 font-bold text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className={`p-4 mt-4 rounded-md shadow-md min-w-[900px] transition-colors ${theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-white border'}`}>
        <div id="prescription-content" className={`p-4 flex flex-col gap-4 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
          <div className="flex flex-row items-start justify-between gap-2 border-b-2 border-slate-200  pb-4 mb-4">
            <div>
              <h1 className="font-bold text-xl text-slate-900 ">Physician Clinic</h1>
              <p className="text-slate-600 ">
                Reg. No 12345, Physician Clinic, <br />
                Central Medical Complex, Main Road, <br />
                City, State - 123456.
              </p>
            </div>
            {/* Removed Logo */}
            <div className="text-right">
              <h1 className="font-bold text-xl text-slate-900 ">Dr. John Doe, M.D., </h1>
              <p className="text-slate-600 ">Chief Physician</p>
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <div>
              <label>
                <span className="font-bold">Patient Name:</span>{" "}
                {patientInfo?.patientName}
              </label>
              <br />
              <label>
                <span className="font-bold">PHN ID:</span>{" "}
                {patientInfo?.PHN_ID || prescription?.PHN_ID || "N/A"}
              </label>
              <br />
              <label>
                <span className="font-bold">Age/Gender:</span>{" "}
                {patientInfo?.patientAge}/{patientInfo?.patientGender}
              </label>
            </div>
            <div className="flex flex-col">
              <label>
                <span className="font-bold">Date:</span>{" "}
                {new Date().toLocaleDateString()}
              </label>
              <label>
                <span className="font-bold">Prescription ID:</span>{" "}
                {prescription.prescriptionId}
              </label>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg mt-4 mb-2">
              <img src={rsymb} className="w-10 h-10" />
            </h2>
            {!prescription || prescription.medicinesData?.length === 0 ? (
              <p className="text-slate-500 italic">No prescriptions found.</p>
            ) : (
              <table className="w-full border-collapse border border-slate-300 ">
                <thead>
                  <tr className="bg-slate-100  text-slate-900 ">
                    <th className="border border-slate-300  p-2">Sr. No.</th>
                    <th className="border border-slate-300  p-2">Medication</th>
                    <th className="border border-slate-300  p-2">Dosage</th>
                    <th className="border border-slate-300  p-2">Morning</th>
                    <th className="border border-slate-300  p-2">Afternoon</th>
                    <th className="border border-slate-300  p-2">Night</th>
                    <th className="border border-slate-300  p-2">AF/BF</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800 ">
                  {prescription?.medicinesData?.map((med, index) => (
                    <tr key={index} className="hover:bg-slate-50 :bg-slate-800/50 transition-colors">
                      <td className="border border-slate-300  p-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300  p-2 cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.medication}
                      </td>
                      <td className="border border-slate-300  p-2 text-center cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.dosage}
                      </td>
                      <td className="border border-slate-300  p-2 text-center cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.morning || "-"}
                      </td>
                      <td className="border border-slate-300  p-2 text-center cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.afternoon || "-"}
                      </td>
                      <td className="border border-slate-300  p-2 text-center cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.night || "-"}
                      </td>
                      <td className="border border-slate-300  p-2 text-center cursor-pointer hover:bg-slate-100 :bg-slate-700">
                        {med.af_bf || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex flex-col items-end mt-20 text-slate-900 ">
            <h1 className="font-bold text-xl">Dr. John Doe, M.D., </h1>
            <p className="text-slate-600 ">Chief Physician</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-content,
          #prescription-content * {
            visibility: visible;
          }
          #prescription-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .flex.justify-end {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PrescriptionFormatShow;
