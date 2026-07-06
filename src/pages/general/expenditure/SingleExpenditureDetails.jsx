import React from "react";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import { Icon } from "@iconify/react/dist/iconify.js";

function SingleExpenditureDetails({ targetedData, onBack }) {
  if (!targetedData) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <Icon icon="tabler:arrow-left" />
          Back to List
        </Button>
        <h2 className="text-2xl font-bold text-slate-800 ">
          Invoice #{targetedData.billInvoiceNo}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: General Info & Supplier */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Bill Information" className="h-fit">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No</label>
                <p className="text-slate-800  font-medium">{targetedData.billInvoiceNo || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill Date</label>
                <p className="text-slate-800  font-medium">
                  {targetedData.billDate ? new Date(targetedData.billDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              {targetedData.billFile && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Attachment</label>
                  <a
                    href={typeof targetedData.billFile === 'string' ? targetedData.billFile : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600  hover:underline bg-blue-50  px-3 py-2 rounded-lg text-sm font-medium w-full justify-center transition-colors"
                  >
                    <Icon icon="tabler:file-invoice" />
                    View Bill File
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card title="Supplier Details" className="h-fit">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 ">
                <div className="w-10 h-10 rounded-full bg-emerald-100  flex items-center justify-center text-emerald-600  font-bold text-lg">
                  {targetedData.supplier?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="font-bold text-slate-800 ">{targetedData.supplier?.name}</p>
                  <p className="text-xs text-slate-500 ">Supplier ID: {targetedData.supplier?.id || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:map-pin" className="text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Address</label>
                    <p className="text-sm text-slate-700 ">{targetedData.supplier?.address || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:phone" className="text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Contact</label>
                    <p className="text-sm text-slate-700 ">{targetedData.supplier?.contact || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:mail" className="text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email</label>
                    <p className="text-sm text-slate-700 ">{targetedData.supplier?.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:receipt-tax" className="text-slate-400 mt-0.5" />
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GSTIN</label>
                    <p className="text-sm text-slate-700 ">{targetedData.supplier?.gstin || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Products & Financials */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Products Purchased">
            <div className="overflow-x-auto rounded-lg border border-slate-200 ">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50  border-b border-slate-200 ">
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Product</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-center">Type</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Price</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {targetedData.products?.map((p, index) => (
                    <tr key={index} className="text-sm">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800 ">{p.productName}</p>
                        <p className="text-xs text-slate-500">
                          {p.brand} {p.model ? `- ${p.model}` : ""}
                        </p>
                        {p.expiryDate && <p className="text-[10px] text-red-500">Exp: {new Date(p.expiryDate).toLocaleDateString()}</p>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase
                                            ${p.type === 'equipment' ? 'bg-purple-100 text-purple-700  ' : 'bg-blue-100 text-blue-700  '}
                                        `}>
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-700 ">{p.quantity}</td>
                      <td className="p-3 text-right text-slate-700 ">₹{Number(p.amount).toFixed(2)}</td>
                      <td className="p-3 text-right font-medium text-slate-800 ">₹{(Number(p.amount) * Number(p.quantity)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card title="Financial Summary">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-slate-600 ">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{targetedData.financials?.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 ">
                  <span>Discount {targetedData.financials?.discount?.percentage > 0 && `(${targetedData.financials?.discount?.percentage}%)`}</span>
                  <span className="font-medium">-₹{targetedData.financials?.discount?.amount?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 ">
                  <span>GST {targetedData.financials?.gst?.percentage > 0 && `(${targetedData.financials?.gst?.percentage}%)`}</span>
                  <span className="font-medium">+₹{targetedData.financials?.gst?.amount?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="border-t border-slate-200  pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800 ">Total Amount</span>
                  <span className="text-xl font-black text-blue-600 ">₹{targetedData.financials?.totalAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </Card>

            {/* Payment Info */}
            <Card title="Payment Details">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 ">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                              ${targetedData.payment?.status === 'completed' ? 'bg-emerald-100 text-emerald-800  ' :
                      targetedData.payment?.status === 'pending' ? 'bg-amber-100 text-amber-800  ' :
                        'bg-red-100 text-red-800  '
                    }
                            `}>
                    {targetedData.payment?.status || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 ">Mode</span>
                  <span className="font-medium capitalize text-slate-800 ">{targetedData.payment?.mode || "N/A"}</span>
                </div>
                {targetedData.payment?.transactionId && (
                  <div className="bg-slate-50  p-2 rounded text-xs text-slate-500  font-mono break-all">
                    TxID: {targetedData.payment?.transactionId}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-50  p-2 rounded-lg text-center">
                    <p className="text-xs text-emerald-600  font-bold uppercase">Paid</p>
                    <p className="font-bold text-emerald-700 ">₹{targetedData.payment?.paidAmount?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="bg-rose-50  p-2 rounded-lg text-center">
                    <p className="text-xs text-rose-600  font-bold uppercase">Due</p>
                    <p className="font-bold text-rose-700 ">₹{targetedData.payment?.dueAmount?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleExpenditureDetails;
