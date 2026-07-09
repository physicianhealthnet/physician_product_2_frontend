import React, { useEffect, useState } from "react";
import { AxiosInstance,AxiosInstanceSecondryServer } from "../../utilities/AxiosInstance";
import { Icon } from "@iconify/react/dist/iconify.js";
import { message } from "antd";
import Card from "../../component/ui/Card";
import Input from "../../component/ui/Input";
import Button from "../../component/ui/Button";

import { StaggerContainer, StaggerItem } from "../../component/ui/Transitions";

function DoctorAndStaffs() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [clinicFilter, setClinicFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
    userType: "doctor",
    department: ""
  });

  const departmentList = [
    "General Physician", "Dentist", "Dermatologist", "ENT Specialist", "Ophthalmologist",
    "Cardiologist", "Orthopedic", "Gynecologist", "Pediatrician", "Endocrinologist", "Psychiatrist",
  ];

  const handleGetAllUsers = async () => {
    try {
      const response = await AxiosInstance.get("/user/getAllUsers");
      setUsers(response.data.user);
      setFilteredUsers(response.data.user);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetAllUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = users;

    if (clinicFilter) {
      filtered = filtered.filter(
        (user) => user.clinicId?.toString() === clinicFilter.toString()
      );
    }

    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.userName?.toLowerCase().includes(lower) ||
          user.userId?.toLowerCase().includes(lower) ||
          user.userType?.toLowerCase().includes(lower) ||
          user.email?.toLowerCase().includes(lower) ||
          user.phone?.toLowerCase().includes(lower) ||
          user.clinicId?.toString().includes(lower)
      );
    }

    setFilteredUsers(filtered);
  }, [clinicFilter, searchFilter, users]);

  // Get unique clinic IDs for dropdown
  const clinicIds = [...new Set(users.map((u) => u.clinicId))];

  // Get role badge color
  const getRoleBadge = (role) => {
    const badges = {
      master: "bg-purple-500/20 text-purple-600 ",
      doctor: "bg-blue-500/20 text-blue-600 ",
      accountant: "bg-emerald-500/20 text-emerald-600 ",
      generalManager: "bg-amber-500/20 text-amber-600 ",
      receptionist: "bg-rose-500/20 text-rose-600 ",
    };
    return badges[role] || "bg-slate-500/20 text-slate-600 ";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.userType === "doctor" && !formData.department) {
      message.error("Please select a department for the Doctor!");
      return;
    }
    
    // Get master's clinicId securely
    const userStr = sessionStorage.getItem("master") || sessionStorage.getItem("user");
    const loggedInUser = userStr ? JSON.parse(userStr) : null;
    const cid = loggedInUser?.clinicId || "PHN-C-0001";

    setAddLoading(true);
    try {
      const payload = {
        userName: formData.userName,
        email: formData.email,
        phone: formData.phone,
        userType: formData.userType,
        clinicId: cid
      };

      if (!isEditMode && formData.password) {
        payload.password = formData.password;
      }

      if (formData.userType === "doctor") {
        payload.department = formData.department;
      }

      if (isEditMode) {
        await AxiosInstance.patch(`/user/update/${selectedUserId}`, payload);
        message.success(`${formData.userType} updated successfully!`);
      } else {
        await AxiosInstance.post("/user/add", payload);
        message.success(`${formData.userType} added successfully!`);
      }
      
      // Cleanup & Refresh
      closeModal();
      handleGetAllUsers();

    } catch (error) {
      console.error("Submit Error:", error);
      message.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} user!`);
    } finally {
      setAddLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({ userName: "", email: "", phone: "", password: "", userType: "doctor", department: "" });
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.userId);
    setFormData({
      userName: user.userName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // Leave blank on edit
      userType: user.userType || "doctor",
      department: user.department || ""
    });
    setIsModalOpen(true);
  };

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-8 pb-8">
        {/* Modern Header */}
        <StaggerItem>
          <div className="flex flex-col gap-1">
            <h1 className="font-black text-slate-800  text-4xl tracking-tight">
              Doctor & <span className="text-blue-500">Staff</span>
            </h1>
            <p className="text-slate-500  font-medium">
              Manage doctors, staff members, and user accounts
            </p>
          </div>
        </StaggerItem>

        {/* Filters & Actions */}
        <StaggerItem>
          <div className="flex flex-wrap items-center gap-3">
            {/* Clinic Filter */}
            <div className="relative">
              <Icon icon="tabler:building-hospital" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <select
                value={clinicFilter}
                onChange={(e) => setClinicFilter(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-white/40  backdrop-blur-md border border-slate-200/60  text-slate-700  font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="">All Clinics</option>
                {clinicIds.map((id, idx) => (
                  <option key={idx} value={id}>
                    Clinic {id}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div className="relative flex-1 max-w-md">
              <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, role..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            
            <div className="ml-auto">
              <Button 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 px-6 py-2.5 rounded-xl transition-all"
                onClick={() => {
                  setIsEditMode(false);
                  setFormData({ userName: "", email: "", phone: "", password: "", userType: "doctor", department: "" });
                  setIsModalOpen(true);
                }}
              >
                <Icon icon="tabler:plus" className="text-xl" />
                <span className="font-bold">Add Doctor / Staff</span>
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* Users Table */}
        <StaggerItem>
          {filteredUsers.length > 0 ? (
            <Card className="overflow-hidden bg-white/40  backdrop-blur-md border-slate-200/60 ">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100/80  backdrop-blur-sm">
                    <tr className="border-b border-slate-200 ">
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">S.No</th>
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">User ID</th>
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Username</th>
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Role</th>
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Email</th>
                      <th className="p-4 text-left font-black text-slate-600  uppercase tracking-wider text-xs">Phone</th>
                      <th className="p-4 text-center font-black text-slate-600  uppercase tracking-wider text-xs">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 ">
                    {filteredUsers.map((data, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-700 ">{index + 1}</td>
                        <td className="p-4 font-black text-blue-600 ">{data.userId}</td>
                        <td className="p-4 font-semibold text-slate-800 ">{data.userName}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadge(data.userType)}`}>
                            {data.userType}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-600 ">{data.email}</td>
                        <td className="p-4 font-medium text-slate-600 ">{data.phone}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openEditModal(data)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Icon icon="tabler:edit" className="text-xl" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-white/40  backdrop-blur-md border-slate-200/60 ">
              <div className="flex flex-col items-center gap-3">
                <Icon icon="tabler:users-group" className="text-6xl text-slate-300 " />
                <p className="text-slate-500  font-semibold">No users found</p>
              </div>
            </Card>
          )}
        </StaggerItem>

        {/* Add User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 transform transition-all flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">{isEditMode ? "Edit Member" : "Add New Member"}</h2>
                <button 
                  onClick={closeModal}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Icon icon="tabler:x" className="text-2xl" />
                </button>
              </div>
              
              {/* Body */}
              <div className="overflow-y-auto p-6">
                <form id="add-user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Role</label>
                    <select 
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                      required
                    >
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="accountant">Accountant</option>
                      <option value="generalManager">General Manager</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Full Name</label>
                    <input type="text" name="userName" value={formData.userName} onChange={handleInputChange} placeholder="E.g. Dr. John / Sarah" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"/>
                  </div>

                  {formData.userType === "doctor" && (
                     <div className="flex flex-col gap-1.5">
                       <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Department</label>
                       <select 
                         name="department"
                         value={formData.department}
                         onChange={handleInputChange}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                         required
                       >
                         <option value="">Select Department</option>
                         {departmentList.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                       </select>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="name@clinic.com" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 890" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"/>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Setup Initial Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"/>
                    </div>
                  )}

                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                <Button 
                  onClick={closeModal}
                  className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-6"
                >
                  Cancel
                </Button>
                <Button 
                  form="add-user-form"
                  type="submit"
                  loading={addLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isEditMode ? "Update Details" : "Confirm & Sync"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaggerContainer>
  );
}

export default DoctorAndStaffs;
