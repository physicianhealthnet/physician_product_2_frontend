import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react/dist/iconify.js";
import { message } from "antd";
import formatDateToDDMMYYYY from "../../../utilities/formatter";
import { TableSkeleton, Skeleton } from "../../../component/ui/Skeleton";

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

function Inventory() {
  const [productsName, setProductsName] = useState([]);
  const [addSwaper, setAddSwaper] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null); // 🔹 fixed "seleted" issue
  const [loading, setLoading] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetProducts = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/inventory/get-all");
      setProductsName(response.data.product || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitData = async () => {
    try {
      const response = await AxiosInstance.post("/inventory/add", formData);
      message.success("Product Added Successfully");
      handleGetProducts();
      setFormData({});
      setAddSwaper(false);
    } catch (error) {
      message.error("Product failed to Add");
      console.error(error);
    }
  };

  const handleUpdateData = async () => {
    try {
      const response = await AxiosInstance.patch(
        `/inventory/update/${formData._id}`,
        formData
      );
      message.success("Product Updated Successfully");
      setFormData(response.data.data);
      handleGetProducts();
      setFormData({});
      setAddSwaper(false);
    } catch (error) {
      message.error("Product failed to Update");
      console.error(error);
    }
  };

  const handleDeleteData = async (id) => {
    try {
      await AxiosInstance.delete(`/inventory/delete/${id}`);
      message.success("Product Deleted Successfully");
      handleGetProducts();
    } catch (error) {
      message.error("Product failed to Delete");
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetProducts();
  }, []);

  // 🔹 Filter products based on search
  const filteredProducts = productsName.filter((p) =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-10 p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* Header Section */}
        <StaggerItem>
          <div className="flex flex-col lg:flex-row justify-between rounded items-start lg:items-center gap-8">
            <div>
              <h1 className="font-black text-slate-800 text-4xl tracking-tight leading-tight">
                Inventory <span className="text-blue-500">Management</span>
              </h1>
              <p className="text-slate-500 font-medium mt-2 tracking-wide uppercase text-[10px]">
                Track clinical supplies, stocks, and pharmacy availability
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                <div className="relative group flex-1">
                  <Icon icon="solar:magnifer-bold-duotone" width="18" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search supply list..."
                    className="h-10 w-80 pl-12 pr-4 bg-white rounded border border-slate-200 text-xs font-bold shadow-sm focus:border-blue-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setFormData({});
                  setAddSwaper(true);
                }}
                className="flex items-center gap-3 px-6 py-2.5 bg-blue-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-700 hover:scale-[1.05] active:scale-95 transition-all duration-300"
              >
                <Icon icon="solar:add-circle-bold-duotone" width="16" />
                Add New Item
              </button>
            </div>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 flex-1">
          {/* Detail Panel */}
          <StaggerItem className="xl:col-span-12">
            <div>
              {loading ? (
                <div className="bg-white/50 backdrop-blur-md rounded p-10 border border-slate-200 shadow-sm overflow-hidden relative h-[200px]">
                  <div className="flex gap-6 items-center">
                    <Skeleton className="w-16 h-16 rounded-2xl" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </div>
              ) : formData?._id ? (
                <div className="bg-white/50 backdrop-blur-md rounded p-10 border border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />

                  <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                          <Icon icon="solar:box-bold-duotone" width="32" />
                        </div>
                        <div>
                          <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none capitalize">
                            {formData.productName}
                          </h2>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-500 tracking-wider">ID: {formData._id?.slice(-8).toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added {formatDateToDDMMYYYY(formData?.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                      <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex-1 min-w-[200px]">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Capacity</div>
                        <div className="text-3xl font-black text-slate-800">{formData.productTotalCount}</div>
                      </div>
                      <div className="group bg-blue-500 p-6 rounded shadow-[0_8px_16px_-4px_rgba(59,130,246,0.4)] flex-1 min-w-[220px] relative overflow-hidden transition-transform hover:scale-105">
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
                          <Icon icon="solar:box-bold-duotone" width="80" />
                        </div>
                        <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 drop-shadow opacity-90">Current Stock</div>
                        <div className="flex items-end justify-between">
                          <div className="text-3xl font-black text-white drop-shadow-md">{formData.productCurrentCount}</div>
                          <button
                            onClick={() => setAddSwaper(true)}
                            className="w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 drop-shadow-md"
                          >
                            <Icon icon="solar:pen-bold-duotone" width="18" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded p-24 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center transition-all group hover:bg-slate-100/50">
                  <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                    <Icon icon="solar:hand-stars-bold-duotone" width="48" className="text-blue-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">Ready to manage stock?</h3>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-2">Select a product from the list below to view detailed metrics</p>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Product List Table */}
          <StaggerItem className="xl:col-span-12">
            <div className="bg-white/50 rounded border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
              <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                  Supply & Inventory Catalog
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full">
                  {filteredProducts.length} PRODUCTS FOUND
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-100/50 backdrop-blur-md">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">#</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Product Description</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-0">
                          <TableSkeleton rows={8} />
                        </td>
                      </tr>
                    ) : filteredProducts.length > 0 ? (
                      <>
                        {filteredProducts.map((data, index) => {
                          const isLowStock =
                            data.productCurrentCount < data.productTotalCount * 0.2;
                          const isVeryLow = data.productCurrentCount < 5;

                          return (
                            <tr
                              key={index}
                              className={`group transition-all duration-300 cursor-pointer ${selected === index
                                  ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                                  : "hover:bg-slate-50/50"
                                }`}
                              onClick={() => {
                                setFormData(data);
                                setSelected(index);
                              }}
                            >
                              <td className="px-8 py-6 text-xs font-black text-slate-400">
                                {index + 1}
                              </td>
                              <td className="px-8 py-6">
                                <div className="font-bold text-slate-800 text-sm">
                                  {data.productName}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div
                                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isVeryLow
                                      ? "bg-rose-100 text-rose-600"
                                      : isLowStock
                                        ? "bg-orange-100 text-orange-600"
                                        : "bg-emerald-100 text-emerald-600"
                                    }`}
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${isVeryLow
                                        ? "bg-rose-500 animate-ping shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                                        : isLowStock
                                          ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                          : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                      }`}
                                  />
                                  {isVeryLow
                                    ? "Critical Stock"
                                    : isLowStock
                                      ? "Low Stock"
                                      : "In Stock"}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all shadow-sm border border-slate-200 rounded-xl"
                                    title="Quick View"
                                  >
                                    <Icon icon="solar:eye-bold-duotone" width="18" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteData(data._id);
                                    }}
                                    className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm border border-rose-100 rounded-xl"
                                    title="Permanent Delete"
                                  >
                                    <Icon
                                      icon="solar:trash-bin-trash-bold-duotone"
                                      width="18"
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                              <Icon
                                icon="solar:box-search-linear"
                                width="32"
                                className="text-slate-300"
                              />
                            </div>
                            <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                              No supplies match your search criteria
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </StaggerItem>
        </div>

        {/* Modern Add / Update Modal */}
        {addSwaper && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-100 backdrop-blur-md animate-in fade-in duration-300 p-8">
            <div className="bg-white w-full max-w-[600px] rounded p-10 border border-slate-200 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] relative">
              <button
                onClick={() => {
                  setFormData({});
                  setAddSwaper(false);
                }}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
              >
                <Icon icon="solar:close-circle-bold-duotone" width="20" />
              </button>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Icon icon={formData?._id ? "solar:pen-bold-duotone" : "solar:add-circle-bold-duotone"} width="24" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">
                    {formData?._id ? "Update Supply" : "Register Item"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Inventory Ledger Update</p>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                  <input
                    type="text"
                    name="productName"
                    className="w-full h-12 px-4 bg-white rounded border border-slate-200 font-bold text-slate-800 focus:border-blue-500 shadow-sm outline-none transition-all"
                    placeholder="e.g. Disposable Masks (Box of 50)"
                    onChange={handleInputChange}
                    value={formData?.productName || ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Capacity</label>
                    <input
                      type="number"
                      name="productTotalCount"
                      className="w-full h-12 px-4 bg-white rounded border border-slate-200 text-center font-bold text-slate-800 focus:border-blue-500 shadow-sm outline-none transition-all"
                      placeholder="0"
                      onChange={handleInputChange}
                      value={formData?.productTotalCount || ""}
                    />
                  </div>
                  {formData?._id && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Now</label>
                      <input
                        type="number"
                        name="productCurrentCount"
                        className="w-full h-12 px-4 bg-white rounded border border-slate-200 text-center font-bold text-blue-600 focus:border-blue-500 shadow-sm outline-none transition-all"
                        placeholder="0"
                        onChange={handleInputChange}
                        value={formData?.productCurrentCount || ""}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    formData?._id ? handleUpdateData() : handleSubmitData();
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-sm transition-all duration-300 mt-2"
                >
                  {formData?._id ? "Commit Updates" : "Confirm Entry"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaggerContainer>
  );
}

export default Inventory;
