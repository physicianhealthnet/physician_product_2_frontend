import React, { useEffect, useState } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import Card from "../../../component/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ExpenditureAnalytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await AxiosInstance.get("/expenditure/get-all");
        setData(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // 🔹 Summary calculations
  const totalPurchase = data.reduce(
    (acc, e) => acc + (e.financials?.totalAmount || 0),
    0
  );
  const totalGST = data.reduce(
    (acc, e) => acc + (e.financials?.gst?.amount || 0),
    0
  );
  const totalDiscount = data.reduce(
    (acc, e) => acc + (e.financials?.discount?.amount || 0),
    0
  );
  const totalDue = data.reduce(
    (acc, e) => acc + (e.payment?.dueAmount || 0),
    0
  );

  // 🔹 Supplier-wise data
  const supplierData = Object.values(
    data.reduce((acc, e) => {
      const supplier = e.supplier?.name || "Unknown";
      acc[supplier] = acc[supplier] || { name: supplier, total: 0 };
      acc[supplier].total += e.financials?.totalAmount || 0;
      return acc;
    }, {})
  );

  // 🔹 Product type distribution
  const typeData = data.reduce(
    (acc, e) => {
      e.products.forEach((p) => {
        if (p.type === "equipment") acc.equipment += p.amount * p.quantity;
        else acc.consumable += p.amount * p.quantity;
      });
      return acc;
    },
    { equipment: 0, consumable: 0 }
  );

  const pieData = [
    { name: "Consumables", value: typeData.consumable },
    { name: "Equipment", value: typeData.equipment },
  ];

  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white   border-blue-100 ">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500 ">Total Purchase</span>
            <span className="text-2xl font-bold text-slate-800  mt-1">₹ {totalPurchase.toFixed(2)}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white   border-amber-100 ">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500 ">Total GST</span>
            <span className="text-2xl font-bold text-amber-600  mt-1">₹ {totalGST.toFixed(2)}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white   border-emerald-100 ">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500 ">Total Discount</span>
            <span className="text-2xl font-bold text-emerald-600  mt-1">₹ {totalDiscount.toFixed(2)}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-white   border-rose-100 ">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500 ">Total Due</span>
            <span className="text-2xl font-bold text-rose-600  mt-1">₹ {totalDue.toFixed(2)}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier wise Bar Chart */}
        <Card title="Expenditure by Supplier" className="min-h-[400px]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} prefix="₹" />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Product Type Pie Chart */}
        <Card title="Product Type Distribution" className="min-h-[400px]">
          <div className="w-full h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ExpenditureAnalytics;
