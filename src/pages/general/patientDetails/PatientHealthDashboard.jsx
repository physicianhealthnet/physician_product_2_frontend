import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { message, Collapse } from "antd";
import Button from "../../../component/ui/Button";
import Card from "../../../component/ui/Card";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Skeleton } from "../../../component/ui/Skeleton";
import {
  StaggerContainer,
  StaggerItem,
} from "../../../component/ui/Transitions";
import ReactMarkdown from 'react-markdown';

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  ChartLegend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
);

const gaugeNeedlePlugin = {
  id: "gaugeNeedle",
  afterDraw: (chart) => {
    const { ctx } = chart;
    const pluginOptions = chart.config.options.plugins.gaugeNeedle;
    if (!pluginOptions) return;

    const value = pluginOptions.value || 0;
    const min = pluginOptions.min || 0;
    const max = pluginOptions.max || 100;

    const clampedValue = Math.max(min, Math.min(max, value));
    const percentage = (clampedValue - min) / (max - min);
    const angle = Math.PI + Math.PI * percentage;

    ctx.save();
    const meta = chart.getDatasetMeta(0);
    const data0 = meta.data[0];
    if (!data0) return;

    const cx = data0.x;
    const cy = data0.y;
    const innerRadius = data0.innerRadius;
    const outerRadius = data0.outerRadius;
    const needleLength = innerRadius + (outerRadius - innerRadius) * 0.9;

    const nx = cx + Math.cos(angle) * needleLength;
    const ny = cy + Math.sin(angle) * needleLength;

    // Draw needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#334155"; // slate-700
    ctx.stroke();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.restore();
  },
};

