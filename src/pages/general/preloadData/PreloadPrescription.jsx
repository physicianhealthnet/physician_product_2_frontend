import { Icon } from "@iconify/react/dist/iconify.js";
import { message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import CreatableSelect from "react-select/creatable";
import { CardSkeleton } from "../../../component/ui/Skeleton";
import Card from "../../../component/ui/Card";
import Button from "../../../component/ui/Button";
import Input from "../../../component/ui/Input";
import Textarea from "../../../component/ui/Textarea";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

function PreloadPrescription() {
  const [modalOpen, setModalOpen] = useState(false);
  const [preloadedMedicinesData, setPreloadedMedicinesData] = useState([]);
  const [singleMedicineData, setSingleMedicineData] = useState({});
  const [formData, setFormData] = useState({ title: "", age: "" });
  const [titles, setTitles] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState("");
  const [editingMedicineIndex, setEditingMedicineIndex] = useState(null);
  const [medicineOptions, setMedicineOptions] = useState([]);

  const handleMedicineChange = (name, value) => {
    setSingleMedicineData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineSubmit = () => {
    if (
      !singleMedicineData.medicine ||
      (!singleMedicineData.dosageM &&
        !singleMedicineData.dosageA &&
        !singleMedicineData.dosageN)
    ) {
      message.error("Please fill in Medicine Name and at least one dosage.");
      return;
    }
    setPreloadedMedicinesData((prev) => {
      let updated;
      if (editingMedicineIndex !== null) {
        updated = prev.map((med, idx) =>
          idx === editingMedicineIndex ? { ...singleMedicineData } : med,
        );
        setEditingMedicineIndex(null);
        message.success("Medicine updated within template.");
      } else {
        updated = [...prev, { ...singleMedicineData }];
        message.success("Medicine added to template.");
      }
      return updated;
    });
    setSingleMedicineData({});
  };

  const handleEditMedicine = (index) => {
    const med = preloadedMedicinesData[index];
    setSingleMedicineData({ ...med });
    setEditingMedicineIndex(index);
  };

  const handleDeleteMedicine = (index) => {
    setPreloadedMedicinesData((prev) => prev.filter((_, i) => i !== index));
    message.success("Medicine removed from template.");
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure you want to delete this template?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await AxiosInstance.delete(`/preload-prescription/delete/${id}`);
          message.success("Template deleted successfully");
          getAllData();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete template");
        }
      }
    });
  };

  const summitData = async () => {
    // Clean _id from medicines before sending
    const cleanedMedicines = preloadedMedicinesData.map((med) => {
      const { _id, ...rest } = med;
      return rest;
    });

    const payload = {
      title:
        formData.title === "othersEntry" ? formData.others : formData.title,
      age: formData.age || "All Ages",
      preloadedMedicinesData: cleanedMedicines,
    };

    if (payload.title) {
      try {
        if (editId) {
          await AxiosInstance.put(
            `/preload-prescription/update/${editId}`,
            payload,
          );
          message.success("Template updated successfully");
        } else {
          await AxiosInstance.post("/preload-prescription/create", payload);
          message.success("Template created successfully");
        }
        setFormData({ title: "", age: "" });
        setPreloadedMedicinesData([]);
        setEditId("");
        setEditingMedicineIndex(null);
        setModalOpen(false);
        getTitles();
        getAllData();
      } catch (error) {
        console.error(error);
        message.error("Process failed.");
      }
    } else {
      message.error("Please provide a title for the template");
    }
  };

  const getTitles = async () => {
    try {
      const response = await AxiosInstance.get(
        "/preload-prescription/get-titles",
      );
      setTitles(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getAllData = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(
        "/preload-prescription/get-all-data",
      );
      setAllData(response.data.data);

      // Extract unique medicines for auto-completion
      const allMeds = response.data.data.flatMap(
        (template) =>
          template.preloadedMedicinesData?.map((med) => med.medicine) || [],
      );

      let invMeds = [];
      try {
        const invResponse = await AxiosInstance.get("/inventory/get-name");
        invMeds = invResponse?.data?.data || [];
      } catch (err) {
        console.error("Failed to fetch inventory names for autocomplete", err);
      }

      const uniqueMeds = [...new Set([...allMeds, ...invMeds].filter(Boolean))];
      setMedicineOptions(uniqueMeds.map((med) => ({ label: med, value: med })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTitles();
    getAllData();
  }, []);

  const filteredAllData = allData.filter((data) => {
    const searchString = searchTerm.toLowerCase();
    const titleMatch = data?.title?.toLowerCase().includes(searchString);
    const medicineMatch = data?.preloadedMedicinesData?.some((med) =>
      med?.medicine?.toLowerCase().includes(searchString),
    );
    return titleMatch || medicineMatch;
  });

  return (
    <StaggerContainer>
      <div className="p-4 md:p-8 flex flex-col gap-8">
        {/* Header Section */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black text-slate-800  tracking-tight">
                Prescription <span className="text-blue-500">Templates</span>
              </h1>
              <p className="text-slate-500  font-medium max-w-xl">
                Create and manage pre-loaded clinical bundles for faster
                prescription workflow and standardized care.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditId("");
                setFormData({ title: "", age: "" });
                setPreloadedMedicinesData([]);
                setSingleMedicineData({});
                setEditingMedicineIndex(null);
                setModalOpen(true);
              }}
              className="rounded-2xl px-8 h-12 shadow-lg shadow-blue-500/25 flex items-center gap-3 transition-all hover:scale-105"
            >
              <Icon icon="tabler:plus" className="text-xl" />
              <span>New Template Bundle</span>
            </Button>
          </div>
        </StaggerItem>

        {/* Stats and Search */}
        <StaggerItem>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex items-center shadow shadow-slate-200 flex-1 w-full gap-4 px-6 py-2 bg-white/50 rounded-2xl backdrop-blur-xl border border-slate-200/50">
              <Icon icon="tabler:search" className="text-[#14BEF0] text-xl" />
              <input
                type="text"
                placeholder="Search templates by title or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-700 placeholder:text-slate-400 dark:text-slate-600 font-medium h-12"
              />
            </div>
            <div className="flex items-center shadow shadow-slate-200 justify-between w-full max-lg:w-full lg:w-1/2 gap-4 px-6 py-2 bg-white/50 rounded-2xl backdrop-blur-xl border border-slate-200/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#14BEF0]">
                  Total Templates
                </span>
                <span className="text-2xl font-black text-[#14BEF0]">
                  {allData.length}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#14BEF0]/20 flex items-center justify-center">
                <Icon
                  icon="tabler:layers-intersect"
                  className="text-2xl text-[#14BEF0]"
                />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Templates Grid */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
            ) : filteredAllData.length > 0 ? (
              filteredAllData.map((data, i) => (
                <Card
                  key={i}
                  className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60 "
                  onClick={() => {
                    const existingTitle = data?.title;
                    const titleOptions = titles?.map((t) => t.title) || [];
                    const isOthers = !titleOptions.includes(existingTitle);
                    setEditId(data?._id);
                    setFormData({
                      title: isOthers ? "othersEntry" : existingTitle,
                      others: isOthers ? existingTitle : "",
                      age: data?.age,
                    });
                    setPreloadedMedicinesData(data?.preloadedMedicinesData || []);
                    setSingleMedicineData({});
                    setEditingMedicineIndex(null);
                    setModalOpen(true);
                  }}
                >
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-black text-slate-800  text-lg group-hover:text-[#14BEF0] transition-colors">
                          {data.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100  text-[10px] font-bold text-slate-500  uppercase tracking-widest border border-slate-200/50 ">
                            {data.age || "General"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteTemplate(data._id, e)}
                          className="w-10 h-10 rounded-xl bg-slate-100  flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Template"
                        >
                          <Icon icon="tabler:trash" className="text-xl" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-slate-100  flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                          <Icon icon="tabler:edit" className="text-xl" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest">
                        Medicine Composition
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.preloadedMedicinesData
                          ?.slice(0, 4)
                          .map((med, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50/50  text-[#14BEF0]  text-[10px] font-bold rounded-lg border border-blue-100  shadow-sm"
                            >
                              {med.medicine}
                            </span>
                          ))}
                        {data.preloadedMedicinesData?.length > 4 && (
                          <span className="px-2 py-1 bg-slate-100  text-slate-500 text-[10px] font-bold rounded-lg">
                            +{data.preloadedMedicinesData.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100  flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Icon icon="tabler:pill" className="text-sm" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {data.preloadedMedicinesData?.length || 0} Medications
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        View & Edit
                        <Icon icon="tabler:chevron-right" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full h-64 flex flex-col items-center justify-center gap-4 bg-slate-50  border-2 border-dashed border-slate-200  rounded-[40px]">
                <Icon
                  icon="tabler:mood-empty"
                  className="text-4xl text-slate-300"
                />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">
                  No templates found
                </p>
              </div>
            )}
          </div>
        </StaggerItem>

        <Modal
          title={
            <div className="flex items-center gap-3 p-4 border-b border-slate-100  -mx-6 -mt-5 mb-6">
              <div className="w-10 h-10  bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Icon
                  icon={editId ? "tabler:edit" : "tabler:plus"}
                  className="text-xl"
                />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800  leading-tight">
                  {editId ? "Modify Template Bundle" : "New Clinical Bundle"}
                </h2>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  Configure your saved medication list for standardized care.
                </p>
              </div>
            </div>
          }
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={null}
          width={900}
          centered
          className="custom-modal"
        >
          <div className="space-y-8">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                  Clinical Bundle Title
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 h-12 border shadow-sm border-slate-300 bg-white rounded-2xl text-sm font-bold text-slate-700  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Bundle Title</option>
                  {titles.map((t) => (
                    <option key={t._id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                  <option value="othersEntry">Other Condition...</option>
                </select>
              </div>

              {formData.title === "othersEntry" && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Specify Condition
                  </label>
                  <Input
                    name="others"
                    placeholder="Enter custom condition name..."
                    value={formData.others}
                    onChange={handleChange}
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                  Target Age Group
                </label>
                <select
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 h-12 border shadow-sm border-slate-300 rounded-2xl text-sm font-bold text-slate-700  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Age Group</option>
                  <option value="Pediatric">Pediatric (0-12)</option>
                  <option value="Adolescent">Adolescent (13-18)</option>
                  <option value="Adult">Adult (18-60)</option>
                  <option value="Geriatric">Geriatric (60+)</option>
                  <option value="All Ages">All Ages</option>
                </select>
              </div>
            </div>

            {/* Medicine Entry */}
            <div className="bg-slate-50/50  p-6 rounded-xl border border-slate-200/60  flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Icon icon="tabler:pill-filled" />
                </div>
                <h3 className="font-black text-slate-800  uppercase tracking-widest text-xs">
                  Add Medication to Template
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Medication Name
                  </label>
                  <CreatableSelect
                    isClearable
                    isSearchable
                    classNamePrefix="select"
                    placeholder="Search or type medicine..."
                    value={
                      singleMedicineData.medicine
                        ? {
                            label: singleMedicineData.medicine,
                            value: singleMedicineData.medicine,
                          }
                        : null
                    }
                    onChange={(opt) =>
                      handleMedicineChange("medicine", opt ? opt.value : "")
                    }
                    options={medicineOptions}
                    styles={{
                      control: (base) => ({
                        ...base,
                        padding: "4px 8px",
                        background: "transparent",
                        border: "1px solid #cad5e2",
                        fontWeight: "bold",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                      }),
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Dosage (M-A-N)
                  </label>
                  <div className="flex gap-2 h-12 border border-slate-300 shadow rounded-xl bg-white  p-1.5 overflow-hidden">
                    <input
                      type="text"
                      placeholder="M"
                      value={singleMedicineData.dosageM || ""}
                      onChange={(e) =>
                        handleMedicineChange("dosageM", e.target.value)
                      }
                      className="w-full text-center border-none focus:ring-0 text-sm font-bold placeholder:text-slate-300 "
                    />
                    <div className="w-[1px] h-full bg-slate-100 " />
                    <input
                      type="text"
                      placeholder="A"
                      value={singleMedicineData.dosageA || ""}
                      onChange={(e) =>
                        handleMedicineChange("dosageA", e.target.value)
                      }
                      className="w-full text-center border-none focus:ring-0 text-sm font-bold placeholder:text-slate-300 "
                    />
                    <div className="w-[1px] h-full bg-slate-100 " />
                    <input
                      type="text"
                      placeholder="N"
                      value={singleMedicineData.dosageN || ""}
                      onChange={(e) =>
                        handleMedicineChange("dosageN", e.target.value)
                      }
                      className="w-full text-center border-none focus:ring-0 text-sm font-bold placeholder:text-slate-300 "
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Days
                  </label>
                  <Input
                    type="number"
                    placeholder="No. of days..."
                    value={singleMedicineData.days || ""}
                    onChange={(e) =>
                      handleMedicineChange("days", e.target.value)
                    }
                    className="rounded-xl h-12 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Timing
                  </label>
                  <div className="flex gap-2 p-1.5 bg-white  border border-slate-300 shadow  rounded-xl h-12">
                    {["AF", "BF"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleMedicineChange("af_bf", opt)}
                        className={`flex-1 rounded-xl text-[10px] font-black transition-all ${
                          singleMedicineData.af_bf === opt
                            ? "bg-slate-800 text-white  shadow-sm"
                            : "text-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">
                    Additional Instruction
                  </label>
                  <Input
                    placeholder="e.g. Swallow whole, take with water..."
                    value={singleMedicineData.dosage || ""}
                    onChange={(e) =>
                      handleMedicineChange("dosage", e.target.value)
                    }
                    className="rounded-xl h-12 font-bold"
                  />
                </div>

                <Button
                  onClick={handleMedicineSubmit}
                  className="h-12 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                  variant={
                    editingMedicineIndex !== null ? "secondary" : "primary"
                  }
                >
                  <Icon
                    icon={
                      editingMedicineIndex !== null
                        ? "tabler:check"
                        : "tabler:plus"
                    }
                    className="text-lg"
                  />
                  <span className="font-bold">
                    {editingMedicineIndex !== null
                      ? "Update Item"
                      : "Add to Bundle"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Composition List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-800  uppercase tracking-widest text-xs flex items-center gap-2">
                  <Icon icon="tabler:list-details" className="text-blue-500" />
                  Template Composition List
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100  px-3 py-1">
                  {preloadedMedicinesData.length} Items Total
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/60  bg-white  shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50  text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 ">
                      <th className="px-6 py-4">Medication</th>
                      <th className="px-6 py-4 text-center">Dosage</th>
                      <th className="px-6 py-4 text-center">Days</th>
                      <th className="px-6 py-4">Instructions</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 ">
                    {preloadedMedicinesData.map((med, index) => (
                      <tr
                        key={index}
                        className="group hover:bg-slate-50/50 :bg-slate-800/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 ">
                              {med.medicine}
                            </span>
                            <span className="text-[10px] font-black text-blue-500 uppercase">
                              {med.af_bf}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-slate-100  rounded-lg text-xs font-black text-slate-600  tracking-wider">
                            {med.dosageM || 0}-{med.dosageA || 0}-
                            {med.dosageN || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-50  rounded-lg text-xs font-black text-blue-600  tracking-wider">
                            {med.days || 0} Days
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-medium">
                            {med.dosage || "No special instructions"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditMedicine(index)}
                              className="w-8 h-8 rounded-lg bg-blue-50  text-blue-600  flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Edit Medicine"
                            >
                              <Icon icon="tabler:edit" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedicine(index)}
                              className="w-8 h-8 rounded-lg bg-red-50  text-red-600  flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Remove Medicine"
                            >
                              <Icon icon="tabler:trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {preloadedMedicinesData.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                        >
                          No medications added to this bundle yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
                className="px-8 rounded-2xl h-12"
              >
                Discard Changes
              </Button>
              <Button
                onClick={summitData}
                className="px-10 rounded-2xl h-12 shadow-lg shadow-blue-500/25"
              >
                {editId ? "Update Template" : "Save Template Bundle"}
              </Button>
            </div>
          </div>
        </Modal>

        <style>{`
          .custom-modal .ant-modal-content {
            border-radius: 2.5rem;
            padding: 2.5rem;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .dark .custom-modal .ant-modal-content {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .custom-modal .ant-modal-header {
            background: transparent;
            border-bottom: none;
          }
        `}</style>
      </div>
    </StaggerContainer>
  );
}

export default PreloadPrescription;
