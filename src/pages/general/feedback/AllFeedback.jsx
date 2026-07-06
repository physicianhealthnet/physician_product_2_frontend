import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import {
  Rate,
  Modal,
  Descriptions,
  Select,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Icon } from "@iconify/react/dist/iconify.js";
import Card from "../../../component/ui/Card";
import Input from "../../../component/ui/Input";
import { CardSkeleton } from "../../../component/ui/Skeleton";

const { RangePicker } = DatePicker;

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

function AllFeedback() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [minRating, setMinRating] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  const handleGetAllFeedbacks = async () => {
    try {
      setLoading(true);
      if (user) {
        const response = await AxiosInstance.get(
          `/feedback/get-all/${user.clinicId}`
        );
        setAllFeedbacks(response.data.data || []);
        setFilteredFeedbacks(response.data.data || []);
      } else {
        const response = await AxiosInstance.get(`/feedback/master/get-all`);

        setAllFeedbacks(response.data.data || []);
        setFilteredFeedbacks(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetAllFeedbacks();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allFeedbacks];

    if (searchName) {
      filtered = filtered.filter((f) =>
        f.patientName?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (minRating) {
      filtered = filtered.filter(
        (f) => (f.overallExperience || 0) >= minRating
      );
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((f) => {
        const created = dayjs(f.createdAt);
        return (
          created.isAfter(dateRange[0].startOf("day")) &&
          created.isBefore(dateRange[1].endOf("day"))
        );
      });
    }

    setFilteredFeedbacks(filtered);
  }, [searchName, minRating, dateRange, allFeedbacks]);

  const handleCardClick = (feedback) => {
    setSelectedFeedback(feedback);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedFeedback(null);
  };

  // Analytics
  const avgRating =
    filteredFeedbacks.reduce((sum, f) => sum + (f.overallExperience || 0), 0) /
    (filteredFeedbacks.length || 1);

  const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}⭐`,
    count: filteredFeedbacks.filter((f) => f.overallExperience === r).length,
  }));

  return (
    <>
      <StaggerContainer>
        <div className="flex flex-col gap-8 pb-8">
          {/* Modern Header */}
          <StaggerItem>
            <div className="flex flex-col gap-1">
              <h1 className="font-black text-slate-800  text-4xl tracking-tight">
                Patient <span className="text-blue-500">Feedback</span>
              </h1>
              <p className="text-slate-500  font-medium">
                Monitor patient satisfaction and ratings
              </p>
            </div>
          </StaggerItem>

          {/* Filters */}
          <StaggerItem>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <Input
                  placeholder="Search by patient name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>

              <div className="relative">
                <Icon icon="tabler:star" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Select
                  placeholder="Min Rating"
                  value={minRating}
                  onChange={setMinRating}
                  allowClear
                  className="w-40"
                  style={{
                    borderRadius: '0.75rem',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Select.Option key={r} value={r}>
                      {r} ⭐ & up
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <RangePicker
                onChange={setDateRange}
                format="DD/MM/YYYY"
                className="rounded-xl"
              />
            </div>
          </StaggerItem>

          {/* Analytics KPI Cards */}
          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md border-slate-200/60 ">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 bg-blue-500" />
                <div className="p-6 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Icon icon="tabler:message-star" className="text-2xl text-blue-600 " />
                    </div>
                    <Icon icon="tabler:trending-up" className="text-blue-500/40 text-xl" />
                  </div>
                  <p className="text-xs font-black text-slate-400  uppercase tracking-widest mb-1">Total Feedbacks</p>
                  <h2 className="text-3xl font-black text-slate-800 ">{filteredFeedbacks.length}</h2>
                </div>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md border-slate-200/60 ">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 bg-amber-500" />
                <div className="p-6 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Icon icon="tabler:star-filled" className="text-2xl text-amber-600 " />
                    </div>
                    <Icon icon="tabler:chart-line" className="text-amber-500/40 text-xl" />
                  </div>
                  <p className="text-xs font-black text-slate-400  uppercase tracking-widest mb-1">Average Rating</p>
                  <h2 className="text-3xl font-black text-slate-800 ">
                    {avgRating.toFixed(1)} <span className="text-lg font-semibold text-slate-500">/ 5</span>
                  </h2>
                </div>
              </Card>
            </div>
          </StaggerItem>

          {/* Rating Distribution Chart */}
          <StaggerItem>
            <Card className="group relative overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60 ">
              <div className="p-6 z-10">
                <h3 className="text-lg font-black text-slate-800  mb-4">Rating Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ratingDistribution}>
                    <XAxis dataKey="rating" stroke="#64748b" />
                    <YAxis allowDecimals={false} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </StaggerItem>

          {/* Feedback Cards */}
          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
              ) : filteredFeedbacks.length > 0 ? (
                filteredFeedbacks
                  .slice()
                  .reverse()
                  .map((data) => (
                    <Card
                      key={data._id || data.patientId}
                      className="group cursor-pointer bg-white/40  backdrop-blur-md border-slate-200/60  hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                      onClick={() => handleCardClick(data)}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800  text-sm truncate">
                              {data.patientName || "Unknown"}
                            </p>
                            <span className="text-xs font-semibold text-blue-600 ">
                              {data.patientId || "N/A"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                            {data.createdAt
                              ? dayjs(data.createdAt).format("DD MMM, YY")
                              : "-"}
                          </span>
                        </div>

                        <div className="mb-3">
                          <Rate disabled value={data.overallExperience || 0} className="text-sm" />
                        </div>

                        <p className="text-sm text-slate-600  line-clamp-3">
                          {data.remarks || "No remarks provided"}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-200  flex items-center gap-2 text-blue-600  font-semibold text-xs">
                          <Icon icon="tabler:eye" className="text-base" />
                          View Details
                        </div>
                      </div>
                    </Card>
                  ))
              ) : (
                <div className="col-span-full">
                  <Card className="p-12 text-center bg-white/40  backdrop-blur-md border-slate-200/60 ">
                    <div className="flex flex-col items-center gap-3">
                      <Icon icon="tabler:message-off" className="text-6xl text-slate-300 " />
                      <p className="text-slate-500  font-semibold">No feedback found</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Icon icon="tabler:user" className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="font-black text-slate-800 m-0">
                {selectedFeedback?.patientName || ""}
              </p>
              <p className="text-xs text-slate-500 m-0">
                {selectedFeedback?.patientId || ""}
              </p>
            </div>
          </div>
        }
        open={modalVisible}
        footer={null}
        onCancel={handleCloseModal}
        centered
        width={600}
        style={{ maxHeight: "80vh" }}
        styles={{
          body: {
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "16px 24px",
          },
        }}
      >
        {selectedFeedback && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Date">
              {dayjs(selectedFeedback.createdAt).format("DD MMM YYYY, HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Age & Gender">
              {selectedFeedback.patientAge || "-"} /{" "}
              {selectedFeedback.patientGender || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Experience">
              <Rate disabled value={selectedFeedback.overallExperience || 0} />
            </Descriptions.Item>
            <Descriptions.Item label="Appointment Ease">
              <Rate disabled value={selectedFeedback.appointmentEase || 0} />
            </Descriptions.Item>
            <Descriptions.Item label="Cleanliness Comfort">
              <Rate disabled value={selectedFeedback.cleanlinessComfort || 0} />
            </Descriptions.Item>
            <Descriptions.Item label="Remarks">
              {selectedFeedback.remarks || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Improvement">
              {selectedFeedback.improvementAfterTreatment || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Pain Addressed">
              {selectedFeedback.painAddressedEffectively || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Our Team">
              {selectedFeedback.politeAndProfessional || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Recommend?">
              {selectedFeedback.recommendClinic || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Waiting Time">
              {selectedFeedback.waitingTimeSatisfaction || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Treatment Explanation">
              {selectedFeedback.treatmentExplainedClearly || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

export default AllFeedback;
