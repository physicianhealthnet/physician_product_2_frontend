import React from "react";
import Chart from "react-apexcharts";

const TreatmentPlanGraph = ({ data }) => {
  const formattedData = data
    ?.map((item) => ({
      date: new Date(item.tp_vdate).toLocaleDateString("en-GB"), // Format as DD/MM/YYYY
      painScale: item.tp_iscale,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ensure correct sorting
    .filter((item, index, array) => {
      const lastDate = new Date();
      const itemDate = new Date(item.date.split('/').reverse().join('-'));
      const oneWeekAgo = new Date(lastDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo;
    });

  // Generate initial data if no data exists (one week)
  const initialData = Array.from({ length: 7 }, (_, index) => ({
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
    painScale: 0,
  })).reverse();

  const displayData = formattedData?.length > 0 ? formattedData : initialData;

  const chartOptions = {
    chart: {
      type: "bar",
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
      }
    },
    xaxis: {
      categories: displayData.map((item) => item.date),
      labels: { style: { colors: "black" }, rotate: -45 },
    },
    yaxis: {
      min: 0,
      max: 10,
      labels: { style: { colors: "black" } },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "10%", // Remove gap between bars
      },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
    colors: ["purple"]
  };

  const chartSeries = [
    {
      name: "Pain Scale",
      data: displayData.map((item) => item.painScale),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-4">
      <h2 className="text-2xl font-bold text-black mb-4 text-center">Pain Scale Over Time (Last Week)</h2>
      <Chart options={chartOptions} series={chartSeries} type="bar" height={400} />
    </div>
  );
};

export default TreatmentPlanGraph;