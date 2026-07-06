import React, { useEffect, useState } from "react";
import {
  Calendar,
  Badge,
  Modal,
  Tabs,
  Tag,
  DatePicker,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  SolutionOutlined, // ✅ doctor/consultation
  TagsFilled, // ✅ category
} from "@ant-design/icons";

import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import Card from "../../../component/ui/Card";

dayjs.extend(isoWeek);

const AppointmentCalendar = ({ refresh }) => {
  const [dayAppointments, setDayAppointments] = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState([]);

  const [selectedDate, setSelectedDate] = useState(dayjs()); // today by default
  const [selectedWeek, setSelectedWeek] = useState(dayjs()); // current week by default
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);

  // ✅ Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Checked-in":
        return "blue";
      case "Engaged":
        return "purple";
      case "Completed":
        return "green";
      case "Cancelled":
        return "red";
      default:
        return "gold";
    }
  };

  const renderStatusTag = (status) => (
    <Tag color={getStatusColor(status)}>{status}</Tag>
  );

  // ✅ Group by doctor
  const groupByDoctor = (appts) =>
    appts.reduce((acc, appt) => {
      if (!acc[appt.doctor]) acc[appt.doctor] = [];
      acc[appt.doctor].push(appt);
      return acc;
    }, {});

  // ==================== API Calls ====================
  const getDayAppointments = async (date) => {
    try {
      const res = await AxiosInstance.get(`/appointments/date?date=${date}`);
      setDayAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getWeekAppointments = async (start, end) => {
    try {
      const res = await AxiosInstance.get(
        `/appointments/week?start=${start}&end=${end}`
      );
      setWeekAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getMonthAppointments = async (month) => {
    try {
      const res = await AxiosInstance.get(`/appointments/month?month=${month}`);
      setMonthAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== Effects ====================
  useEffect(() => {
    getDayAppointments(selectedDate.format("YYYY-MM-DD"));
  }, [selectedDate, refresh]);

  useEffect(() => {
    const start = selectedWeek.startOf("isoWeek").format("YYYY-MM-DD");
    const end = selectedWeek.endOf("isoWeek").format("YYYY-MM-DD");
    getWeekAppointments(start, end);
  }, [selectedWeek, refresh]);

  useEffect(() => {
    getMonthAppointments(selectedDate.format("YYYY-MM"));
  }, [selectedDate, refresh]);

  // ==================== Rendering ====================
  const dayAppointmentsByDoctor = groupByDoctor(dayAppointments);
  const weekAppointmentsByDoctor = groupByDoctor(weekAppointments);

  const dateCellRender = (value) => {
    const date = value.format("YYYY-MM-DD");
    const dayAppointments = monthAppointments.filter(
      (appt) => dayjs(appt.date).format("YYYY-MM-DD") === date
    );

    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {dayAppointments.map((appt, idx) => (
          <li key={idx}>
            <Tooltip title={`${appt.category} - ${appt.status}`}>
              <Badge
                color={getStatusColor(appt.status)}
                text={<span className="text-xs ">{`${appt.startTime} - ${appt.patientName}`}</span>}
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <Tabs defaultActiveKey="1" className="mb-4 ">
        {/* Day View */}
        <Tabs.TabPane tab="📅 Day" key="1">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="mb-0 text-lg font-semibold text-blue-600 ">
              Appointments on {selectedDate.format("DD MMM YYYY")}
            </h3>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              format="DD-MM-YYYY"
              className="  "
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2">
            {Object.keys(dayAppointmentsByDoctor).length > 0 ? (
              Object.keys(dayAppointmentsByDoctor).map((doctor, i) => (
                <Card
                  key={i}
                  title={
                    <span className="flex items-center">
                      <SolutionOutlined className="mr-2 text-blue-500" />
                      Dr. {doctor}
                    </span>
                  }
                  className="mb-4"
                >
                  {dayAppointmentsByDoctor[doctor].map((appt, idx) => (
                    <div
                      key={idx}
                      className="border-b border-slate-100  py-3 flex items-center justify-between last:border-0"
                    >
                      <div className="text-slate-700 ">
                        <ClockCircleOutlined className="mr-2 text-slate-400" />
                        <b className="text-slate-900 ">
                          {appt.startTime} - {appt.endTime}
                        </b>{" "}
                        | <UserOutlined className="text-slate-400" /> {appt.patientName} | <TagsFilled className="text-slate-400" />{" "}
                        {appt.category}
                      </div>
                      {renderStatusTag(appt.status)}
                    </div>
                  ))}
                </Card>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500  bg-slate-50  rounded-lg border border-dashed border-slate-300 ">
                No appointments on this date
              </div>
            )}
          </div>
        </Tabs.TabPane>

        {/* Week View */}
        <Tabs.TabPane tab="📆 Week" key="2">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="mb-0 text-lg font-semibold text-green-600 ">
              Week of {selectedWeek.startOf("isoWeek").format("DD MMM")} -{" "}
              {selectedWeek.endOf("isoWeek").format("DD MMM YYYY")}
            </h3>
            <DatePicker
              picker="week"
              value={selectedWeek}
              onChange={(date) => setSelectedWeek(date || dayjs())}
              format="WW-YYYY"
              className="  "
            />
          </div>

          {/* Scrollable container for all cards */}
          <div className="overflow-y-auto max-h-[600px] pr-2">
            {Object.keys(weekAppointmentsByDoctor).length > 0 ? (
              Object.keys(weekAppointmentsByDoctor).map((doctor, i) => (
                <Card
                  key={i}
                  title={
                    <span className="flex items-center">
                      <SolutionOutlined className="mr-2 text-green-500" />
                      Dr. {doctor}
                    </span>
                  }
                  className="mb-5"
                >
                  {[...Array(7)].map((_, j) => {
                    const day = selectedWeek.startOf("isoWeek").add(j, "day");
                    const dayAppts = weekAppointmentsByDoctor[doctor].filter(
                      (appt) =>
                        dayjs(appt.date).format("YYYY-MM-DD") ===
                        day.format("YYYY-MM-DD")
                    );

                    return (
                      <div key={j} className="mb-4 last:mb-0">
                        <h4 className="text-blue-600  font-semibold mb-2 border-b border-slate-100  pb-1">
                          {day.format("dddd, DD MMM")}
                        </h4>
                        {dayAppts.length > 0 ? (
                          dayAppts.map((appt, idx) => (
                            <div
                              key={idx}
                              className="py-2 flex justify-between items-center"
                            >
                              <div className="text-slate-700 ">
                                <ClockCircleOutlined className="mr-2 text-slate-400" />
                                <b className="text-slate-900 ">
                                  {appt.startTime} - {appt.endTime}
                                </b>{" "}
                                | <UserOutlined className="text-slate-400" /> {appt.patientName} |{" "}
                                <TagsFilled className="text-slate-400" /> {appt.category}
                              </div>
                              {renderStatusTag(appt.status)}
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-sm italic py-1">No appointments</p>
                        )}
                      </div>
                    );
                  })}
                </Card>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500  bg-slate-50  rounded-lg border border-dashed border-slate-300 ">
                No appointments this week
              </div>
            )}
          </div>
        </Tabs.TabPane>

        {/* Month View */}
        <Tabs.TabPane tab="🗓️ Month" key="3">
          <div className="  rounded-xl">
            <Calendar
              fullscreen={true}
              dateCellRender={dateCellRender}
              onSelect={(value) => {
                setSelectedDate(value);
                const dayAppts = monthAppointments.filter(
                  (appt) =>
                    dayjs(appt.date).format("YYYY-MM-DD") ===
                    value.format("YYYY-MM-DD")
                );
                setSelectedDateAppointments(dayAppts);
                setIsModalOpen(true);
              }}
              className="   custom-calendar"
            />
          </div>
        </Tabs.TabPane>
      </Tabs>

      {/* Modal for month day click */}
      <Modal
        title={<span className="text-slate-800 ">{`Appointments on ${selectedDate.format("DD MMM YYYY")}`}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="dark-modal"
      >
        <div className="py-2">
          {selectedDateAppointments.length > 0 ? (
            selectedDateAppointments.map((appt, idx) => (
              <div
                key={idx}
                className="p-3 border-b border-slate-100  flex justify-between items-center last:border-0"
              >
                <div className="text-slate-700 ">
                  <ClockCircleOutlined className="mr-2 text-slate-400" />
                  <b className="text-slate-900 ">
                    {appt.startTime} - {appt.endTime}
                  </b>{" "}
                  | <UserOutlined className="text-slate-400" /> {appt.patientName} | <TagsFilled className="text-slate-400" />{" "}
                  {appt.category}
                </div>
                {renderStatusTag(appt.status)}
              </div>
            ))
          ) : (
            <p className="text-slate-500  text-center py-4">No appointments on this date</p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AppointmentCalendar;
