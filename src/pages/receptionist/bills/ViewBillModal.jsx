import React from "react";
import { Modal } from "antd";
import { Icon } from "@iconify/react/dist/iconify.js";

const ViewBillModal = ({ isOpen, onClose, bill }) => {
  if (!bill) return null;

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page { margin: 0.5cm; }
        body { margin: 0; background: white; }
        body * {
          visibility: hidden;
        }
        #printable-bill, #printable-bill * {
          visibility: visible;
        }
        #printable-bill {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 20px !important;
          background-color: white !important;
          z-index: 99999 !important;
          transform: none !important;
          overflow: visible !important;
        }
        .ant-modal, .ant-modal-wrap, .ant-modal-content {
          transform: none !important;
          top: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
        .ant-modal-mask {
          display: none !important;
        }
        .no-print, .no-print * {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      title={null}
      centered
      className="view-bill-modal"
    >
      <div id="printable-bill" className="p-2 sm:p-4 bg-white">
        {/* Header */}
        <div className="bg-blue-50/50 -mx-6 -mt-6 p-6 rounded-t-lg border-b border-blue-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bill Details</h2>
            <p className="text-sm text-gray-500">
              Bill ID: <span className="font-mono">#{bill._id?.slice(-8).toUpperCase()}</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                bill.balanceAmount > 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}
            >
              {bill.balanceAmount > 0 ? "Pending" : "Fully Paid"}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Patient Name</p>
            <p className="font-semibold text-gray-800">{bill.patientName || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="font-semibold text-gray-800">{bill.patientPhone || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
            <p className="font-semibold text-gray-800">
              {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Mode</p>
            <p className="font-semibold text-gray-800">{bill.modeOfPayment || "N/A"}</p>
          </div>
        </div>

        {/* Treatments Table */}
        <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Treatment / Product</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-center">Qty</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.treatments && bill.treatments.length > 0 ? (
                bill.treatments.map((t, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {t.name}
                      {t.notes && <p className="text-xs text-gray-400 font-normal mt-0.5 italic">{t.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-right">₹{t.price}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{t.quantity}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium text-right">₹{t.total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400 bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="mdi:receipt-text-remove-outline" className="text-3xl text-gray-300" />
                      <p>No treatments or products added to this bill.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mt-6">
          <div className="w-full md:w-64 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-800">₹{bill.totalAmount || 0}</span>
            </div>
            
            {(bill.discount > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Discount ({bill.discount}%)</span>
                <span className="font-semibold text-red-500">
                  - ₹{((bill.totalAmount * bill.discount) / 100).toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="h-px bg-gray-200 my-3"></div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Paid Amount</span>
              <span className="font-semibold text-green-600">₹{bill.paidAmount || 0}</span>
            </div>
            
            <div className="flex justify-between text-base font-bold bg-gray-50 p-3 rounded-lg border border-gray-200 mt-3 shadow-sm">
              <span className="text-gray-800">Balance Due</span>
              <span className={bill.balanceAmount > 0 ? "text-red-500" : "text-green-600"}>
                ₹{bill.balanceAmount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 no-print">
          <button 
            onClick={onClose} 
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
          >
            Close
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Icon icon="mdi:printer" className="text-lg" /> Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewBillModal;
