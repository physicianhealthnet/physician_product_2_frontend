import React, { useEffect, useState } from "react";
import { Modal, TimePicker, message, Select, AutoComplete } from "antd";
import dayjs from "dayjs";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import Input from "../../../component/ui/Input";
import Button from "../../../component/ui/Button";

const { Option } = Select;

const doctors = [
  { username: "nirmal", color: "green" },
  { username: "praveen", color: "pink" },
  { username: "raja", color: "blue" },
  { username: "Nirmal", color: "green" },
  { username: "Praveen", color: "pink" },
  { username: "Raja", color: "blue" },
];

const categories = ["Consultation", "Treatment", "Rehab Training"];

const BookAppointment = ({
  visible,
  setVisible,
  onBooked,
  clinicId,
  setStateChange,
}) => {
  const initialData = {
    patientName: "",
    patient: "", // 🆕 holds the _id of patient
    patientId: "",
    patientAadhar: "",
    phoneNumber: "",
    doctor: "",
    category: "",
    date: "",
    startTime: "",
    clinicId: "",
    doctorId: "",
  };

  const [formData, setFormData] = useState(initialData);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  const user = JSON.parse(
    sessionStorage.getItem("user") || sessionStorage.getItem("master"),
  );

  const getDoctors = async () => {
    try {
      const response = await AxiosInstance.get(
        `/user/get-doctor?clinicId=${user?.clinicId}`,
      );
      setAllDoctors(response.data.users);
    } catch (error) {}
  };
  useEffect(() => {
    getDoctors();
  }, []);
  // 🔍 Search patients
  const handleSearch = async (value) => {
    if (!value) return;
    try {
      setSearchLoading(true);
      const res = await AxiosInstance.get(
        `/appointments/search?query=${value}`,
      );

      if (res.data?.patients) {
        setSearchResults(
          res.data.patients.map((p) => ({
            value: p.patientName,
            label: (
              <div className="flex flex-col p-1 border-b border-slate-100  last:border-0 hover:bg-slate-50 :bg-slate-800 transition-colors rounded">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800 ">
                  <UserOutlined className="text-blue-500" />
                  {p.patientName}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 ">
                  <PhoneOutlined className="text-green-500" />
                  {p.patientPhone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 ">
                  <MailOutlined className="text-red-500" />
                  {p.patientEmail || "—"}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 ">
                  <IdcardOutlined className="text-purple-500" />
                  ID: {p.patientId}
                </div>
              </div>
            ),
            data: p,
          })),
        );
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // 📝 Autofill patient details
  const handleSelectPatient = (value, option) => {
    const p = option.data;

    setFormData((prev) => ({
      ...prev,
      patientName: p.patientName,
      patient: p._id, // 🆕 store patient ObjectId
      patientAadhar: p.patientAadhar || "",
      phoneNumber: p.patientPhone,
      patientId: p.patientId || "",
    }));

    message.success("Patient details loaded");
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      clinicId: user?.clinicId || "",
      doctorId: user._id,
    }));
  }, [visible]);

  const handleChange = (e) => {
    const { name, value } = e.target || e;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (time, timeString, name) => {
    setFormData((prev) => ({ ...prev, [name]: timeString }));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      "patientName",
      "phoneNumber",
      "doctor",
      "category",
      "date",
      "startTime",
      "clinicId",
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        message.error("Please fill all required fields");
        return;
      }
    }

    try {
      await AxiosInstance.post("/appointments/", formData);

      message.success("Appointment booked successfully");
      setFormData(initialData);
      setVisible(false);
      onBooked();
      setStateChange((prev) => (prev === null ? true : !prev));
    } catch (err) {
      console.error(err);
      message.error("Booking failed");
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-bold text-slate-800 ">
          Book Appointment
        </span>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button
          key="cancel"
          variant="secondary"
          onClick={() => setVisible(false)}
          className="mr-2"
        >
          Cancel
        </Button>,
        <Button key="submit" onClick={handleSubmit}>
          Book Appointment
        </Button>,
      ]}
      width={800}
      centered
      className="rounded-sm overflow-hidden shadow-md"
      styles={{
        mask: { backdropFilter: "blur(4px)" },
        content: { padding: "24px", borderRadius: "4px" },
        header: { marginBottom: "20px", borderBottom: "1px solid #e2e8f0" },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-slate-700 ">
        {/* 🔍 Patient Search */}
        <div className="col-span-1 md:col-span-2 space-y-2 bg-white p-4 rounded-sm border border-slate-200">
          <label className="text-sm font-semibold text-slate-700 block mb-1">
            Search Patient
          </label>
          <AutoComplete
            style={{ width: "100%" }}
            options={searchResults}
            onSearch={handleSearch}
            onSelect={handleSelectPatient}
            placeholder="🔍 Search by Name / Phone / Email / Patient ID"
            allowClear
            loading={searchLoading}
            className="w-full h-11"
            popupClassName="rounded-sm shadow-md"
          />
          <p className="text-xs text-slate-500  italic">
            Quickly find existing patient records or fill manually below.
          </p>
        </div>

        <div className="col-span-1 md:col-span-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 "></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Appointment Details
          </span>
          <div className="h-px flex-1 bg-slate-200 "></div>
        </div>

        <div>
          <Input
            label="Patient Name"
            placeholder="Enter patient name"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            label="Phone Number"
            placeholder="Enter phone number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            label="Aadhaar Number"
            placeholder="Enter Aadhaar (Optional)"
            name="patientAadhar"
            value={formData.patientAadhar}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700  mb-1.5 block">
            Select Doctor
          </label>
          <Select
            placeholder="Select Doctor"
            value={formData.doctor}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, doctor: val }))
            }
            className="w-full h-10 rounded-sm"
            popupClassName="rounded-sm"
          >
            {allDoctors.map((d) => (
              <Option key={d._id} value={d.userName} className="">
                {d.userName}
              </Option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700  mb-1.5 block">
            Select Category
          </label>
          <Select
            placeholder="Select Category"
            value={formData.category}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, category: val }))
            }
            className="w-full h-10 rounded-sm"
            popupClassName="rounded-sm"
          >
            {categories.map((cat) => (
              <Option key={cat} value={cat} className="">
                {cat}
              </Option>
            ))}
          </Select>
        </div>
        <div>
          <Input
            type="date"
            label="Appointment Date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700  mb-1.5 block">
            Appointment Time
          </label>
          <TimePicker
            format="hh:mm A"
            use12Hours
            value={
              formData.startTime ? dayjs(formData.startTime, "hh:mm A") : null
            }
            onChange={(time, timeString) =>
              handleTimeChange(time, timeString, "startTime")
            }
            className="w-full h-11 border border-slate-300 rounded-sm bg-white text-slate-900 focus:border-blue-500 transition-all font-medium"
            popupClassName=" "
          />
        </div>
      </div>
    </Modal>
  );
};

export default BookAppointment;
