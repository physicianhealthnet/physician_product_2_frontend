import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { message } from "antd";
import { Icon } from "@iconify/react/dist/iconify.js";
import Card from "../../../component/ui/Card";
import Input from "../../../component/ui/Input";
import Button from "../../../component/ui/Button";

// Helper to update nested state by dot/array notation
function setDeepValue(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let temp = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = temp;
  keys.forEach((key, idx) => {
    // Array index logic
    if (!isNaN(key)) {
      cur[key] = Array.isArray(cur[key]) ? [...cur[key]] : { ...cur[key] };
      cur = cur[key];
    } else {
      // Array access if like products.0.amount
      if (keys[idx + 1] && !isNaN(keys[idx + 1])) {
        cur[key] = cur[key] ? [...cur[key]] : [];
      } else {
        cur[key] = cur[key] ? { ...cur[key] } : {};
      }
      cur = cur[key];
    }
  });
  cur[lastKey] = value;
  return temp;
}

function Expenditure({ targetedData, setSwaper, swaper, refresh }) {
  const [billFile, setBillFile] = useState(null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [discountType, setDiscountType] = useState("percentage");
  const [formData, setFormData] = useState({
    billInvoiceNo: "",
    billDate: "",
    supplier: {
      name: "",
      contact: "",
      email: "",
      address: "",
      gstin: "",
    },
    products: [
      {
        type: "consumable",
        productName: "",
        quantity: 1,
        purchaseDate: "",
        amount: 0,
        expiryDate: "",
        brand: "",
        model: "",
        serialNumber: "",
        warrantyExpiryDate: "",
        calibrationDueDate: "",
      },
    ],
    financials: {
      subtotal: 0,
      discount: { percentage: 0, amount: 0 },
      gst: { percentage: 0, amount: 0 },
      totalAmount: 0,
      netAmount: 0,
    },
    payment: {
      mode: "cash",
      transactionId: "",
      status: "pending",
      paidAmount: 0,
      dueAmount: 0,
    },
    billFile: null,
  });

  // Populate form when editing
  useEffect(() => {
    if (targetedData) {
      setFormData((prev) => ({
        ...prev,
        ...targetedData,
        supplier: { ...prev.supplier, ...targetedData.supplier },
        financials: { ...prev.financials, ...targetedData.financials },
        payment: { ...prev.payment, ...targetedData.payment },
        products: targetedData.products || prev.products,
      }));
      setBillFile(targetedData.billFile || null);
    }
  }, [targetedData]);

  // Financial calculations
  useEffect(() => {
    const subtotal = formData.products.reduce(
      (acc, item) =>
        acc + (Number(item.amount) || 0) * (Number(item.quantity) || 1),
      0
    );

    const discountPercentage =
      Number(formData.financials.discount?.percentage) || 0;
    const discountAmountInput =
      Number(formData.financials.discount?.amount) || 0;

    let discountAmount = 0;
    let percentage = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discountPercentage) / 100;
      percentage = discountPercentage;
    } else {
      discountAmount = discountAmountInput;
      percentage = subtotal ? (discountAmountInput / subtotal) * 100 : 0;
    }

    const afterDiscount = subtotal - discountAmount;
    const gstPercentage = Number(formData.financials.gst?.percentage) || 0;
    const gstAmount = (afterDiscount * gstPercentage) / 100;
    const totalAmount = afterDiscount + gstAmount;
    const paidAmount = Number(formData.payment.paidAmount) || 0;
    const dueAmount = totalAmount - paidAmount;

    setFormData((prev) => ({
      ...prev,
      financials: {
        ...prev.financials,
        subtotal,
        discount: { amount: discountAmount, percentage },
        gst: {
          ...prev.financials.gst,
          amount: gstAmount,
          percentage: gstPercentage,
        },
        totalAmount,
        netAmount: totalAmount,
      },
      payment: { ...prev.payment, dueAmount },
    }));
  }, [
    formData.products,
    formData.financials.discount?.percentage,
    formData.financials.discount?.amount,
    formData.financials.gst?.percentage,
    formData.payment.paidAmount,
    discountType,
  ]);

  // --- Unified change handler
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let val = value;
    // array index support for select and numeric parsing
    if (type === "number") val = Number(value) || 0;

    // For discount type toggle: percentage vs amount
    if (name === "financials.discount.percentage")
      setDiscountType("percentage");
    if (name === "financials.discount.amount") setDiscountType("amount");

    // Supplier select: populate fields
    if (name === "supplier.name") {
      const selectedSupplier = allSuppliers.find((s) => s.name === val);
      if (selectedSupplier) {
        setFormData((prev) => ({
          ...prev,
          supplier: {
            id: selectedSupplier._id,
            name: selectedSupplier.name,
            contact: selectedSupplier.contact,
            email: selectedSupplier.email,
            address: selectedSupplier.address,
            gstin: selectedSupplier.gstin,
          },
        }));
        return;
      }
    }

    setFormData((prev) => setDeepValue(prev, name, val));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          type: "consumable",
          productName: "",
          quantity: 1,
          purchaseDate: "",
          amount: 0,
          expiryDate: "",
          brand: "",
          model: "",
          serialNumber: "",
          warrantyExpiryDate: "",
          calibrationDueDate: "",
        },
      ],
    }));
  };

  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setBillFile(file);
    setFormData((prev) => ({ ...prev, billFile: file }));
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append("billInvoiceNo", formData.billInvoiceNo || "");
    data.append("billDate", formData.billDate || "");
    data.append("supplier", JSON.stringify(formData.supplier || {}));
    data.append("products", JSON.stringify(formData.products || []));
    data.append("financials", JSON.stringify(formData.financials || {}));
    data.append("payment", JSON.stringify(formData.payment || {}));
    if (billFile) data.append("billFile", billFile);
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = buildFormData();
      await AxiosInstance.post("/expenditure/add-purchase", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Bill submitted successfully!");
      setSwaper((prev) => !prev);
      if (refresh) refresh();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to submit bill");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = buildFormData();
      await AxiosInstance.patch(`/expenditure/update/${formData._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Bill updated successfully!");
      setSwaper((prev) => !prev);
      if (refresh) refresh();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to update bill");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await AxiosInstance.get("/supplier/get-all");
        setAllSuppliers(res.data.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Icon icon="tabler:receipt" className="text-2xl text-blue-600 " />
          </div>
          <div>
            <h1 className="font-black text-slate-800  text-3xl tracking-tight">
              {formData?._id ? "Edit" : "New"} <span className="text-blue-500">Purchase</span>
            </h1>
            <p className="text-slate-500  font-medium text-sm">
              Manage doctor purchases and expenditures
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={formData?._id ? handleUpdate : handleSubmit} className="space-y-6">
        {/* Bill Info Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="tabler:file-invoice" className="text-xl text-blue-600 " />
              <h3 className="text-lg font-black text-slate-800 ">Bill Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Invoice No
                </label>
                <Input
                  type="text"
                  name="billInvoiceNo"
                  className="rounded-xl"
                  value={formData.billInvoiceNo}
                  onChange={handleChange}
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Bill Date
                </label>
                <Input
                  type="date"
                  name="billDate"
                  className="rounded-xl"
                  value={formData.billDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Supplier Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="tabler:building-store" className="text-xl text-emerald-600 " />
              <h3 className="text-lg font-black text-slate-800 ">Supplier Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Supplier Name
                </label>
                <select
                  name="supplier.name"
                  className="w-full rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplier.name}
                  onChange={handleChange}
                >
                  <option value="">Select Supplier</option>
                  {allSuppliers.map((data) => (
                    <option key={data._id} value={data.name}>
                      {data.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["contact", "email", "address", "gstin"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <Input
                      type="text"
                      name={`supplier.${field}`}
                      className="rounded-xl bg-slate-100 "
                      value={formData.supplier[field] || ""}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Products Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="tabler:package" className="text-xl text-purple-600 " />
                <h3 className="text-lg font-black text-slate-800 ">Products</h3>
              </div>
              <Button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30"
              >
                <Icon icon="tabler:plus" className="text-lg" />
                Add Product
              </Button>
            </div>
            <div className="space-y-4">
              {formData.products.map((item, index) => (
                <div key={index} className="border border-slate-200  rounded-xl p-4 bg-slate-50/50 ">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-slate-700 ">Product {index + 1}</h4>
                    {formData.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-700  :text-red-300 font-semibold text-sm flex items-center gap-1"
                      >
                        <Icon icon="tabler:trash" className="text-base" />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                        Type
                      </label>
                      <select
                        name={`products.${index}.type`}
                        className="w-full rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.type}
                        onChange={handleChange}
                      >
                        <option value="consumable">Consumable</option>
                        <option value="equipment">Equipment</option>
                      </select>
                    </div>
                    {["productName", "quantity", "purchaseDate", "amount"].map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                          {field.replace(/([A-Z])/g, " $1")}
                        </label>
                        <Input
                          type={
                            field === "purchaseDate"
                              ? "date"
                              : field === "productName"
                                ? "text"
                                : "number"
                          }
                          name={`products.${index}.${field}`}
                          className="rounded-xl"
                          value={item[field] || ""}
                          onChange={handleChange}
                        />
                      </div>
                    ))}
                    {item.type === "consumable" && (
                      <div>
                        <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                          Expiry Date
                        </label>
                        <Input
                          type="date"
                          name={`products.${index}.expiryDate`}
                          className="rounded-xl"
                          value={item.expiryDate || ""}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    {item.type === "equipment" && (
                      <>
                        {["brand", "model", "serialNumber"].map((field) => (
                          <div key={field}>
                            <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                            <Input
                              type="text"
                              name={`products.${index}.${field}`}
                              className="rounded-xl"
                              value={item[field] || ""}
                              onChange={handleChange}
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                            Warranty Expiry
                          </label>
                          <Input
                            type="date"
                            name={`products.${index}.warrantyExpiryDate`}
                            className="rounded-xl"
                            value={item.warrantyExpiryDate || ""}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                            Calibration Due
                          </label>
                          <Input
                            type="date"
                            name={`products.${index}.calibrationDueDate`}
                            className="rounded-xl"
                            value={item.calibrationDueDate || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Financials Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="tabler:calculator" className="text-xl text-amber-600 " />
              <h3 className="text-lg font-black text-slate-800 ">Financials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Subtotal
                </label>
                <Input
                  type="number"
                  name="financials.subtotal"
                  className="rounded-xl bg-slate-100  font-bold text-slate-800 "
                  value={formData.financials.subtotal || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Discount %
                </label>
                <Input
                  type="number"
                  name="financials.discount.percentage"
                  className="rounded-xl"
                  value={formData.financials.discount?.percentage || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Discount Amount
                </label>
                <Input
                  type="number"
                  name="financials.discount.amount"
                  className="rounded-xl"
                  value={formData.financials.discount?.amount || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  GST %
                </label>
                <Input
                  type="number"
                  name="financials.gst.percentage"
                  className="rounded-xl"
                  value={formData.financials.gst?.percentage || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Total Amount
                </label>
                <Input
                  type="number"
                  name="financials.totalAmount"
                  className="rounded-xl bg-blue-50  font-black text-blue-600  text-xl"
                  value={formData.financials.totalAmount || ""}
                  readOnly
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="tabler:credit-card" className="text-xl text-rose-600 " />
              <h3 className="text-lg font-black text-slate-800 ">Payment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Payment Mode
                </label>
                <select
                  name="payment.mode"
                  className="w-full rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.payment.mode}
                  onChange={handleChange}
                >
                  {["cash", "card", "upi", "bank"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {formData.payment.mode !== "cash" && (
                <div>
                  <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                    Transaction ID
                  </label>
                  <Input
                    type="text"
                    name="payment.transactionId"
                    className="rounded-xl"
                    value={formData.payment.transactionId}
                    onChange={handleChange}
                    placeholder="Enter transaction ID"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Payment Status
                </label>
                <select
                  name="payment.status"
                  className="w-full rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.payment.status}
                  onChange={handleChange}
                >
                  {["pending", "completed", "failed"].map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Paid Amount
                </label>
                <Input
                  type="number"
                  name="payment.paidAmount"
                  className="rounded-xl"
                  value={formData.payment.paidAmount}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                  Due Amount
                </label>
                <Input
                  type="number"
                  name="payment.dueAmount"
                  className="rounded-xl bg-slate-100  font-bold text-red-600 "
                  value={formData.payment.dueAmount}
                  readOnly
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Bill File Upload Card */}
        <Card className="bg-white/40  backdrop-blur-md border-slate-200/60 ">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="tabler:file-upload" className="text-xl text-cyan-600 " />
              <h3 className="text-lg font-black text-slate-800 ">Bill File</h3>
            </div>
            <input
              type="file"
              className="w-full rounded-xl border border-slate-300  bg-white  text-slate-800  px-4 py-2.5 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-semibold hover:file:bg-blue-600 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {billFile &&
              (typeof billFile === "string" ? (
                <a
                  href={billFile}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-blue-600  font-semibold hover:underline"
                >
                  <Icon icon="tabler:external-link" />
                  View Current File
                </a>
              ) : (
                <p className="text-sm text-slate-600  mt-3 flex items-center gap-2">
                  <Icon icon="tabler:file-check" className="text-emerald-600" />
                  Selected: {billFile.name}
                </p>
              ))}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => setSwaper((prev) => !prev)}
            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300  :bg-slate-600 text-slate-700  rounded-xl font-semibold transition-all"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            <Icon icon={formData?._id ? "tabler:device-floppy" : "tabler:check"} className="text-xl" />
            {formData?._id ? "Update Bill" : "Submit Bill"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Expenditure;
