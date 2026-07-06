import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { message } from "antd";
import { useParams } from "react-router-dom";
import formatDateToDDMMYYYY from "../../utilities/formatter";

function Exercise() {
  const { patient_id } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [swaper, setSwaper] = useState(false);
  const [formData, setFormData] = useState({});
  const [category, setCategory] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState();
  const [patientExercises, setPatientExercises] = useState([]);

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;

  //   if (name === "exercise_cat") {
  //     getVideoDetails(value);
  //   }

  //   if (name === "name_of_exercise") {
  //     setSelectedVideo(videoData.find((item) => item.fileName === value));

  //     if (selectedVideo) {
  //       setFormData((prev) => ({
  //         ...prev,
  //         link: selectedVideo.filePath || "", // Store link if available
  //       }));
  //     }
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "exercise_cat") {
      getVideoDetails(value);
    }

    if (name === "name_of_exercise") {
      const selected = videoData.find((item) => item.fileName === value);
      setSelectedVideo(selected || null);

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        link: selected?.filePath || "", // Save link immediately
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetExerciseAssigned = async () => {
    try {
      const response = await AxiosInstance.get(
        `/exercise/get/${user.clinicId}/${patient_id}`
      );

      setPatientExercises(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getCategory = async () => {
    try {
      const response = await AxiosInstance.get("/exercise-store/get-category");
      setCategory(response.data.fileCatogery || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getVideoDetails = async (catName) => {
    try {
      const response = await AxiosInstance.get(
        `/exercise-store/get-video/${catName}`
      );

      setVideoData(response.data.exercise || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      clinicId: user.clinicId,
      patientId: patient_id,
    };
    try {
      const response = await AxiosInstance.post(`/exercise/add`, payload);
      message.success("Exercise added successfully");
      handleGetExerciseAssigned();
      setSwaper(false);
    } catch (error) {
      message.error("Failed to add exercise");
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await AxiosInstance.patch(
        `/exercise/edit/${formData?._id}`,
        formData
      );
      message.success("Exercise Updated Successfully");
      setSwaper(false);
      handleGetExerciseAssigned();
    } catch (error) {
      message.error("Exercise fail to Updated");
      console.error(error);
    }
  };

  const handleDelete = async (data) => {
    try {
      const response = await AxiosInstance.delete(
        `/exercise/delete/${data._id}`
      );
      message.success("Exercise Deleted Successfully");
      handleGetExerciseAssigned();
    } catch (error) {
      message.error("Exercise fail to Deleted");
      console.error(error);
    }
  };

  useEffect(() => {
    getCategory();
  }, []);

  useEffect(() => {
    handleGetExerciseAssigned();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <button
        className="flex flex-row w-fit gap-2 bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white duration-300 ease-in-out shadow p-2 rounded-md"
        onClick={() => {
          setSwaper((p) => !p);
          setFormData({});
        }}
      >
        <Icon
          icon="material-symbols:add-circle-outline-rounded"
          className={`${
            swaper ? "rotate-45" : "rotate-0"
          } transition-transform duration-300 ease-in-out`}
          width="24"
          height="24"
        />
        <h2 className="m-0 font-bold">
          {swaper ? "Show Exercise" : "Add Exercise"}
        </h2>
      </button>

      {!swaper ? (
        <div>
          {patientExercises.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full text-center">
                <thead className="">
                  <tr className="bg-gray-300">
                    <th className="p-2">S.No</th>
                    <th className="p-2">Name of Exercise</th>
                    <th className="p-2">Exercise Category</th>
                    <th className="p-2">Reps</th>
                    <th className="p-2">Sets</th>
                    <th className="p-2">No of Days</th>
                    <th className="p-2">End Date</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patientExercises.map((data, index) => (
                    <tr>
                      <td className="py-1">{index + 1}</td>
                      <td className="py-1">{data.name_of_exercise}</td>
                      <td className="py-1">{data.exercise_cat}</td>
                      <td className="py-1">{data.reps}</td>
                      <td className="py-1">{data.sets}</td>
                      <td className="py-1">{data.no_of_days}</td>
                      <td className="text-center">
                        {formatDateToDDMMYYYY(data.end_date) || "-"}
                      </td>
                      <td className="py-1">
                        <div className="w-full flex flex-row gap-2 items-center justify-center">
                          <a
                            href={data.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {" "}
                            <Icon
                              icon="streamline-kameleon-color:image-file"
                              width="30"
                              height="30"
                            />
                          </a>
                          <button
                            onClick={() => {
                              setFormData(data);
                              setSwaper(true);
                            }}
                            className="rounded-full bg-yellow-100  text-yellow-500"
                          >
                            <Icon
                              icon="material-symbols-light:edit-rounded"
                              width="30"
                              height="30"
                            />
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(data);
                            }}
                            className="rounded-full bg-red-100  text-red-500"
                          >
                            <Icon
                              icon="material-symbols-light:delete-rounded"
                              width="30"
                              height="30"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No exercise found for this patient.</p>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-fit grid grid-cols-2 gap-2">
            {[
              { label: "Categories", name: "exercise_cat" },
              { label: "Name of Exercise", name: "name_of_exercise" },
              { label: "Reps", name: "reps", type: "number" },
              { label: "Sets", name: "sets", type: "number" },
              { label: "No of Days", name: "no_of_days", type: "number" },
              { label: "End Date", name: "end_date", type: "date" },
              { label: "Payment", name: "payment", type: "number" },
            ].map((data, index) =>
              data.name === "exercise_cat" ? (
                <div key={data.name} className="flex w-full flex-col">
                  <label className="font-semibold">{data.label}</label>
                  <select
                    name={data.name}
                    value={formData?.[data.name] || ""}
                    onChange={handleInputChange}
                    className="h-10 rounded-md border p-2 bg-white outline-none"
                  >
                    <option value="">Select category</option>
                    {category.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              ) : data.name === "name_of_exercise" ? (
                <div key={data.name} className="flex w-full flex-col">
                  <label className="font-semibold">{data.label}</label>
                  <div className="flex flex-row w-full gap-3">
                    <select
                      name={data.name}
                      value={formData?.[data.name] || ""}
                      onChange={handleInputChange}
                      className="h-10 rounded-md border p-2 bg-white outline-none"
                    >
                      <option value="">Select exercise</option>
                      {videoData.map((item, idx) => (
                        <option key={idx} value={item.fileName}>
                          {item.fileName}
                        </option>
                      ))}
                    </select>
                    <button>
                      <a
                        href={selectedVideo?.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon
                          icon="streamline-kameleon-color:image-file"
                          width="40"
                          height="40"
                        />
                      </a>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={data.name} className="flex w-full flex-col">
                  <label className="font-bold">{data.label}</label>
                  <input
                    type={data.type || "text"}
                    name={data.name}
                    value={formData?.[data.name] || ""}
                    onChange={handleInputChange}
                    className="h-10 rounded-md border p-2 bg-white outline-none"
                  />
                </div>
              )
            )}
            <div className="h-full flex items-end">
              <button
                onClick={formData?._id ? handleUpdate : handleSubmit}
                className="w-full h-10 text-center bg-blue-500 text-white font-bold rounded-md"
              >
                {formData?._id ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exercise;
