import React, { useState, useEffect } from "react";
import { Modal, message } from "antd";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { LeftOutlined, RightOutlined } from "@ant-design/icons"; // Import icons
import Input from "../ui/Input";
import Button from "../ui/Button";
import { TableSkeleton } from "../ui/Skeleton";

const ClinicTable = () => {
  const [formData, setFormData] = useState({
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicLocation: "",
    clinicDescription: "",
  });

  const [clinicData, setClinicData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(clinicData.length / pageSize)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const columns = [
    "Name",
    "Clinic ID",
    "Phone",
    "Email",
    "Address",
    // "Clinic Description",
  ];

  const clinicRegister = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);

      const response = await AxiosInstance.post("/clinic/add", formData);

      if (response.status === 201) {
        message.success(response.data.message || "Clinic added successfully!");
        setFormData({
          clinicName: "",
          clinicPhone: "",
          clinicEmail: "",
          clinicLocation: "",
          clinicDescription: "",
        });
        setIsModalOpen(false);
        getClinicData();
      } else {
        message.error(response.data.message || "Failed to add clinic!");
      }
    } catch (error) {
      message.error("An error occurred while adding the clinic.");
    } finally {
      setLoading(false);
    }
  };

  const getClinicData = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/clinic/all");

      setClinicData(response.data.clinic || []);
    } catch (error) {
      console.error("An error occurred while fetching clinic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getClinicData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get paginated data
  const paginatedData = clinicData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-slate-800  text-3xl">Clinic List</h1>
        {/* Hidden but kept just in case, translated logic */}
        <div className="hidden">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Clinic
          </Button>
        </div>
      </div>

      <Modal
        title={<span className="text-slate-900 ">Add Clinic</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="dark-modal"
      >
        <form onSubmit={clinicRegister} className="flex flex-col gap-4 py-4">
          <Input
            label="Name"
            name="clinicName"
            value={formData.clinicName}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Phone"
            name="clinicPhone"
            value={formData.clinicPhone}
            onChange={handleInputChange}
          />
          <Input
            label="Email"
            name="clinicEmail"
            value={formData.clinicEmail}
            onChange={handleInputChange}
          />
          <Input
            label="Address"
            name="clinicLocation"
            value={formData.clinicLocation}
            onChange={handleInputChange}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>

      <div className="overflow-x-auto border border-slate-200  rounded-xl shadow-sm bg-white ">
        <table className="min-w-full text-nowrap text-left">
          <thead>
            <tr className="bg-slate-100  text-slate-600  text-sm uppercase tracking-wider font-semibold">
              <th className="px-6 py-4">SNo</th>{" "}
              {/* Serial Number Column */}
              {columns.map((col) => (
                <th key={col} className="px-6 py-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 ">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-0">
                  <TableSkeleton rows={8} />
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 :bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500  font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>{" "}
                  {/* Serial Number */}
                  <td className="px-6 py-4 text-slate-800  font-medium">{row.clinicName}</td>
                  <td className="px-6 py-4 text-slate-600  font-mono text-sm bg-slate-50  rounded">{row.clinicId}</td>
                  <td className="px-6 py-4 text-slate-600 ">{row.clinicPhone}</td>
                  <td className="px-6 py-4 text-slate-600 ">{row.clinicEmail}</td>
                  <td className="px-6 py-4 text-slate-600  max-w-xs truncate" title={row.clinicLocation}>{row.clinicLocation}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-6 py-12 text-center text-slate-500 "
                >
                  No clinic data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Buttons */}
      <div className="mt-6 flex justify-between items-center px-2">
        <Button
          variant="secondary"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <LeftOutlined /> Previous
        </Button>
        <span className="text-slate-600  font-medium">
          Page {currentPage} of {Math.max(1, Math.ceil(clinicData.length / pageSize))}
        </span>
        <Button
          variant="secondary"
          onClick={handleNextPage}
          disabled={currentPage >= Math.ceil(clinicData.length / pageSize)}
        >
          Next <RightOutlined />
        </Button>
      </div>
    </div>
  );
};

export default ClinicTable;
