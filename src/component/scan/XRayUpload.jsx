import React, { useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";

import { StaggerContainer, StaggerItem } from "../ui/Transitions";

const XRayUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setReport("");
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an X-ray image first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("xray", file);
      formData.append("customPrompt", prompt);

      const baseUrl = "https://demo.physicianhealthnet.com/api";

      const res = await axios.post(
        `${baseUrl}/analyze-xray`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setReport(res.data.report);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.response?.data?.details || err.response?.data?.error || "Failed to analyze X-ray. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setReport("");
    setError(null);
    setPrompt("");
  };

  return (
    <StaggerContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <StaggerItem>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              AI X-Ray <span className="text-blue-500">Report Generator</span>
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">
              Upload an X-ray image and provide custom instructions for AI-powered analysis.
            </p>
          </div>
        </StaggerItem>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <StaggerItem>
            <div className="space-y-6">
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px]
                  ${preview ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50'}`}
              >
                {preview ? (
                  <div className="relative w-full h-full flex flex-col items-center gap-4">
                    <img 
                      src={preview} 
                      alt="X-ray preview" 
                      className="max-h-[200px] rounded-xl shadow-lg object-contain"
                    />
                    <button 
                      onClick={clearFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Icon icon="tabler:x" width={20} />
                    </button>
                    <p className="text-xs text-slate-500 font-medium">{file.name}</p>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Icon icon="solar:upload-minimalistic-bold-duotone" width={32} />
                    </div>
                    <div className="text-center">
                      <span className="text-blue-600 font-bold">Click to upload</span>
                      <span className="text-slate-500 block text-xs mt-1">or drag and drop X-ray image / .dcm</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,.dcm" 
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {/* Custom Prompt Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:pen-new-square-bold-duotone" className="text-blue-500" />
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Focus on the lower right lobe, or describe any specific symptoms..."
                  className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm resize-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-xl
                  ${!file || loading 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-blue-500/20'}`}
              >
                {loading ? (
                  <>
                    <Icon icon="tabler:loader-2" className="animate-spin" width={24} />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:magic-stick-3-bold-duotone" width={24} />
                    <span>Analyze X-Ray</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3">
                  <Icon icon="tabler:alert-circle" className="shrink-0 mt-0.5" width={18} />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Report Section */}
          <StaggerItem>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Icon icon="solar:document-text-bold-duotone" width={20} />
                </div>
                <h2 className="font-black text-slate-800 text-lg">AI Report Summary</h2>
              </div>

              {report ? (
                <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans">
                      {report}
                    </pre>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mt-8">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1 uppercase tracking-wider">
                      <Icon icon="tabler:alert-triangle" width={16} />
                      <span>Medical Disclaimer</span>
                    </div>
                    <p className="text-[11px] text-amber-600 leading-tight">
                      This report is AI-generated for informational purposes and should NOT replace professional diagnosis. Always have results reviewed by a licensed radiologist or physician.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Icon icon="solar:notes-minimalistic-line-duotone" width={48} className="opacity-20" />
                  <p className="text-sm font-medium">Report will appear here after analysis</p>
                </div>
              )}
            </div>
          </StaggerItem>
        </div>
      </div>
    </StaggerContainer>
  );
};

export default XRayUpload;
