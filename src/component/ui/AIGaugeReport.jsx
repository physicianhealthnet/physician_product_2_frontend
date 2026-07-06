import React from "react";
import { Collapse } from "antd";
import { Icon } from "@iconify/react";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

// Gauge Needle Custom Plugin
const gaugeNeedlePlugin = {
  id: "gaugeNeedle",
  afterDatasetDraw(chart, args, options) {
    const {
      ctx,
      chartArea: { width, height },
    } = chart;
    ctx.save();
    
    // Fallback default value if not provided
    const value = options.value !== undefined ? options.value : 37.5;
    const min = options.min || 0;
    const max = options.max || 100;
    
    const cx = chart._metasets[0].data[0].x;
    const cy = chart._metasets[0].data[0].y;
    
    // Calculate angle
    const angle = Math.PI + (1 / (max - min)) * (value - min) * Math.PI;
    
    // Needle logic
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(height / 2.5, 0); // needle length
    ctx.lineTo(0, 5);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.restore();
    
    // Needle center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.restore();
  },
};

const MultiColorGauge = ({ value, min, max, title, unit, ranges, colors, flag }) => {
  const getNeedleValueFromFlag = (flag) => {
    const f = (flag || "normal").toLowerCase();
    switch (f) {
      case "low": return 12.5;
      case "normal": return 37.5;
      case "high": return 62.5;
      case "critical": return 87.5;
      case "warning": return 62.5;
      default: return 37.5;
    }
  };

  const needleValue = getNeedleValueFromFlag(flag);

  const data = {
    labels: ["Low", "Normal", "High", "Critical"],
    datasets: [
      {
        data: ranges,
        backgroundColor: colors,
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      gaugeNeedle: {
        value: needleValue,
        min: 0,
        max: 100,
      },
    },
    cutout: "75%",
  };
  
  return (
    <div className="flex flex-col items-center w-full max-w-[180px] mx-auto">
      <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">
        {title}
      </h3>
      <div className="relative w-full h-24 mb-3">
        <Doughnut data={data} options={options} plugins={[gaugeNeedlePlugin]} />
      </div>
      <div className="flex flex-col items-center justify-center bg-white px-5 py-2 rounded-xl border border-slate-200 shadow-sm min-w-[120px]">
        <span className="text-xl font-black text-slate-800 leading-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-slate-400 mt-0.5">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};


const AIGaugeReport = ({ items, title, icon, color }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-2 w-full">
      {title && (
        <h3 className={`text-sm font-black text-${color}-600 mb-4 flex items-center gap-2 uppercase tracking-wide px-2`}>
          <Icon icon={icon} className="text-xl" />
          {title}
        </h3>
      )}
      <Collapse
        className="bg-transparent border-none flex flex-col gap-4"
        expandIconPosition="end"
        defaultActiveKey={['ai-gauge-0']}
        items={items.map((item, idx) => {
          const flagLower = (item.flag || "normal").toLowerCase();
          const statusColorClass =
            {
              low: "text-sky-500",
              normal: "text-emerald-500",
              high: "text-amber-500",
              critical: "text-red-500",
              warning: "text-amber-500"
            }[flagLower] || "text-slate-500";

          const gaugeColors = ["#38bdf8", "#10b981", "#facc15", "#ef4444"];

          return {
            key: `ai-gauge-${idx}`,
            className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm",
            label: (
              <div className="flex items-center justify-between w-full py-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${color}-50 text-${color}-500 flex items-center justify-center`}>
                    <Icon icon={icon || "solar:health-bold-duotone"} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 m-0 uppercase">
                      {item.title || item.test_name || "AI Insight"}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 m-0 mt-0.5 uppercase tracking-wide">
                      {item.type === "scan"
                        ? "Diagnostic Insight"
                        : item.type === "vital"
                          ? "Vital Sign Analysis"
                          : item.type === "pharmacy"
                            ? "Pharmacy Analysis"
                            : "Lab Result"}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-50 border border-slate-100 ${statusColorClass}`}>
                  {item.flag || "NORMAL"}
                </div>
              </div>
            ),
            children: (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center justify-center relative min-h-[300px]">
                <div className="flex justify-center mb-2 w-full max-w-[200px]">
                  <MultiColorGauge
                    title={item.type === "lab" ? "Value" : "Status"}
                    value={item.value || (item.flag || "Normal").toUpperCase()}
                    unit={item.unit || ""}
                    min="0"
                    max="100"
                    ranges={[25, 25, 25, 25]}
                    colors={gaugeColors}
                    flag={item.flag}
                  />
                </div>
                {item.reference && (
                  <div className="text-center mt-6 text-xs font-bold text-slate-400">
                    Ref Range: {item.reference}
                  </div>
                )}
                {item.impression && (
                  <div className="text-center mt-6 text-sm font-medium text-slate-600 px-4 max-w-lg">
                    <span className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Clinical Impression
                    </span>
                    {item.impression}
                  </div>
                )}
                {item.drug_interactions && (
                  <div className="mt-6 p-4 bg-rose-50/50 rounded-xl border border-rose-100/50 w-full max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:danger-triangle-bold-duotone" className="text-rose-500 text-lg" />
                      <h4 className="text-sm font-bold text-rose-900 m-0">Drug Interactions</h4>
                    </div>
                    <p className="text-sm font-medium text-rose-700/80 m-0 leading-relaxed">
                      {item.drug_interactions}
                    </p>
                  </div>
                )}
                {item.patient_solution && (
                  <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 w-full max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:info-circle-bold-duotone" className="text-indigo-500 text-lg" />
                      <h4 className="text-sm font-bold text-indigo-900 m-0">Patient Guide</h4>
                    </div>
                    <p className="text-sm font-medium text-indigo-700/80 m-0 leading-relaxed">
                      {item.patient_solution}
                    </p>
                  </div>
                )}
                {item.treatment_suggestion && (
                  <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-full max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:pills-bold-duotone" className="text-emerald-500 text-lg" />
                      <h4 className="text-sm font-bold text-emerald-900 m-0">Treatment & Medicine Suggestion</h4>
                    </div>
                    <p className="text-sm font-medium text-emerald-700/80 m-0 leading-relaxed">
                      {item.treatment_suggestion}
                    </p>
                  </div>
                )}
              </div>
            ),
          };
        })}
      />
    </div>
  );
};

export default AIGaugeReport;
