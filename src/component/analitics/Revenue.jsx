import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DollarSign, Activity, Stethoscope, Pill, Syringe } from 'lucide-react';
import { AxiosInstance } from "../../utilities/AxiosInstance";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const RevenueCard = ({ title, amount, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">
        ₹{amount.toLocaleString()}
      </h3>
    </div>
    <div className={`p-4 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

function Revenue() {
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    categories: {
      doctor: 0,
      scanCenter: 0,
      lab: 0,
      pharmacy: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user"));
  const master = JSON.parse(sessionStorage.getItem("master"));

  useEffect(() => {
    const fetchBills = async () => {
      try {
        let res;
        if (user?.clinicId) {
          res = await AxiosInstance.get(`/treatment-bill/get-all/${user.clinicId}`);
        } else if (master) {
          res = await AxiosInstance.get(`/treatment-bill/get-all`);
        } else {
          setLoading(false);
          return;
        }
        
        const bills = res.data.data || [];
        
        let total = 0;
        let doc = 0, scan = 0, lab = 0, pharm = 0;

        bills.forEach(bill => {
          const billTotal = Number(bill.totalAmount) || 0;
          total += billTotal;
          
          if (bill.treatments && bill.treatments.length > 0) {
            let categorizedTotal = 0;
            bill.treatments.forEach(item => {
              const amount = Number(item.total) || 0;
              categorizedTotal += amount;
              
              if (item.category === "Scan") {
                scan += amount;
              } else if (item.category === "Lab") {
                lab += amount;
              } else if (item.category === "Pharmacy") {
                pharm += amount;
              } else {
                // Default to Doctor revenue
                doc += amount;
              }
            });
            // Any remaining balance (like manual totals without items) goes to doctor
            if (billTotal > categorizedTotal) {
              doc += (billTotal - categorizedTotal);
            }
          } else {
             // No line items, full bill goes to doctor
             doc += billTotal;
          }
        });

        setRevenueData({
          totalRevenue: total,
          categories: {
            doctor: doc,
            scanCenter: scan,
            lab: lab,
            pharmacy: pharm
          }
        });
      } catch (error) {
        console.error("Failed to fetch revenue analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [user?.clinicId]);

  const barData = [
    { name: 'Dr. Consultations', value: revenueData.categories.doctor },
    { name: 'Scan Center', value: revenueData.categories.scanCenter },
    { name: 'Laboratory', value: revenueData.categories.lab },
    { name: 'Pharmacy', value: revenueData.categories.pharmacy },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading Revenue Analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Revenue Analytics</h1>
        <p className="text-gray-500">Overview of your financial performance across different departments.</p>
      </div>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <RevenueCard 
          title="Total Revenue" 
          amount={revenueData.totalRevenue} 
          icon={DollarSign} 
          colorClass="bg-blue-600" 
        />
        <RevenueCard 
          title="Dr. Revenue" 
          amount={revenueData.categories.doctor} 
          icon={Stethoscope} 
          colorClass="bg-blue-400" 
        />
        <RevenueCard 
          title="Scan Center" 
          amount={revenueData.categories.scanCenter} 
          icon={Activity} 
          colorClass="bg-purple-500" 
        />
        <RevenueCard 
          title="Laboratory" 
          amount={revenueData.categories.lab} 
          icon={Syringe} 
          colorClass="bg-emerald-500" 
        />
        <RevenueCard 
          title="Pharmacy" 
          amount={revenueData.categories.pharmacy} 
          icon={Pill} 
          colorClass="bg-amber-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Revenue by Category (Bar)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `₹${value}`} />
                <RechartsTooltip 
                  cursor={{fill: '#f3f4f6'}}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Revenue Distribution (Pie)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={barData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Revenue;