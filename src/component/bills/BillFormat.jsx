import React, { forwardRef } from "react";

const BillFormat = forwardRef(({ selectedBill }, ref) => {
  if (!selectedBill) return null;

  return (
    <div
      ref={ref}
      className="p-6 my-4 min-w-[874px] min-h-[1240px] mx-auto shadow rounded-md bg-white"
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Physician Clinic</h1>
          <p>
            Reg. No 12345, Physician Clinic, <br />
            Central Medical Complex, Main Road, <br />
            City, State - 123456.
          </p>
        </div>
        {/* Removed Logo */}
        <div className="text-right">
          <p className="text-sm">Invoice No:</p>
          <p className="font-semibold">{selectedBill.treatmentBillId}</p>
          <p className="text-sm">Date:</p>
          <p className="font-semibold">
            {selectedBill.invoiceDate 
              ? new Date(selectedBill.invoiceDate).toLocaleDateString("en-IN") 
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-4">
        <p>
          <span className="font-bold">Patient ID:</span>{" "}
          {selectedBill.patientId}
        </p>
      </div>

      {/* Treatments Table */}
      <table className="w-full border border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Treatment</th>
            <th className="border p-2 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {selectedBill?.treatments?.map((t, index) => (
            <tr key={index}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{t.name}</td>
              <td className="border p-2 text-right">
                {Number(t.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end">
        <table className="border">
          <tbody>
            <tr>
              <td className="p-2 border font-semibold">Total Amount</td>
              <td className="p-2 border text-right">
                {Number(selectedBill.totalAmount).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border font-semibold">Discount (%)</td>
              <td className="p-2 border text-right">
                {selectedBill.discount}%
              </td>
            </tr>
            <tr>
              <td className="p-2 border font-semibold">Paid Amount</td>
              <td className="p-2 border text-right">
                {Number(selectedBill.paidAmount).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border font-semibold">Balance Amount</td>
              <td className="p-2 border text-right">
                {Number(selectedBill.balanceAmount).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Info */}
      <div className="mt-6">
        <p>
          <span className="font-bold">Mode of Payment:</span>{" "}
          {selectedBill.modeOfPayment}
        </p>
      </div>
    </div>
  );
});

export default BillFormat;
