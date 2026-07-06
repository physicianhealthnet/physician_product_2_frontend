import React, { useState, useEffect } from "react";
import Expenditure from "./Expenditure";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import SingleExpenditureDetails from "./SingleExpenditureDetails";
import ExpenditureAnalytics from "./ExpenditureAnalytics";
import { message, Modal } from "antd";
import Card from "../../../component/ui/Card";
import Input from "../../../component/ui/Input";
import Button from "../../../component/ui/Button";
import { TableSkeleton } from "../../../component/ui/Skeleton";

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

function ExpenditureShow() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [swaper, setSwaper] = useState(false);
  const [allExpenditure, setAllExpenditure] = useState([]);
  const [filteredExpenditure, setFilteredExpenditure] = useState([]);
  const [targetedData, setTargetedData] = useState({});
  const [singleSwaper, setSingleSwaper] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const handleGetExpenditure = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/expenditure/get-all");

      setAllExpenditure(response.data.data);
      setFilteredExpenditure(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetExpenditure();
  }, []);

  // 🔎 Filtering logic
  useEffect(() => {
    let filtered = [...allExpenditure];

    // ✅ Text Search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((data) => {
        return (
          String(data.billInvoiceNo || "")
            .toLowerCase()
            .includes(lowerSearch) ||
          String(data.supplier?.name || "")
            .toLowerCase()
            .includes(lowerSearch) ||
          String(data.payment?.status || "")
            .toLowerCase()
            .includes(lowerSearch) ||
          String(data.financials?.totalAmount || "")
            .toLowerCase()
            .includes(lowerSearch) ||
          new Date(data.billDate).toLocaleDateString().includes(lowerSearch)
        );
      });
    }

    // 📅 Date Filter
    if (startDate || endDate) {
      filtered = filtered.filter((data) => {
        const billDate = new Date(data.billDate);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;

        if (from && billDate < from) return false;
        if (to && billDate > to) return false;
        return true;
      });
    }

    setFilteredExpenditure(filtered);
  }, [search, startDate, endDate, allExpenditure]);

  const handleDelete = (data) => {
    Modal.confirm({
      title: "Confirm Delete",
      content: "Are you sure you want to delete this expenditure?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await AxiosInstance.delete(
            `/expenditure/delete/${data._id}`
          );
          message.success("Deleted Successfully");
          handleGetExpenditure();
        } catch (error) {
          message.error("Fail to Delete");
          console.error(error);
        }
      }
    });
  };

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-6 max-w-[1600px] w-full mx-auto pb-10">

        {/* Header Section */}
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Icon icon="tabler:report-money" className="text-2xl text-blue-600 " />
              </div>
              <div>
                <h1 className="font-black text-slate-800  text-3xl tracking-tight">
                  Expenditure
                </h1>
                <p className="text-slate-500  font-medium text-sm">
                  Track and manage clinic expenses
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setSwaper((p) => !p);
                setSingleSwaper(false);
              }}
              className="flex items-center gap-2"
            >
              <Icon
                icon={swaper ? "tabler:list" : "tabler:plus"}
                className="text-xl"
              />
              {swaper ? "View List" : "Add Expenditure"}
            </Button>
          </div>
        </StaggerItem>

        {/* Analytics Section */}
        {!user && !swaper && !singleSwaper && (
          <StaggerItem>
            <ExpenditureAnalytics />
          </StaggerItem>
        )}

        {/* Main Content Area */}
        <div className="w-full">
          {swaper ? (
            <StaggerItem>
              <Expenditure
                targetedData={targetedData}
                setSwaper={setSwaper}
                swaper={swaper}
                refresh={handleGetExpenditure}
              />
            </StaggerItem>
          ) : singleSwaper ? (
            <StaggerItem>
              <SingleExpenditureDetails targetedData={targetedData} onBack={() => setSingleSwaper(false)} />
            </StaggerItem>
          ) : (
            <div className="space-y-6">
              {/* Filter Bar */}
              <StaggerItem>
                <Card className="bg-white/50 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <Input
                        label="Search"
                        placeholder="Search by Invoice, Supplier, Status..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon="tabler:search"
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Input
                        type="date"
                        label="From Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Input
                        type="date"
                        label="To Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearch("");
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="mb-[2px]"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </Card>
              </StaggerItem>

              {/* Data Table */}
              <StaggerItem>
                <div className="rounded-xl border border-slate-200  overflow-hidden shadow-sm bg-white ">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50  border-b border-slate-200 ">
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider">Invoice</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider">Supplier</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider text-right">Total</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider text-right">Net Amount</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider text-center">Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500  uppercase tracking-wider text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 ">
                        {loading ? (
                          <tr>
                            <td colSpan="7" className="p-0">
                              <TableSkeleton rows={8} />
                            </td>
                          </tr>
                        ) : filteredExpenditure.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500  italic">
                              No expenditure records found
                            </td>
                          </tr>
                        ) : (
                          filteredExpenditure.map((data, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-700  font-mono text-sm">{data.billInvoiceNo || "-"}</td>
                              <td className="p-4 text-slate-600  text-sm">
                                {new Date(data.billDate).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-slate-800  font-medium">{data.supplier?.name || "-"}</td>
                              <td className="p-4 text-right text-slate-600 ">
                                {data.financials?.totalAmount ? `₹${data.financials.totalAmount}` : "-"}
                              </td>
                              <td className="p-4 text-right font-bold text-slate-800 ">
                                {data.financials?.netAmount ? `₹${data.financials.netAmount}` : "-"}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                  ${data.payment?.status === 'completed' ? 'bg-emerald-100 text-emerald-800  ' :
                                    data.payment?.status === 'pending' ? 'bg-amber-100 text-amber-800  ' :
                                      'bg-red-100 text-red-800  '
                                  }
                                `}>
                                  {data.payment?.status || "Unknown"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setTargetedData(data);
                                      setSingleSwaper(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="View Details"
                                  >
                                    <Icon icon="tabler:eye" className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTargetedData(data);
                                      setSwaper(true);
                                    }}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Icon icon="tabler:edit" className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(data)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Icon icon="tabler:trash" className="text-lg" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 border-t border-slate-200  bg-slate-50  text-xs text-slate-500  flex justify-between items-center">
                    <span>Showing {filteredExpenditure.length} entries</span>
                  </div>
                </div>
              </StaggerItem>
            </div>
          )}
        </div>
      </div>
    </StaggerContainer>
  );
}

export default ExpenditureShow;
