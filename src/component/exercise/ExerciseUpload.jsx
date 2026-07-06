import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { message } from "antd";

function ExerciseUpload() {
  const [formData, setFormData] = useState({
    fileCatogery: "",
    fileName: "",
    file: null,
  });
  const [category, setCategory] = useState([]);

  // Handle text/select changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file change
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const getCategory = async () => {
    try {
      const response = await AxiosInstance.get("/exercise-store/get-category");
      setCategory(response.data.fileCatogery || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    try {
      const uploadData = new FormData();
      uploadData.append(
        "fileCatogery",
        formData.fileCatogery === "others"
          ? formData.fileCatogery_others
          : formData.fileCatogery
      );
      uploadData.append("fileName", formData.fileName);
      uploadData.append("imgAndVideoFile", formData.file);
      const response = await AxiosInstance.post(
        "/exercise-store/add",
        uploadData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      message.success("File Uploaded Successfully");
      getCategory();
    } catch (error) {
      message.error("File fail to Upload");
      console.error("Upload error:", error);
    }
  };
  useEffect(() => {
    getCategory();
  }, []);
  return (
    <div>
      <h1 className="font-semibold text-gray-600 text-6xl">Exercise Upload</h1>
      <div className="flex items-center justify-center">
        <div className="w-fit border shadow-md rounded-md p-4 flex flex-col gap-2">
          <div>
            <label className="font-bold">File Category</label>
            <select
              name="fileCatogery"
              onChange={handleInputChange}
              value={formData.fileCatogery}
              className="w-full h-10 border shadow-md rounded-md bg-white p-2"
            >
              <option value="">Select category</option>
              {category?.map((data, index) => (
                <option key={index} value={data}>
                  {data}
                </option>
              ))}
              <option value="others">Others</option>
            </select>
            {formData.fileCatogery === "others" && (
              <input
                type="text"
                name="fileCatogery_others"
                value={formData.fileCatogery_others}
                onChange={handleInputChange}
                className="w-full h-10 border mt-2 shadow-md rounded-md bg-white p-2"
              />
            )}
          </div>

          <div>
            <label className="font-bold">Name</label>
            <input
              type="text"
              onChange={handleInputChange}
              name="fileName"
              value={formData.fileName}
              className="w-full h-10 border shadow-md rounded-md bg-white p-2"
            />
          </div>

          <div>
            <label className="font-bold">File</label>
            <input
              type="file"
              name="imgAndVideoFile"
              onChange={handleFileChange}
              className="w-full h-10 border shadow-md rounded-md bg-white p-2"
            />
          </div>

          <button
            className="bg-blue-500 text-white font-semibold rounded-md h-10"
            onClick={handleUpload}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExerciseUpload;
