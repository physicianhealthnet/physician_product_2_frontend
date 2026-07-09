import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { message } from "antd";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import BillFormat from "./BillFormat";
import html2pdf from "html2pdf.js";
import { useRef } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

function BillsEntery({ outerswaper }) {
  const billRef = useRef();
  const { patient_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const master = JSON.parse(sessionStorage.getItem("master"));
  const [swaper, setSwaper] = useState(false);
  const [formData, setFormData] = useState({});
  const [sittingData, setSittingData] = useState({ quantity: 1 });
  const [finalSittingData, setFinalSittingData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billSwaper, setBillSwaper] = useState(false);
  const [patientDetails, setPatientDetails] = useState({});
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [pendingLabs, setPendingLabs] = useState([]);
  const [pendingScans, setPendingScans] = useState([]);

  const [billOptionSwaper, setBillOptionSwaper] = useState(false);
  // Auto-calculate sitting total
  useEffect(() => {
    const price = Number(sittingData.price) || 0;
    const qty = Number(sittingData.quantity) || 1;
    setSittingData((prev) => ({
      ...prev,
      total: price * qty,
    }));
  }, [sittingData.price, sittingData.quantity]);

  // Auto-calculate total bill & balance amount
  useEffect(() => {
    const totalAmount = finalSittingData.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const discountPercent = Number(formData.discount) || 0;
    const discountAmount = (totalAmount * discountPercent) / 100;
    const balanceAmount = totalAmount - discountAmount;

    const paidAmount = Number(formData.paidAmount) || 0;

    // Remaining balance after payment
    const remainingBalance =
      paidAmount >= balanceAmount ? 0 : balanceAmount - paidAmount;

    setFormData((prev) => ({
      ...prev,
      totalAmount: totalAmount.toFixed(2),
      balanceAmount: remainingBalance.toFixed(2),
    }));
  }, [finalSittingData, formData.discount, formData.paidAmount]);

  const sittingInputChange = (e) => {
    const { name, value } = e.target;
    setSittingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSitting = (data) => {
    if (!data.name || !data.price) {
      message.warning("Please fill all fields before adding.");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...finalSittingData];
      updated[editingIndex] = data;
      setFinalSittingData(updated);
      setEditingIndex(null);
    } else {
      setFinalSittingData((prev) => [...prev, data]);
    }

    setSittingData({ quantity: 1 });
  };

  const handleEdit = (index) => {
    setSittingData(finalSittingData[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updated = finalSittingData.filter((_, i) => i !== index);
    setFinalSittingData(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setSittingData({ quantity: 1 });
    }
  };

  const handleGetBills = async () => {
    try {
      const response = await AxiosInstance.get(
        `/treatment-bill/get-patient/${patient_id}`,
      );

      setBills(response.data.data);
    } catch (error) {
      console.error("Error fetching bills:", error);
      message.error("Failed to fetch bills.");
    }
  };

  const handleGetPatientDetails = async () => {
    try {
      const response = await AxiosInstance.get(
        `/patient/get-by-id/${patient_id}`,
      );

      setPatientDetails(response.data.patient);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingPrescriptions = async () => {
    try {
      const response = await AxiosInstance.get(
        `/prescription/patient/${patient_id}`,
      );
      let prescriptions = response.data?.data || [];
      prescriptions = prescriptions.filter((rx) => !rx.isBilled);
      setPendingPrescriptions(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  const fetchPendingLabs = async () => {
    try {
      const response = await AxiosInstance.get(
        `/lab-prescription/by-patient/${patient_id}`,
      );
      let labs = response.data?.data || [];
      labs = labs.filter((lab) => !lab.isBilled);
      setPendingLabs(labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
    }
  };

  const fetchPendingScans = async () => {
    try {
      const response = await AxiosInstance.get(
        `/scan-prescription/by-patient/${patient_id}`,
      );
      let scans = response.data?.data || [];
      scans = scans.filter((scan) => !scan.isBilled);
      setPendingScans(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
    }
  };

  const calculateQuantity = (med) => {
    const morning = parseFloat(med.morning) || 0;
    const afternoon = parseFloat(med.afternoon) || 0;
    const night = parseFloat(med.night) || 0;
    const days = parseFloat(med.days) || 0;
    const total = (morning + afternoon + night) * days;
    return isNaN(total) ? 1 : total || 1;
  };

  const handleImportSpecificPrescription = (rx) => {
    let newItems = [];
    if (rx.medicinesData && Array.isArray(rx.medicinesData)) {
      rx.medicinesData.forEach((med) => {
        if (med.status !== "given") {
          const isNotAvailable = med.status === "not available";
          const qty = isNotAvailable ? 0 : calculateQuantity(med);
          newItems.push({
            category: "Pharmacy",
            name: med.medicationName || med.medication,
            price: 0,
            quantity: qty,
            total: 0,
            notes: isNotAvailable
              ? "Not available"
              : `${med.dosage} (${med.days} days)`,
            prescriptionId: rx._id,
          });
        }
      });
    }

    if (newItems.length > 0) {
      setFinalSittingData((prev) => [...prev, ...newItems]);
      message.success(
        `Imported ${newItems.length} pending medicines from prescription.`,
      );
      setPendingPrescriptions((prev) => prev.filter((p) => p._id !== rx._id));
    } else {
      message.info(
        "No pending medicines found to import in this prescription.",
      );
    }
  };

  const handleImportSpecificLab = (lab) => {
    const newItem = {
      category: "Lab",
      name: lab.labType,
      price: 0,
      quantity: 1,
      total: 0,
      notes: "Lab Request",
      labPrescriptionId: lab._id,
    };

    setFinalSittingData((prev) => [...prev, newItem]);
    message.success("Imported Lab Request.");
    setPendingLabs((prev) => prev.filter((l) => l._id !== lab._id));
  };

  const handleImportSpecificScan = (scan) => {
    const newItem = {
      category: "Scan",
      name: scan.scanType,
      price: 0,
      quantity: 1,
      total: 0,
      notes: "Scan Request",
      scanPrescriptionId: scan._id,
    };

    setFinalSittingData((prev) => [...prev, newItem]);
    message.success("Imported Scan Request.");
    setPendingScans((prev) => prev.filter((s) => s._id !== scan._id));
  };

  useEffect(() => {
    handleGetBills();
    handleGetPatientDetails();
    fetchPendingPrescriptions();
    fetchPendingLabs();
    fetchPendingScans();
  }, [patient_id]);

  const handleSubmmit = async () => {
    try {
      setSharing(true);

      // 1. Generate PDF for WhatsApp
      const element = billRef.current;
      const options = {
        margin: 0,
        with: 850,
        filename: `invoice.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
      };

      let pdfBase64 = null;
      try {
        const pdfDataUri = await html2pdf()
          .from(element)
          .set(options)
          .output("datauristring");
        pdfBase64 = pdfDataUri.split(",")[1];
      } catch (pdfErr) {
        console.error("Error generating PDF for submission:", pdfErr);
      }

      const payload = {
        ...formData,
        clinicId: user?.clinicId,
        patientId: patient_id,
        patientPHNId: patientDetails?.PHN_ID,
        patientName: patientDetails?.patientName,
        patientPhone: patientDetails?.patientPhone,
        treatments: finalSittingData,
        pdfBase64: pdfBase64, // Added for WhatsApp notification
      };

      const response = await AxiosInstance.post("/treatment-bill/add", payload);
      message.success("Bill submitted successfully!");
      setFormData({});
      setFinalSittingData([]);
      handleGetBills(); // Refresh list
    } catch (error) {
      console.error(error);
      message.error("Failed to submit bill.");
    } finally {
      setSharing(false);
    }
  };

  const handleUpdate = async () => {
    const payload = {
      ...formData,
      treatments: finalSittingData,
    };

    try {
      const response = await AxiosInstance.patch(
        `/treatment-bill/update/${selectedBill?._id}`,
        payload,
      );
      message.success("Treatment Bill Updated Successfully");
      handleGetBills();
      setSwaper(false);
    } catch (error) {
      message.error("Treatment Bill fail to Update");
      console.error(error);
    }
  };

  const [sharing, setSharing] = useState(false);
  const handleShareBill = async (billId, pdfAttachment = null) => {
    try {
      setSharing(true);
      const response = await AxiosInstance.post("/share/bill", {
        billId: billId,
        pdfAttachment: pdfAttachment,
      });
      message.success(response.data.message || "Invoice shared successfully!");
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to share invoice via email",
      );
    } finally {
      setSharing(false);
    }
  };
  const unifiedPendingItems = [
    ...pendingPrescriptions
      .map((rx) => {
        const count =
          rx.medicinesData?.filter((m) => m.status !== "given").length || 0;
        return {
          id: rx._id,
          type: "Pharmacy",
          details: `${count} pending medicines`,
          date: new Date(rx.createdAt).toLocaleDateString("en-IN"),
          time: new Date(rx.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          rawDate: new Date(rx.createdAt),
          action: () => handleImportSpecificPrescription(rx),
          count,
        };
      })
      .filter((item) => item.count > 0),
    ...pendingLabs.map((lab) => ({
      id: lab._id,
      type: "Lab",
      details: lab.labType,
      date: new Date(lab.createdAt).toLocaleDateString("en-IN"),
      time: new Date(lab.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawDate: new Date(lab.createdAt),
      action: () => handleImportSpecificLab(lab),
    })),
    ...pendingScans.map((scan) => ({
      id: scan._id,
      type: "Scan",
      details: scan.scanType,
      date: new Date(scan.createdAt).toLocaleDateString("en-IN"),
      time: new Date(scan.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawDate: new Date(scan.createdAt),
      action: () => handleImportSpecificScan(scan),
    })),
  ].sort((a, b) => b.rawDate - a.rawDate);

  return (
    <div className="flex flex-col gap-4 relative h-full p-2">
      {!outerswaper && (
        <Button
          variant="secondary"
          className="flex flex-row w-fit items-center gap-2"
          onClick={() => setSwaper((p) => !p)}
        >
          <Icon
            icon="material-symbols:add-circle-outline-rounded"
            className={`${
              swaper ? "rotate-45" : "rotate-0"
            } transition-transform duration-300 ease-in-out`}
            width="24"
            height="24"
          />
          <span className="font-bold">
            {swaper ? "Show Bills" : "Add Bill"}
          </span>
        </Button>
      )}

      <div className="w-full flex items-center justify-center">
        {!swaper ? (
          <div className="w-full">
            {bills.length > 0 ? (
              <div className="flex flex-wrap flex-row gap-4">
                {bills.map((bill, index) => (
                  <div
                    key={index}
                    className="p-4 border border-slate-200  rounded-xl shadow-sm hover:shadow-md bg-white  cursor-pointer transition-all w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] group"
                    onClick={() => {
                      setSelectedBill(bill);
                      setBillSwaper(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-800 ">
                        Bill ID:{" "}
                        <span className="text-primary-600 ">
                          {bill.treatmentBillId}
                        </span>
                      </h3>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedBill(bill);
                          // Wait for state to update and billRef to be populated
                          setTimeout(async () => {
                            const element = billRef.current;
                            const options = {
                              margin: 0,
                              with: 850,
                              filename: `${bill.treatmentBillId || "invoice"}.pdf`,
                              image: { type: "jpeg", quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: {
                                unit: "in",
                                format: "a4",
                                orientation: "landscape",
                              },
                            };
                            try {
                              setSharing(true);
                              const pdfBase64 = await html2pdf()
                                .from(element)
                                .set(options)
                                .output("datauristring");
                              const base64Data = pdfBase64.split(",")[1];
                              await handleShareBill(bill._id, base64Data);
                            } catch (error) {
                              console.error(
                                "Error generating/sharing PDF:",
                                error,
                              );
                              message.error(
                                "Failed to generate PDF for sharing",
                              );
                            } finally {
                              setSharing(false);
                            }
                          }, 100);
                        }}
                        disabled={sharing}
                        className="p-2 rounded-lg bg-emerald-50  text-emerald-600  hover:bg-emerald-100 :bg-emerald-500/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Share via Email"
                      >
                        <Icon
                          icon="material-symbols:share-outline"
                          width="18"
                          height="18"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 text-slate-600 ">
                      <p className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium text-slate-800 ">
                          {new Date(bill.invoiceDate).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-bold text-green-600 ">
                          ₹{bill.totalAmount}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 ">
                <Icon
                  icon="material-symbols:receipt-long-outline"
                  width={48}
                  className="mb-2 opacity-50"
                />
                <p>No bills found for this patient.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full lg:w-3/4">


            {/* Sitting Form */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
              <div className="flex flex-col justify-between items-start md:items-center mb-4 gap-4">
                <h3 className="font-bold text-lg text-slate-800">
                  Items / Treatments
                </h3>
                {unifiedPendingItems.length > 0 && (
                  <div className="w-full mt-2 mb-4 overflow-auto h-64 rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="uppercase tracking-wider border-b sticky top-0 border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs">
                        <tr>
                          <th className="px-4 py-3 text-center w-24">Type</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3 text-center">Date</th>
                          <th className="px-4 py-3 text-center">Time</th>
                          <th className="px-4 py-3 text-center w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {unifiedPendingItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                  item.type === "Pharmacy"
                                    ? "bg-blue-50 text-blue-700"
                                    : item.type === "Lab"
                                      ? "bg-orange-50 text-orange-700"
                                      : "bg-purple-50 text-purple-700"
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-800">
                              {item.details}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.date}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.time}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                onClick={item.action}
                                variant="secondary"
                                className={`!py-1 !px-3 text-xs flex items-center gap-1 mx-auto ${
                                  item.type === "Pharmacy"
                                    ? "border-blue-200 text-blue-600 hover:bg-blue-100"
                                    : item.type === "Lab"
                                      ? "border-orange-200 text-orange-600 hover:bg-orange-100"
                                      : "border-purple-200 text-purple-600 hover:bg-purple-100"
                                }`}
                              >
                                <Icon icon="lucide:download" width="14" />
                                Import
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row flex-wrap items-end gap-4 mb-6">
                <div className="w-full md:w-auto flex-[1]">
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={sittingData.category || ""}
                    onChange={sittingInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Lab">Lab</option>
                    <option value="Scan">Scan</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>
                {[
                  {
                    label: "Item Name",
                    name: "name",
                    value: sittingData.name,
                    width: "flex-[2]",
                  },
                  {
                    label: "Price",
                    name: "price",
                    value: sittingData.price,
                    type: "number",
                    width: "flex-[0.5]",
                  },
                  {
                    label: "Qty",
                    name: "quantity",
                    value: sittingData.quantity,
                    type: "number",
                    width: "flex-[0.5]",
                  },
                  {
                    label: "Total",
                    name: "total",
                    value: sittingData.total,
                    type: "number",
                    disable: true,
                    width: "flex-[0.5]",
                  },
                  {
                    label: "Notes",
                    name: "notes",
                    value: sittingData.notes,
                    width: "flex-[1.5]",
                  },
                ].map((data, index) => (
                  <div
                    key={index}
                    className={`w-full md:w-auto ${data.width || ""}`}
                  >
                    <Input
                      label={data.label}
                      type={data.type || "text"}
                      onChange={sittingInputChange}
                      name={data.name}
                      value={data.value || ""}
                      disabled={data.disable || false}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => addSitting(sittingData)}
                  className="w-full md:w-auto h-[42px] mb-[1px]" // Align with input height
                >
                  {editingIndex !== null ? "Update Item" : "Add Item"}
                </Button>
              </div>

              {/* Sitting Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-center">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold text-sm uppercase tracking-wider">
                      <th className="p-3 border-b">Category</th>
                      <th className="p-3 border-b">Name</th>
                      <th className="p-3 border-b">Price</th>
                      <th className="p-3 border-b">Qty</th>
                      <th className="p-3 border-b">Total</th>
                      <th className="p-3 border-b">Notes</th>
                      <th className="p-3 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {finalSittingData.map((data, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3 text-slate-800">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {data.category || "Treatment"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-800">{data.name}</td>
                        <td className="p-3 text-slate-800">{data.price}</td>
                        <td className="p-3 text-slate-800">
                          {data.quantity || 1}
                        </td>
                        <td className="p-3 text-slate-800 font-medium">
                          {data.total}
                        </td>
                        <td className="p-3 text-slate-600 text-sm max-w-[200px] truncate">
                          {data.notes}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 items-center justify-center">
                            <button
                              onClick={() => handleEdit(index)}
                              className="p-1.5 rounded-full hover:bg-yellow-100 :bg-yellow-900/30 text-yellow-600  transition-colors"
                              title="Edit"
                            >
                              <Icon
                                icon="ic:baseline-edit"
                                width="20"
                                height="20"
                              />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="p-1.5 rounded-full hover:bg-red-100 :bg-red-900/30 text-red-600  transition-colors"
                              title="Delete"
                            >
                              <Icon
                                icon="ic:baseline-delete"
                                width="20"
                                height="20"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {finalSittingData.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-8 text-slate-500  italic"
                        >
                          No treatments added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
                        {/* Main Bill Form */}
            <div className="bg-slate-50  p-6 shadow-sm border border-slate-200  rounded-xl flex flex-col gap-4">
              <h3 className="font-bold text-lg text-slate-800  mb-2">
                Bill Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Invoice Date",
                    name: "invoiceDate",
                    value: formData.invoiceDate,
                    type: "date",
                  },
                  {
                    label: "Mode of Payment",
                    name: "modeOfPayment",
                    value: formData.modeOfPayment,
                    list: ["Cash", "Card", "UPI"],
                  },
                  {
                    label: "Total Amount",
                    name: "totalAmount",
                    value: formData.totalAmount,
                    type: "number",
                    disable: true,
                  },
                  {
                    label: "Discount (%)",
                    name: "discount",
                    value: formData.discount,
                    type: "number",
                  },
                  {
                    label: "Paid Amount",
                    name: "paidAmount",
                    value: formData.paidAmount,
                    type: "number",
                  },
                  {
                    label: "Balance Amount",
                    name: "balanceAmount",
                    value: formData.balanceAmount,
                    type: "number",
                    disable: true,
                  },
                ].map((data, index) => (
                  <div key={index} className="flex flex-col">
                    {data.list ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 ">
                          {data.label}
                        </label>
                        <select
                          name={data.name}
                          value={data.value || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg text-sm shadow-sm placeholder-slate-400
                        focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                        disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                        invalid:border-pink-500 invalid:text-pink-600
                        focus:invalid:border-pink-500 focus:invalid:ring-pink-500 "
                        >
                          <option value="select">Select Payment Mode</option>
                          {data.list.map((option, idx) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <Input
                        label={data.label}
                        type={data.type || "text"}
                        name={data.name}
                        value={data.value || ""}
                        onChange={handleInputChange}
                        disabled={data.disable || false}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={selectedBill?._id ? handleUpdate : handleSubmmit}
                variant="primary"
                className="px-8"
              >
                {selectedBill?._id ? "Update Bill" : "Submit Bill"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Hidden BillFormat for PDF Generation (used for both creation and sharing) */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px" }}>
        <BillFormat
          ref={billRef}
          selectedBill={
            swaper
              ? {
                  ...formData,
                  patientId: patient_id,
                  patientName: patientDetails?.patientName,
                  treatments: finalSittingData,
                  treatmentBillId: "NEW INVOICE",
                  invoiceDate: formData.invoiceDate || new Date().toISOString(),
                  totalAmount: formData.totalAmount,
                  paidAmount: formData.paidAmount,
                  balanceAmount: formData.balanceAmount,
                  discount: formData.discount || 0,
                  modeOfPayment: formData.modeOfPayment,
                }
              : selectedBill
          }
        />
      </div>

      {billSwaper && (
        <div className="w-screen h-screen fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-h-[95vh] max-w-[900px] flex flex-col bg-white  rounded-xl shadow-2xl overflow-hidden">
            <div className="flex flex-row items-center justify-between p-4 border-b border-slate-200  bg-slate-50 ">
              <h1 className="text-xl m-0 font-bold text-slate-800 ">
                Bill Preview
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    const element = billRef.current;
                    const options = {
                      margin: 0,
                      with: 850,
                      filename: `${selectedBill?.treatmentBillId || "invoice"}.pdf`,
                      image: { type: "jpeg", quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: {
                        unit: "in",
                        format: "a4",
                        orientation: "landscape",
                      },
                    };
                    try {
                      setSharing(true);
                      const pdfBase64 = await html2pdf()
                        .from(element)
                        .set(options)
                        .output("datauristring");
                      // Remove the data URL prefix to get only base64 data
                      const base64Data = pdfBase64.split(",")[1];
                      await handleShareBill(selectedBill?._id, base64Data);
                    } catch (error) {
                      console.error("Error generating/sharing PDF:", error);
                      message.error("Failed to generate PDF for sharing");
                    } finally {
                      setSharing(false);
                    }
                  }}
                  loading={sharing}
                  disabled={sharing}
                  className="!p-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 :bg-emerald-500/10"
                  title="Share via Email"
                >
                  <Icon
                    icon="material-symbols-light:share-outline"
                    width="20"
                    height="20"
                  />
                </Button>
                {billOptionSwaper && (
                  <>
                    <Button
                      onClick={() => {
                        const element = billRef.current;
                        const options = {
                          margin: 0,
                          with: 850,
                          filename: `${
                            selectedBill?.treatmentBillId || "invoice"
                          }.pdf`,
                          image: { type: "jpeg", quality: 0.98 },
                          html2canvas: { scale: 2 },
                          jsPDF: {
                            unit: "in",
                            format: "a4",
                            orientation: "landscape",
                          },
                        };
                        html2pdf().from(element).set(options).save();
                      }}
                      className="!p-2"
                      title="Download PDF"
                    >
                      <Icon
                        icon="material-symbols-light:download-rounded"
                        width="20"
                        height="20"
                      />
                    </Button>
                    <button
                      className={`p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors ${
                        outerswaper ? "hidden" : null
                      }`}
                      onClick={() => {
                        setFormData(selectedBill);
                        setFinalSittingData(selectedBill.treatments);
                        setBillSwaper(false);
                        setSwaper(true);
                      }}
                      title="Edit Bill"
                    >
                      <Icon
                        icon="material-symbols-light:edit-outline"
                        width="20"
                        height="20"
                      />
                    </button>
                    {master?.userType === "master" && (
                      <button
                        className={`p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors ${
                          outerswaper ? "hidden" : null
                        }`}
                        onClick={() => setBillSwaper(false)}
                        title="Delete Bill"
                      >
                        <Icon
                          icon="material-symbols-light:delete-outline-rounded"
                          width="24"
                          height="20"
                        />
                      </button>
                    )}
                  </>
                )}
                <button
                  className={`p-2 rounded-lg border border-slate-300  hover:bg-slate-100 :bg-slate-700 text-slate-600  transition-colors ${billOptionSwaper ? "bg-slate-100 " : ""}`}
                  onClick={() => setBillOptionSwaper(!billOptionSwaper)}
                  title="More Options"
                >
                  <Icon
                    icon="material-symbols-light:more-horiz"
                    width="20"
                    height="20"
                  />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-slate-100 :bg-slate-700 text-slate-500  transition-colors"
                  onClick={() => setBillSwaper(false)}
                  title="Close"
                >
                  <Icon
                    icon="material-symbols-light:close-rounded"
                    width="24"
                    height="24"
                  />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100  flex justify-center">
              <div className="bg-white shadow-lg">
                <BillFormat ref={billRef} selectedBill={selectedBill} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillsEntery;
