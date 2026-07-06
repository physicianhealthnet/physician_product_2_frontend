import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { message } from "antd";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

function Supplier() {
  const [swaper, setSwaper] = useState(false);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [formData, setFormData] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetAllSuppliers = async () => {
    try {
      const response = await AxiosInstance.get("/supplier/get-all");
      setAllSuppliers(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await AxiosInstance.post("/supplier/add", formData);
      message.success("Supplier Added Successfully");
      handleGetAllSuppliers();
      setFormData({});
      setSwaper(false);
    } catch (error) {
      message.error("Supplier fail to Add");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await AxiosInstance.patch(
        `/supplier/update/${formData._id}`,
        formData
      );
      message.success("Supplier Updated Successfully");
      handleGetAllSuppliers();
      setFormData({});
      setSwaper(false);
    } catch (error) {
      message.error("Supplier fail to Update");
      console.error(error);
    }
  };

  const handleDelete = async (data) => {
    try {
      const response = await AxiosInstance.delete(
        `/supplier/delete/${data?._id}`
      );

      message.success("Supplier Deleted Successfully");
      handleGetAllSuppliers();
    } catch (error) {
      message.error("Supplier fail to Delete");
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetAllSuppliers();
  }, []);

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-8 pb-8">
        {/* Modern Header */}
        <StaggerItem>
          <div className="flex flex-col gap-1">
            <h1 className="font-black text-slate-800  text-4xl tracking-tight">
              <span className="text-blue-500">Suppliers</span>
            </h1>
            <p className="text-slate-500  font-medium">
              Manage supplier information and contacts
            </p>
          </div>
        </StaggerItem>

        {/* Add/Show Toggle Button */}
        <StaggerItem>
          <div className="flex items-center gap-3">
            <Button
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg ${swaper
                  ? "bg-slate-500 hover:bg-slate-600 text-white shadow-slate-500/30"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30"
                }`}
              onClick={() => {
                setSwaper((p) => !p);
                if (swaper) setFormData({});
              }}
            >
              <Icon
                icon={swaper ? "tabler:list" : "tabler:plus"}
                className="text-xl transition-transform duration-300"
              />
              {swaper ? "Show Suppliers" : "Add Supplier"}
            </Button>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div>
            {!swaper ? (
              /* Suppliers Table */
              allSuppliers?.length > 0 ? (
                <Card className="overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60 ">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100/80  backdrop-blur-sm">
                        <tr className="border-b border-slate-200 ">
                          <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Name</th>
                          <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Contact</th>
                          <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Email</th>
                          <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Address</th>
                          <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">GSTIN</th>
                          <th className="p-4 text-center font-black text-slate-600  uppercase tracking-wider text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 ">
                        {allSuppliers.map((data, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 :bg-slate-900/50 transition-colors">
                            <td className="p-4 font-semibold text-slate-800 ">{data?.name}</td>
                            <td className="p-4 font-medium text-slate-600 ">{data?.contact}</td>
                            <td className="p-4 font-medium text-slate-600 ">{data?.email}</td>
                            <td className="p-4 font-medium text-slate-600 ">{data?.address}</td>
                            <td className="p-4 font-black text-blue-600 ">{data?.gstin}</td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  title="Edit"
                                  onClick={() => {
                                    setFormData(data);
                                    setSwaper(true);
                                  }}
                                  className="w-9 h-9 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white transition-all duration-200 flex items-center justify-center"
                                >
                                  <Icon icon="tabler:edit" className="text-lg" />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={() => handleDelete(data)}
                                  className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all duration-200 flex items-center justify-center"
                                >
                                  <Icon icon="tabler:trash" className="text-lg" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center bg-white/40  backdrop-blur-md border-slate-200/60 ">
                  <div className="flex flex-col items-center gap-3">
                    <Icon icon="tabler:building-store" className="text-6xl text-slate-300 " />
                    <p className="text-slate-500  font-semibold">No suppliers found</p>
                  </div>
                </Card>
              )
            ) : (
              /* Add/Edit Form */
              <div className="flex items-center justify-center">
                <Card className="w-full max-w-md bg-white/40  backdrop-blur-md border-slate-200/60 ">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Icon icon={formData?._id ? "tabler:edit" : "tabler:plus"} className="text-2xl text-blue-600 " />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 ">
                        {formData?._id ? "Edit Supplier" : "Add Supplier"}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: "Name", name: "name" },
                        { label: "Contact", name: "contact", type: "number" },
                        { label: "Email", name: "email", type: "email" },
                        { label: "Address", name: "address" },
                        { label: "GSTIN", name: "gstin" },
                      ].map((field, index) => (
                        <div key={index}>
                          <label className="block text-xs font-black text-slate-500  uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <Input
                            type={field.type || "text"}
                            name={field.name}
                            value={formData?.[field.name] || ""}
                            onChange={handleInputChange}
                            className="rounded-xl"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => {
                          setSwaper(false);
                          setFormData({});
                        }}
                        className="flex-1 px-6 py-2.5 bg-slate-200 hover:bg-slate-300  :bg-slate-600 text-slate-700  rounded-xl font-semibold transition-all"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => (formData?._id ? handleEdit() : handleSubmit())}
                        className="flex-1 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30"
                      >
                        {formData?._id ? "Update" : "Submit"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}

export default Supplier;
