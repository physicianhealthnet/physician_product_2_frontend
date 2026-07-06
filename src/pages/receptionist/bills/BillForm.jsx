import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react/dist/iconify.js";
import { message } from "antd";

function BillForm({ selectedBill, setSelectedBill, refreshBills }) {
  const [formData, setFormData] = useState({
    invoiceDate: "",
    modeOfPayment: "",
    totalAmount: 0,
    discount: 0,
    paidAmount: 0,
    balanceAmount: 0,
  });

  const [sittingData, setSittingData] = useState({
    name: "",
    price: 0,
    quantity: 1,
    total: 0,
    notes: "",
  });
  const [finalSittingData, setFinalSittingData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (selectedBill) {
      setFormData({
        invoiceDate: selectedBill.invoiceDate?.split("T")[0] || "",
        modeOfPayment: selectedBill.modeOfPayment || "",
        totalAmount: Number(selectedBill.totalAmount) || 0,
        discount: Number(selectedBill.discount) || 0,
        paidAmount: Number(selectedBill.paidAmount) || 0,
        balanceAmount: Number(selectedBill.balanceAmount) || 0,
      });
      setFinalSittingData(selectedBill.treatments || []); // ✅ FIXED
    }
  }, [selectedBill]);

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...formData, [name]: value };

    // Auto calc balance
    if (name === "paidAmount" || name === "discount") {
      const discountedAmount =
        updatedForm.totalAmount -
        (updatedForm.totalAmount * updatedForm.discount) / 100;
      updatedForm.balanceAmount = discountedAmount - updatedForm.paidAmount;
    }
    setFormData(updatedForm);
  };

  // Sitting input change
  const sittingInputChange = (e) => {
    const { name, value } = e.target;
    setSittingData((prev) => ({
      ...prev,
      [name]: value,
      total:
        name === "price" || name === "quantity"
          ? (name === "price" ? value : prev.price) *
            (name === "quantity" ? value : prev.quantity)
          : prev.total,
    }));
  };

  // Add / Update Sitting
  const addSitting = () => {
    if (editingIndex !== null) {
      const updated = [...finalSittingData];
      updated[editingIndex] = sittingData;
      setFinalSittingData(updated);
      setEditingIndex(null);
    } else {
      setFinalSittingData([...finalSittingData, sittingData]);
    }
    setSittingData({ name: "", price: 0, quantity: 1, total: 0, notes: "" });
  };

  const handleEdit = (index) => {
    setSittingData(finalSittingData[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setFinalSittingData(finalSittingData.filter((_, i) => i !== index));
  };

  // Update Bill API
  const handleUpdate = async () => {
    try {
      await AxiosInstance.patch(`/treatment-bill/update/${selectedBill._id}`, {
        ...formData,
        treatments: finalSittingData, // ✅ FIXED
      });
      message.success("Bill Updated Successfully");
      refreshBills();
      setSelectedBill(null);
    } catch (error) {
      message.error("Bill fail to Update");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white p-6 mt-4 rounded-2xl shadow-xl border border-gray-200">
      {/* Main Bill Information */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Bill Summary</h3>
          <p className="text-sm text-gray-500">Update invoice and payment</p>
        </div>
        
        <div className="flex flex-col gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
          {[
            { label: "Invoice Date", name: "invoiceDate", type: "date" },
            {
              label: "Mode of Payment",
              name: "modeOfPayment",
              list: ["Cash", "Card", "UPI"],
            },
            {
              label: "Total Amount",
              name: "totalAmount",
              type: "number",
              disable: true,
            },
            { label: "Discount (%)", name: "discount", type: "number" },
            { label: "Paid Amount", name: "paidAmount", type: "number" },
            {
              label: "Balance Amount",
              name: "balanceAmount",
              type: "number",
              disable: true,
            },
          ].map((data, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{data.label}</label>
              {data.list ? (
                <select
                  name={data.name}
                  value={formData[data.name] || ""}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="">Select</option>
                  {data.list.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={`border border-gray-300 rounded-lg p-2.5 text-sm outline-none transition-all ${
                    data.disable ? "bg-gray-100 text-gray-600 font-medium cursor-not-allowed" : "bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  type={data.type || "text"}
                  name={data.name}
                  value={formData[data.name] || ""}
                  onChange={handleInputChange}
                  disabled={data.disable || false}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Treatments and Items */}
      <div className="flex-1 flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Treatments & Products</h3>
          <p className="text-sm text-gray-500">Manage items for this bill</p>
        </div>

        {/* Add Items Form */}
        <div className="flex flex-col md:flex-row md:items-end gap-3 bg-blue-50/40 border border-blue-100 rounded-xl p-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Treatment/Product Name</label>
            <input
              type="text"
              onChange={sittingInputChange}
              name="name"
              value={sittingData.name || ""}
              placeholder="Enter name"
              className="p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <div className="w-full md:w-28 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Price (₹)</label>
            <input
              type="number"
              onChange={sittingInputChange}
              name="price"
              value={sittingData.price || ""}
              className="p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <div className="w-full md:w-20 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Qty</label>
            <input
              type="number"
              onChange={sittingInputChange}
              name="quantity"
              value={sittingData.quantity || ""}
              className="p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <div className="w-full md:w-28 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Total (₹)</label>
            <input
              type="number"
              disabled
              value={sittingData.total || ""}
              className="p-2.5 text-sm border border-gray-300 rounded-lg bg-gray-100/70 text-gray-700 font-medium outline-none cursor-not-allowed"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <input
              type="text"
              onChange={sittingInputChange}
              name="notes"
              value={sittingData.notes || ""}
              placeholder="Optional notes"
              className="p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <button
            onClick={addSitting}
            className="bg-blue-600 hover:bg-blue-700 transition duration-200 h-[42px] px-6 text-white text-sm font-semibold rounded-lg shadow whitespace-nowrap"
          >
            {editingIndex !== null ? "Update Item" : "Add Item"}
          </button>
        </div>

        {/* Sitting Table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white mt-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Treatment / Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {finalSittingData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">₹{item.price}</td>
                  <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">₹{item.total}</td>
                  <td className="px-4 py-3 text-gray-500 italic text-xs">{item.notes || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center items-center">
                      <button 
                        onClick={() => handleEdit(index)}
                        className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-md transition-colors border border-yellow-200"
                        title="Edit"
                      >
                        <Icon icon="ic:baseline-edit" width="18" height="18" />
                      </button>
                      <button 
                        onClick={() => handleDelete(index)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                        title="Delete"
                      >
                        <Icon icon="ic:baseline-delete" width="18" height="18" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {finalSittingData.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400 bg-gray-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="mdi:basket-plus-outline" className="text-4xl text-gray-300" />
                      <p>No treatments or products added yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 mt-auto pt-5 border-t border-gray-100">
          <button
            onClick={handleUpdate}
            className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 transition duration-200 text-white font-semibold px-8 py-2.5 rounded-lg shadow-md"
          >
            Update Bill
          </button>
          <button
            onClick={() => setSelectedBill(null)}
            className="flex-1 md:flex-none justify-center bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition duration-200 text-gray-700 font-medium px-8 py-2.5 rounded-lg shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillForm;
