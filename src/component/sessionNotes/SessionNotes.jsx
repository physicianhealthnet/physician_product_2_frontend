import { Icon } from "@iconify/react";
import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../utilities/AxiosInstance";
import { message } from "antd";
import { useParams } from "react-router-dom";
import formatDateToDDMMYYYY from "../../utilities/formatter";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";

function SessionNotes({ session, outerswaper }) {
  const { patient_id } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [swaper, setSwaper] = useState(false);
  const [formData, setFormData] = useState({});
  const [allNotes, setAllNotes] = useState([]);

  // Date filter states
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetNotes = async () => {
    try {
      const response = await AxiosInstance.get(
        `/session-notes/get-patient/${patient_id}`
      );
      setAllNotes(response.data.data);
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
      await AxiosInstance.post(`/session-notes/add`, payload);
      message.success("Session Notes submitted successfully");
      setFormData({});
      handleGetNotes();
      setSwaper(false);
    } catch (error) {
      message.error("Session Notes failed to submit");
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      await AxiosInstance.patch(
        `/session-notes/update/${formData._id}`,
        formData
      );
      message.success("Session Notes Updated Successfully");
      handleGetNotes();
      setSwaper(false);
      setFormData({});
    } catch (error) {
      message.error("Session Notes fail to Update");
      console.error(error);
    }
  };

  const handleDelete = async (items) => {
    // If items is passed directly (from button click), use it. otherwise use formData if set. 
    // The original code was a bit ambiguous, relying on state being set before delete.
    // Better to pass ID directly.
    const idToDelete = items?._id || formData._id;
    if (!idToDelete) return;

    try {
      await AxiosInstance.delete(
        `/session-notes/delete/${idToDelete}`
      );
      message.success("Session Notes Deleted Successfully");
      handleGetNotes();
      setFormData({});
    } catch (error) {
      message.error("Session Notes fail to Delete");
      console.error(error);
    }
  };

  // Filter notes by date or range
  const getFilteredNotes = () => {
    if (!filterStartDate && !filterEndDate) return allNotes;

    return allNotes.filter((note) => {
      const noteDate = new Date(note.sessionDate);
      const start = filterStartDate ? new Date(filterStartDate) : null;
      const end = filterEndDate ? new Date(filterEndDate) : null;

      // Single date filter
      if (start && !end) {
        return noteDate.toDateString() === start.toDateString();
      }

      // Date range filter
      if (start && end) {
        return noteDate >= start && noteDate <= end;
      }

      return true;
    });
  };

  useEffect(() => {
    if (!session) {
      handleGetNotes();
    }
  }, [patient_id]);

  return (
    <div className="space-y-6">
      {/* Toggle Add / Show */}
      {!session && (
        <div className="flex justify-end">
          <Button
            variant={swaper ? "ghost" : "primary"}
            onClick={() => {
              setSwaper((p) => !p);
              setFormData({}); // Clear form when toggling
            }}
            className="flex items-center gap-2"
          >
            <Icon
              icon={swaper ? "solar:close-circle-bold" : "solar:add-circle-bold"}
              width="20"
              height="20"
            />
            {swaper ? "Cancel" : "Add Session Notes"}
          </Button>
        </div>
      )}

      {/* Show Session Notes */}
      {session ? (
        <div className="flex flex-col gap-4">
          {session?.map((data, index) => (
            <Card key={index} className="!p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:calendar-date-bold" className="text-blue-500" />
                  <span className="font-semibold text-slate-700 ">
                    {formatDateToDDMMYYYY(data.sessionDate)}
                  </span>
                </div>
                <p className="text-base text-slate-800  whitespace-pre-wrap leading-relaxed">
                  {data.sessionNotes}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : !swaper ? (
        allNotes.length < 1 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200  rounded-2xl bg-slate-50/50 ">
            <div className="bg-white  p-4 rounded-full shadow-sm mb-3">
              <Icon icon="solar:notebook-bold-duotone" className="text-slate-300 " width={48} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 ">No Notes Found</h3>
            <p className="text-slate-500  max-w-xs mx-auto text-sm mt-1">
              Add session notes to keep track of patient progress and treatment details.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date Filter UI */}
            <Card className="!p-4 bg-slate-50 ">
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  type="date"
                  label="From Date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  containerClassName="flex-1 min-w-[150px]"
                />
                <Input
                  type="date"
                  label="To Date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  containerClassName="flex-1 min-w-[150px]"
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="mb-1"
                >
                  Clear Filters
                </Button>
              </div>
            </Card>

            {/* Filtered Notes List */}
            <div className="grid gap-4">
              {getFilteredNotes().length === 0 ? (
                <p className="text-center py-8 text-slate-500 ">No notes match the selected date range.</p>
              ) : (
                getFilteredNotes().map((data, index) => (
                  <Card key={index} className="!p-5 hover:shadow-md transition-shadow group border-l-4 border-l-blue-500" noPadding>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between border-b border-slate-100  pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-50  rounded-lg text-blue-600 ">
                            <Icon icon="solar:calendar-date-bold-duotone" width={20} />
                          </div>
                          <span className="font-bold text-lg text-slate-800 ">
                            {formatDateToDDMMYYYY(data.sessionDate)}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="warning-ghost"
                            onClick={() => {
                              setFormData(data);
                              setSwaper(true);
                            }}
                            className="!p-2"
                            title="Edit"
                          >
                            <Icon icon="solar:pen-bold" width={18} />
                          </Button>
                          <Button
                            variant="danger-ghost"
                            onClick={() => handleDelete(data)}
                            className="!p-2"
                            title="Delete"
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={18} />
                          </Button>
                        </div>
                      </div>

                      <div className="prose  max-w-none">
                        <p className="text-slate-700  text-base whitespace-pre-wrap leading-relaxed">
                          {data.sessionNotes}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      ) : (
        // Add/Edit Session Notes Form
        <Card title={formData._id ? "Edit Session Note" : "New Session Note"}>
          <div className="flex flex-col gap-4">
            <Input
              type="date"
              label="Session Date"
              name="sessionDate"
              value={formData?.sessionDate || ""}
              onChange={handleInputChange}
              containerClassName="w-fit"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ">
                Notes
              </label>
              <textarea
                className="w-full border border-slate-300  rounded-lg p-4 text-base bg-white  text-slate-900  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 :text-slate-600"
                name="sessionNotes"
                value={formData?.sessionNotes || ""}
                onChange={handleInputChange}
                rows={10}
                placeholder="Enter detailed observation and notes here..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSwaper(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => (formData._id ? handleUpdate() : handleSubmit())}
              >
                {formData?._id ? "Update Note" : "Save Note"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default SessionNotes;
