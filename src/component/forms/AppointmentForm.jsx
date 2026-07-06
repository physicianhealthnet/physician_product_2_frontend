import React, { useEffect, useState } from "react";
import { message, TimePicker } from "antd";
import moment from "moment";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

const doctors = ["Dr. Ramesh Babu", "Dr.Abirami", "Dr.Saranya"];

const AppointmentForm = ({ handleCancel, getAppointment, editData }) => {
  const userInfo = JSON.parse(sessionStorage.getItem("user"));
  const [userId, setUserId] = useState("");
  const [iconChanger, setIconChanger] = useState(false);
  const initialFormData = {
    ap_vname: "",
    ap_taddress: "",
    ap_status_type: "",
    ap_vphone: "",
    ap_viaptime: "",
    ap_tcomplaints: "",
    ap_japfor: "",
    ap_vscheduled: userInfo?.u_vName || "",
    ap_vdate: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // Populate form data if editData exists
  useEffect(() => {
    if (editData) {
      setFormData((prev) => ({
        ...prev,
        ...editData,
        ap_viaptime: editData.ap_viaptime,
        ap_vdate: formattedDate(editData.ap_vdate),
      }));
    }
  }, [editData]);

  // Handle input, textarea, and select changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === "ap_vphone") {
      // Ensure +91 is always present
      if (!newValue.startsWith("+91")) {
        newValue = "+91" + newValue.replace(/^\+91/, ""); // Avoid duplicate +91
      }
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  // Handle time picker changes
  const handleTimeChange = (time, timeString) => {
    setFormData({
      ...formData,
      ap_viaptime: timeString,
    });
  };

  // Handle date input changes
  const handleDateChange = (e) => {
    setFormData({
      ...formData,
      ap_vdate: e.target.value,
    });
  };

  // Date Formatting functions
  function formattedDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }
  async function getUserId() {
    try {
      const response = await AxiosInstance.post("/user/get-user-by-id", {
        u_vName: formData.ap_japfor,
      });
      setUserId(response.data.response?.u_vid || "");
    } catch (error) {
      console.error(error);
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ap_vclinicid: userInfo?.u_vClinicId,
      ap_vid: formData?.ap_vid,
      ap_vname: formData?.ap_vname,
      ap_status_type: formData?.ap_status_type,
      ap_vphone: formData?.ap_vphone,
      ap_taddress: formData?.ap_taddress,
      ap_viaptime: formData?.ap_viaptime,
      ap_japfor: formData?.ap_japfor,
      ap_tcomplaints: formData?.ap_tcomplaints,
      ap_vscheduled: formData?.ap_vscheduled,
      ap_vdate: formattedDate(formData?.ap_vdate),
    };

    try {
      const url = editData
        ? `/appointment/edit-appointment/${editData.ap_vid}`
        : "/appointment/add-appointment";

      const method = editData ? "patch" : "post";

      const response = await AxiosInstance[method](
        url,
        method === "patch"
          ? payload
          : {
            ap_vclinicid: userInfo?.u_vClinicId,
            ap_vuserid: userId,
            ...formData,
          }
      );

      if (
        response.data.status === 201 ||
        response.data.status === 200 ||
        response.data.message === "Appointment updated successfully"
      ) {
        message.success(response.data.message || "Operation successful");
        getAppointment();
        handleCancel();
      } else {
        message.error(
          response.data.message ===
            "The employee is on leave for the selected date"
            ? `${formData?.ap_japfor} is on leave for the selected date`
            : response.data.message || "Please try again later."
        );
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMobileNumber = async (e) => {
    try {
      const response = await AxiosInstance.get(
        `patient/get-patient-by-phone/${formData?.ap_vphone}`
      );
      if (response.data.status === 404) {
        setIconChanger(true);
        message.error(response.data.message);
      } else {
        setIconChanger(false);

        setFormData({
          ...formData,
          ap_vclinicid: response.data.response.p_vclinicid,
          ap_vname: response.data.response.p_vName,
          ap_vphone: response.data.response.p_vPhone,
          ap_taddress: response.data.response.p_tAddress,
          ap_status_type: response.data.response.cs_status_type,
          ap_vdate:
            formData?.ap_vdate ||
            formattedDate(new Date().toISOString().split("T")[0]),
        });
        message.success(response.data.message);
      }
    } catch (error) {
      console.error(error);
      setIconChanger(true);
    }
  };

  const handleCancelClick = () => {
    setFormData(initialFormData);
    setIconChanger(false);
    handleCancel();
  };

  useEffect(() => {
    getUserId();
  }, [formData.ap_japfor]);

  return (
    <div className="mt-5">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 ">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="Patient Name"
              type="text"
              name="ap_vname"
              value={formData.ap_vname}
              onChange={handleChange}
              placeholder="Enter patient name"
              required
            />
          </div>

          <div className="flex-1 relative">
            <label className="text-sm font-medium text-slate-700  mb-1.5 block">
              Mobile Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="ap_vphone"
                value={formData.ap_vphone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900  transition-all"
                required
              />
              <button
                type="button"
                className="p-2 bg-slate-100  rounded-lg border border-slate-200  hover:bg-slate-200 :bg-slate-700 transition-colors"
                onClick={!iconChanger ? handleCheckMobileNumber : () => {
                  setFormData({ ...formData, ap_vphone: "" });
                  setIconChanger(false);
                }}
              >
                <Icon
                  icon={!iconChanger ? "tabler:circle-dashed-check" : "tabler:refresh"}
                  width="20"
                  height="20"
                  className="text-slate-600 "
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <Textarea
            label="Address"
            name="ap_taddress"
            value={formData.ap_taddress}
            onChange={handleChange}
            placeholder="Detailed address"
            required
            rows={2}
          />
        </div>

        {formData.ap_status_type ? (
          <Textarea
            label="Status Type"
            name="ap_status_type"
            value={formData.ap_status_type}
            onChange={handleChange}
            required
            rows={1}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 ">
              Status Type
            </label>
            <select
              name="ap_status_type"
              value={formData.ap_status_type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 "
              required
            >
              <option value="">Select Status</option>
              <option value="O">O</option>
              <option value="N">N</option>
              <option value="O/N">O/N</option>
            </select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row-reverse gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700  mb-1.5 block">
              Appointment Time
            </label>
            <TimePicker
              value={
                formData.ap_viaptime
                  ? moment(formData.ap_viaptime, "hh:mm A")
                  : null
              }
              onChange={handleTimeChange}
              format="hh:mm A"
              className="w-full"
              required
            />
          </div>

          <div className="flex-1">
            <Input
              label="Appointment Date"
              name="ap_vdate"
              type="date"
              value={formData.ap_vdate || new Date().toISOString().split("T")[0]}
              onChange={handleDateChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700  mb-1.5 block">
            Appointment For
          </label>
          <select
            name="ap_japfor"
            value={formData.ap_japfor}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 "
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((doctor, index) => (
              <option key={index} value={doctor}>
                {doctor}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Chief Complaints"
            name="ap_tcomplaints"
            value={formData.ap_tcomplaints}
            onChange={handleChange}
            placeholder="Primary complaint"
            required
          />
        </div>

        <div>
          <Input
            label="Scheduled By"
            name="ap_vscheduled"
            value={formData.ap_vscheduled}
            disabled
            className="cursor-not-allowed bg-slate-100 "
            required
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancelClick}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {editData ? "Update Appointment" : "Book Appointment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