const MultiColorGauge = ({
  value,
  min,
  max,
  title,
  unit,
  ranges,
  colors,
  flag,
}) => {
  const getNeedleValueFromFlag = (flag) => {
    const f = (flag || "normal").toLowerCase();
    switch (f) {
      case "low":
        return 12.5;
      case "normal":
        return 37.5;
      case "high":
        return 62.5;
      case "critical":
        return 87.5;
      default:
        return 37.5;
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

const MetricCard = ({ title, value, icon, color, flag }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow relative">
    <div className="flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-50 text-${color}-500 shrink-0`}
      >
        <Icon icon={icon} className="text-2xl" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 mb-0.5 truncate">
          {title}
        </p>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {value}
        </h3>
      </div>
    </div>
    {flag && (
      <div className="shrink-0 mt-2 sm:mt-0">
        <FlagMeter flag={flag} />
      </div>
    )}
  </div>
);

const FlagMeter = ({ flag }) => {
  const f = (flag || "normal").toLowerCase();

  const segments = [
    { label: "Low", id: "low", color: "bg-cyan-400" },
    { label: "Normal", id: "normal", color: "bg-emerald-500" },
    { label: "High", id: "high", color: "bg-amber-500" },
    { label: "Critical", id: "critical", color: "bg-red-500" },
  ];

  return (
    <div className="flex items-center gap-1">
      {segments.map((seg) => (
        <div key={seg.id} className="flex flex-col items-center gap-0.5">
          <div
            className={`h-1.5 w-6 rounded-full transition-colors ${f === seg.id ? seg.color : "bg-slate-200"}`}
          />
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${f === seg.id ? "text-slate-700" : "text-slate-400"}`}
          >
            {seg.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Removed renderStructuredAIReport, rendering directly in dashboard grid now.

const PatientHealthDashboard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patientInfo, setPatientInfo] = useState(null);
  const [vitalsData, setVitalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  
  const [overallSolution, setOverallSolution] = useState(null);
  const [generatingSolution, setGeneratingSolution] = useState(false);

  const handleGenerateOverallSolution = async () => {
    try {
      setGeneratingSolution(true);
      const response = await AxiosInstance.get(
        `/patient/ai-report/${patientId}`
      );
      setOverallSolution(response.data.report);
      message.success("Overall clinical summary generated successfully!");
    } catch (error) {
      console.error("Summary Generation Error:", error);
      message.error(
        error.response?.data?.message || "Failed to generate overall solution"
      );
    } finally {
      setGeneratingSolution(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    try {
      setAnalyzing(true);
      const response = await AxiosInstance.get(
        `/patient/analyze-document/${patientId}`,
      );

      setAiReport(response.data.report);
      message.success("Patient records analyzed successfully!");
    } catch (error) {
      console.error("Analysis Error:", error);
      message.error(
        error.response?.data?.message || "Failed to analyze document",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch basic patient info
        const patientResponse = await AxiosInstance.get(
          `/patient/get-by-id/${patientId}`,
        );
        setPatientInfo(patientResponse?.data?.patient);

        // Fetch physician assessments to get latest vitals
        const assessmentResponse = await AxiosInstance.get(
          `/assessment/get-by-patient/${patientId}`,
        );
        const assessments = assessmentResponse?.data?.data || [];

        if (assessments.length > 0) {
          // Find the most recent assessment that has vitals
          const latestWithVitals = assessments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .find((a) => a.vitals && a.vitals.length > 0);

          if (latestWithVitals) {
            // Get the most recent vitals entry from that assessment
            const latestVitals =
              latestWithVitals.vitals[latestWithVitals.vitals.length - 1];
            setVitalsData(latestVitals);
          }
        }
      } catch (error) {
        console.error("Error fetching patient data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  // Parse blood pressure safely
  let systolic = 0;
  let diastolic = 0;
  if (vitalsData?.bloodPressure) {
    const bpParts = vitalsData.bloodPressure.split("/");
    if (bpParts.length === 2) {
      systolic = parseInt(bpParts[0]) || 0;
      diastolic = parseInt(bpParts[1]) || 0;
    } else {
      // Sometimes just a single number is typed
      systolic = parseInt(bpParts[0]) || 0;
    }
  }

  const pulse = parseFloat(vitalsData?.pulseRate) || 0;

  // Extract AI metrics
  const aiMetrics = [];
  const aiGaugeItems = [];

  if (Array.isArray(aiReport)) {
    aiReport.forEach((report) => {
      const isBloodTest = report.test?.toLowerCase() === "blood test";
      const isVitals = report.test?.toLowerCase() === "vitals analysis";

      if ((isBloodTest || isVitals) && Array.isArray(report.data)) {
        report.data.forEach((item) => {
          // For MetricCards on left (only for blood tests)
          if (isBloodTest) {
            aiMetrics.push({
              title: item.test_name,
              value: `${item.value} ${item.unit}`,
              flag: item.flag,
            });
          }

          // For Gauge Cards on right
          aiGaugeItems.push({
            title: item.test_name,
            value: item.value,
            unit: item.unit,
            reference: item.reference_range,
            flag: item.flag,
            patient_solution: item.patient_understandable_solution,
            treatment_suggestion: item.treatment_suggestion,
            type: isVitals ? "vital" : "lab",
          });
        });
      } else if (report.data) {
        // Handle scan data which might be an array or an object
        const scanDataList = Array.isArray(report.data) ? report.data : [report.data];
        scanDataList.forEach(scanData => {
          aiGaugeItems.push({
            title: report.test || "Scan",
            value: scanData.flag?.toUpperCase() || "N/A",
            unit: "",
            impression: scanData.impression,
            flag: scanData.flag,
            patient_solution: scanData.patient_understandable_solution || scanData.patient_friendly_summary,
            treatment_suggestion: scanData.treatment_suggestion,
            type: "scan",
          });
        });
      }
    });
  }

  const aiAnimationStyles = `
    @keyframes ai-breath {
      0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.1); transform: scale(1); border-color: rgba(99, 102, 241, 0.2); }
      50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5); transform: scale(1.005); border-color: rgba(99, 102, 241, 0.8); }
    }
    @keyframes scan-line {
      0% { top: -10%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 110%; opacity: 0; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 0.5; }
      80%, 100% { transform: scale(2.5); opacity: 0; }
    }
    .ai-analyzing-card {
      animation: ai-breath 3s ease-in-out infinite;
      position: relative;
      border: 1px solid transparent;
    }
    .ai-scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(to right, transparent, rgba(99, 102, 241, 1), transparent);
      box-shadow: 0 0 15px rgba(99, 102, 241, 1);
      animation: scan-line 2.5s linear infinite;
      z-index: 20;
      pointer-events: none;
    }
    .pulse-ring-element {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(99, 102, 241, 0.5);
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
  `;

  const renderGaugeGroup = (items, title, icon, color) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-2 w-full">
        <h3 className={`text-sm font-black text-${color}-600 mb-4 flex items-center gap-2 uppercase tracking-wide px-2`}>
          <Icon icon={icon} className="text-xl" />
          {title}
        </h3>
        <Collapse
          className="bg-transparent border-none flex flex-col gap-4"
          expandIconPosition="end"
          items={items.map((item, idx) => {
            const flagLower = (item.flag || "normal").toLowerCase();
            const statusColorClass =
              {
                low: "text-sky-500",
                normal: "text-emerald-500",
                high: "text-amber-500",
                critical: "text-red-500",
              }[flagLower] || "text-slate-500";

            const gaugeColors = [
              "#38bdf8",
              "#10b981",
              "#facc15",
              "#ef4444",
            ];

            return {
              key: `ai-gauge-${idx}`,
              className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm",
              label: (
                <div className="flex items-center justify-between w-full py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                      <Icon icon={icon} className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 m-0 uppercase">
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 m-0 mt-0.5 uppercase tracking-wide">
                        {item.type === "scan"
                          ? "Diagnostic Insight"
                          : item.type === "vital"
                            ? "Vital Sign Analysis"
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
                      value={item.value}
                      unit={item.unit}
                      min="0"
                      max="100"
                      ranges={[25, 25, 25, 25]}
                      colors={gaugeColors}
                      flag={item.flag}
                    />
                  </div>
                  {item.type === "lab" && item.reference && (
                    <div className="text-center mt-6 text-xs font-bold text-slate-400">
                      Ref Range: {item.reference}
                    </div>
                  )}
                  {item.type === "scan" && item.impression && (
                    <div className="text-center mt-6 text-sm font-medium text-slate-600 px-4 max-w-lg">
                      <span className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Clinical Impression
                      </span>
                      {item.impression}
                    </div>
                  )}
                  {item.patient_solution && (
                    <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 w-full max-w-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon
                          icon="solar:info-circle-bold-duotone"
                          className="text-indigo-500 text-lg"
                        />
                        <h4 className="text-sm font-bold text-indigo-900 m-0">
                          Patient Guide
                        </h4>
                      </div>
                      <p className="text-sm font-medium text-indigo-700/80 m-0 leading-relaxed">
                        {item.patient_solution}
                      </p>
                    </div>
                  )}
                  {item.treatment_suggestion && (
                    <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-full max-w-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon
                          icon="solar:pills-bold-duotone"
                          className="text-emerald-500 text-lg"
                        />
                        <h4 className="text-sm font-bold text-emerald-900 m-0">
                          Treatment & Medicine Suggestion
                        </h4>
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

  return (
    <StaggerContainer>
      <style>{aiAnimationStyles}</style>
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-slate-50 min-h-screen">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Icon icon="solar:health-bold-duotone" className="text-3xl" />
              </div>
              <div>
                <h1 className="font-black text-slate-800 text-2xl tracking-tight m-0">
                  Patient Health Monitoring Dashboard
                </h1>
                <p className="text-slate-500 font-medium text-sm m-0 mt-1">
                  {loading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    `Tracking key health metrics for ${patientInfo?.patientName} (${patientId})`
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              className="rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Icon icon="tabler:arrow-left" />
              Back
            </Button>
          </div>
        </StaggerItem>

        {/* AI Document Analysis Section (MOVED TO TOP) */}
        <StaggerItem>
          <Card
            className={`p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200/50 shadow-sm relative overflow-hidden mt-2 mb-2 ${analyzing ? "ai-analyzing-card" : ""}`}
          >
            {analyzing && <div className="ai-scan-line"></div>}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Icon
                icon="solar:magic-stick-3-bold-duotone"
                className="text-8xl text-indigo-500"
              />
            </div>

            <div className="flex flex-col items-center text-center justify-center relative z-10 p-4 sm:p-8">
              <div className="relative w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mx-auto mb-4 shadow-sm border border-white">
                {analyzing && <div className="pulse-ring-element"></div>}
                <Icon
                  icon={
                    analyzing
                      ? "solar:radar-bold-duotone"
                      : "solar:folder-with-files-bold-duotone"
                  }
                  className={`text-3xl ${analyzing ? "animate-spin" : ""}`}
                />
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                Analyze Existing Records
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 max-w-md mx-auto">
                Automatically fetch the patient's latest scan and lab reports
                for AI diagnosis and treatment recommendations.
              </p>
              <Button
                onClick={handleAnalyzeDocument}
                loading={analyzing}
                disabled={analyzing}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all relative overflow-hidden"
              >
                <Icon icon="solar:cpu-bolt-bold-duotone" className="text-xl" />
                {analyzing ? "Analyzing Reports..." : "Run Analysis"}
              </Button>
            </div>
          </Card>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Left Column - Metrics */}
          <StaggerItem className="lg:col-span-4 flex flex-col gap-4">
            {/* AI Extracted Lab Metrics */}
            {aiMetrics.length > 0 &&
              aiMetrics.map((metric, idx) => {
                const colorMap = {
                  normal: "emerald",
                  high: "amber",
                  low: "cyan",
                  critical: "red",
                };
                const color = colorMap[metric.flag?.toLowerCase()] || "blue";
                return (
                  <MetricCard
                    key={`ai-${idx}`}
                    title={metric.title}
                    value={metric.value}
                    icon="solar:test-tube-bold-duotone"
                    color={color}
                    flag={metric.flag}
                  />
                );
              })}

            {/* Standard Vitals */}
            <MetricCard
              title="Temperature (°F/°C)"
              value={
                vitalsData?.temperature ? `${vitalsData.temperature}` : "N/A"
              }
              icon="solar:thermometer-bold-duotone"
              color="orange"
            />
            <MetricCard
              title="Pulse Rate (bpm)"
              value={vitalsData?.pulseRate ? `${vitalsData.pulseRate}` : "N/A"}
              icon="solar:heart-pulse-bold-duotone"
              color="rose"
            />
            <MetricCard
              title="Respiratory Rate (/min)"
              value={
                vitalsData?.respiratoryRate
                  ? `${vitalsData.respiratoryRate}`
                  : "N/A"
              }
              icon="solar:lungs-bold-duotone"
              color="emerald"
            />
            <MetricCard
              title="Blood Pressure (mmHg)"
              value={
                vitalsData?.bloodPressure
                  ? `${vitalsData.bloodPressure}`
                  : "N/A"
              }
              icon="solar:health-bold-duotone"
              color="red"
            />
            <MetricCard
              title="SpO2 (%)"
              value={vitalsData?.spO2 ? `${vitalsData.spO2}` : "N/A"}
              icon="solar:wind-bold-duotone"
              color="cyan"
            />
            <MetricCard
              title="Height (cm)"
              value={vitalsData?.height ? `${vitalsData.height}` : "N/A"}
              icon="solar:ruler-bold-duotone"
              color="purple"
            />
            <MetricCard
              title="Weight (kg)"
              value={vitalsData?.weight ? `${vitalsData.weight}` : "N/A"}
              icon="solar:user-rounded-bold-duotone"
              color="blue"
            />
            <MetricCard
              title="BMI (kg/m²)"
              value={vitalsData?.bmi ? `${vitalsData.bmi}` : "N/A"}
              icon="solar:calculator-bold-duotone"
              color="indigo"
            />
            <MetricCard
              title="Blood Sugar (Fasting) mg/dL"
              value={vitalsData?.bloodSugarFasting || "N/A"}
              icon="solar:drop-bold-duotone"
              color="red"
            />
            <MetricCard
              title="Blood Sugar (After Food) mg/dL"
              value={vitalsData?.bloodSugarAfterFood || "N/A"}
              icon="solar:drop-bold-duotone"
              color="red"
            />
          </StaggerItem>

          {/* Right Column - Charts */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Top Row removed as per user request */}

            {/* Bottom Row - AI Scans/Labs as Gauges in a Collapsible View */}
            <StaggerItem className="flex flex-col gap-6">
              {aiGaugeItems.length > 0 && (
                <>
                  {renderGaugeGroup(aiGaugeItems.filter(i => i.type === 'vital'), "Vital Signs Analysis", "solar:health-bold-duotone", "rose")}
                  {renderGaugeGroup(aiGaugeItems.filter(i => i.type === 'lab'), "Laboratory Results", "solar:test-tube-bold-duotone", "indigo")}
                  {renderGaugeGroup(aiGaugeItems.filter(i => i.type === 'scan'), "Scan & Imaging Insights", "solar:scanner-bold-duotone", "emerald")}
                </>
              )}
            </StaggerItem>
          </div>
        </div>

        {/* Overall AI Solution Section */}
        <StaggerItem>
          <Card className="p-6 md:p-8 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200/50 shadow-sm relative overflow-hidden mt-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-white shrink-0">
                  <Icon icon="solar:document-medicine-bold-duotone" className="text-3xl" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-xl m-0 tracking-tight">Overall Clinical Solution</h2>
                  <p className="text-sm font-medium text-slate-500 m-0 mt-1 max-w-2xl">
                    Generate a comprehensive AI health summary and personalized treatment plan based on the entire patient medical history.
                  </p>
                </div>
              </div>
              {!overallSolution && (
                <Button
                  onClick={handleGenerateOverallSolution}
                  loading={generatingSolution}
                  disabled={generatingSolution}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0 whitespace-nowrap"
                >
                  <Icon icon="solar:magic-stick-3-bold-duotone" className="text-lg" />
                  {generatingSolution ? "Synthesizing..." : "Generate Solution"}
                </Button>
              )}
            </div>

            {overallSolution && (
              <div className="relative z-10 bg-white p-6 md:p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="prose prose-slate prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:font-medium prose-p:text-slate-600 prose-li:font-medium prose-li:text-slate-600 max-w-none">
                  <ReactMarkdown>{overallSolution}</ReactMarkdown>
                </div>
                <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                  <Button
                    onClick={handleGenerateOverallSolution}
                    loading={generatingSolution}
                    disabled={generatingSolution}
                    variant="outline"
                    className="px-5 py-2 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50 font-bold flex items-center gap-2"
                  >
                    <Icon icon="solar:refresh-bold-duotone" className="text-lg" />
                    Regenerate Solution
                  </Button>
                </div>
              </div>
            )}
            
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
               <Icon icon="solar:medical-kit-bold-duotone" className="text-[200px] text-blue-600" />
            </div>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default PatientHealthDashboard;
