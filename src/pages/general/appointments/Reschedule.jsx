import React, { useState } from "react";
import { Modal, DatePicker, TimePicker, Input, Button, message } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  TagsFilled,
  SolutionOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { AxiosInstance } from "../../../utilities/AxiosInstance";

const Reschedule = ({ appt, visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [reason, setReason] = useState("");

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      return message.error("Please select both new date and time!");
    }

    try {
      setLoading(true);
      const res = await AxiosInstance.put(
        `/appointments/reschedule/${appt._id}`,
        {
          previousDate: appt.date,
          previousTime: appt.startTime,
          newDate: newDate.format("YYYY-MM-DD"), // send backend in YYYY-MM-DD
          newTime: newTime.format("hh:mm A"),
          rescheduledBy: "PT",
          reason,
        }
      );

      if (res.data.success) {
        message.success("Appointment rescheduled successfully!");
        onSuccess();
        setNewDate(null);
        setNewTime(null);
        setReason("");
        onClose();
      } else {
        message.error("Failed to reschedule. Please try again.");
      }
    } catch (err) {
      console.error(err);
      message.error("Server error while rescheduling");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="flex items-center gap-2 text-lg font-semibold">
          <EditOutlined /> Reschedule Appointment
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="flex flex-col gap-4">
        {/* Appointment Details */}
        <div className="p-4 border rounded-md bg-gray-50 flex flex-col gap-2">
          <p>
            <UserOutlined className="text-green-500 mr-2" />
            <strong>Patient:</strong> {appt?.patientName}
          </p>
          <p>
            <IdcardOutlined className="text-purple-500 mr-2" />
            <strong>Aadhaar:</strong> {appt?.aadhaarNumber || "-"}
          </p>
          <p>
            <PhoneOutlined className="text-blue-500 mr-2" />
            <strong>Phone:</strong> {appt?.phoneNumber}
          </p>
          <p>
            <SolutionOutlined className="text-pink-500 mr-2" />
            <strong>Doctor:</strong> {appt?.doctor}
          </p>
          <p>
            <TagsFilled className="text-orange-500 mr-2" />
            <strong>Category:</strong> {appt?.category}
          </p>
          <p>
            <CalendarOutlined className="text-blue-500 mr-2" />
            <strong>Date:</strong> {dayjs(appt?.date).format("DD-MM-YYYY")}
          </p>
          <p>
            <ClockCircleOutlined className="text-purple-500 mr-2" />
            <strong>Time:</strong> {appt?.startTime}
          </p>
          <p>
            <strong>Status:</strong> {appt?.status}
          </p>
        </div>

        {/* New Date */}
        <DatePicker
          className="w-full"
          placeholder="Select New Date"
          format="DD-MM-YYYY"
          suffixIcon={<CalendarOutlined />}
          onChange={(date) => setNewDate(date)}
        />

        {/* New Time */}
        <TimePicker
          className="w-full"
          placeholder="Select New Time"
          format="hh:mm A"
          use12Hours
          suffixIcon={<ClockCircleOutlined />}
          onChange={(time) => setNewTime(time)}
        />

        {/* Reason */}
        <Input.TextArea
          rows={3}
          placeholder="Reason for rescheduling (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleReschedule}>
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Reschedule;
