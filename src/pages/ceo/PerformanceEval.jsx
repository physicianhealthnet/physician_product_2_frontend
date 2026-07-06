import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { FaUserMd, FaUserNurse } from "react-icons/fa";
import { MdPerson } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";
import { Modal, Button, message } from "antd";

const PerformanceEval = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPerformanceEvalByUser = async () => {
    try {
      const response = await AxiosInstance.get(
        "/treatment/get-assdoneby-count"
      );
      setUsers(response.data.response || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPerformanceEvalByUser();
  }, []);

  const getIcon = (role) => {
    if (role === "senior-doctor") {
      return <FaUserMd size={30} />;
    } else if (role === "junior-doctor") {
      return <FaUserNurse size={30} />;
    } else {
      return <MdPerson size={30} />;
    }
  };

  const getIconBgColor = (role) => {
    if (role === "senior-doctor") return "bg-green-100 text-green-500";
    if (role === "junior-doctor") return "bg-yellow-100 text-yellow-500";
    return "bg-gray-100 text-gray-500";
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    // logic infuture to implement
    setIsModalOpen(false);
    message.success("Warm wishes sent successfully!");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-[--navbar-bg-color]">
          Staff Performance Insights
        </h1>

        {/* Share Button */}
        <div
          className="bg-gradient-to-r from-green-400 to-green-600 p-3 rounded-full text-white hover:from-green-500 hover:to-green-700 cursor-pointer duration-300 flex items-center gap-3 shadow-lg transform hover:scale-105 transition"
          onClick={handleOpenModal}
        >
          <i className="text-xl">
            <BsWhatsapp />
          </i>
          <button className="font-medium tracking-wide">
            Share Warm Wishes
          </button>
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, index) => (
          <div
            key={index}
            className="bg-[#F9FAFB] shadow-lg rounded-2xl p-4 flex items-center gap-4 transition-transform transform hover:scale-105"
          >
            <div
              className={`${getIconBgColor(
                user.tp_vassdonebyrole
              )} p-4 rounded-full`}
            >
              {getIcon(user.tp_vassdonebyrole)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user.tp_vreassdoneby}
              </h2>
              {user.tp_vassdonebyrole && (
                <p className="text-gray-600">
                  Role:{" "}
                  <span className="capitalize font-medium text-red-500">
                    {user.tp_vassdonebyrole?.replace("-", " ")}
                  </span>
                </p>
              )}
              <p className="text-gray-600">
                Patients Handled:{" "}
                <span className="font-medium bg-violet-100 px-2 py-1 rounded-lg border-2 border-violet-500">
                  {user.patient_count}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="Confirmation"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText="Yes, Confirm"
        cancelText="Cancel"
        centered
      >
        <select class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-base focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Select a festival or day</option>

          <optgroup label="Tamil Nadu Festivals">
            <option value="pongal">Pongal</option>
            <option value="diwali">Diwali</option>
            {/* <option value="navaratri">Navaratri</option> */}
            {/* <option value="thaipusam">Thaipusam</option> */}
            <option value="tamil_new_year">Tamil New Year</option>
            <option value="vinayagar_chaturthi">Vinayagar Chaturthi</option>
            {/* <option value="aadi_perukku">Aadi Perukku</option> */}
            {/* <option value="karthigai_deepam">Karthigai Deepam</option> */}
            {/* <option value="vaikunta_ekadasi">Vaikunta Ekadasi</option> */}
            {/* <option value="mahashivaratri">Maha Shivaratri</option> */}
          </optgroup>

          <optgroup label="Other Indian Festivals">
            <option value="holi">Holi</option>
            {/* <option value="raksha_bandhan">Raksha Bandhan</option> */}
            {/* <option value="janmashtami">Janmashtami</option> */}
            {/* <option value="gurpurab">Gurpurab</option> */}
            {/* <option value="lohri">Lohri</option> */}
            {/* <option value="makar_sankranti">Makar Sankranti</option> */}
            <option value="onam">Onam</option>
            {/* <option value="baisakhi">Baisakhi</option> */}
          </optgroup>

          <optgroup label="International Festivals">
            <option value="christmas">Christmas</option>
            <option value="new_year">New Year</option>
            <option value="eid">Eid</option>
            <option value="easter">Easter</option>
            {/* <option value="halloween">Halloween</option> */}
          </optgroup>

          <optgroup label="Special Days">
            <option value="womens_day">Women's Day</option>
            <option value="may_day">Labour Day</option>
            <option value="independence_day">Independence Day</option>
            <option value="republic_day">Republic Day </option>
            <option value="teachers_day">Teacher's Day</option>
            <option value="childrens_day">Children's Day</option>
          </optgroup>
        </select>
      </Modal>
    </div>
  );
};

export default PerformanceEval;
