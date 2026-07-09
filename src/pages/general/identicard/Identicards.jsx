import React, { useEffect, useState, useMemo, useRef } from "react";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import { Icon } from "@iconify/react";
import { message, QRCode as AntdQRCode } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";
import Button from "../../../component/ui/Button";
import Card from "../../../component/ui/Card";
import Input from "../../../component/ui/Input";
import QrScannerModal from "../../../component/scan/QrScannerModal";

// Pre-defined modern card themes with gradient colors
const CARD_THEMES = {
  blue: {
    name: "Classic Clinic Blue",
    gradient: "from-[#1b2b85] via-[#28328c] to-[#14bef0]",
    accent: "bg-[#14bef0]",
    textAccent: "text-[#14bef0]",
    borderColor: "border-[#14bef0]/30",
    bgPattern: "bg-radial-at-t",
  },
  green: {
    name: "Emerald Health Green",
    gradient: "from-[#0f5143] via-[#0f766e] to-[#0d9488]",
    accent: "bg-[#0d9488]",
    textAccent: "text-[#0d9488]",
    borderColor: "border-[#0d9488]/30",
    bgPattern: "bg-radial-at-t",
  },
  purple: {
    name: "Specialist Royal Purple",
    gradient: "from-[#3b0764] via-[#581c87] to-[#7c3aed]",
    accent: "bg-[#7c3aed]",
    textAccent: "text-[#7c3aed]",
    borderColor: "border-[#7c3aed]/30",
    bgPattern: "bg-radial-at-t",
  },
  sunset: {
    name: "Vibrant Sunset Coral",
    gradient: "from-[#881337] via-[#be123c] to-[#fb7185]",
    accent: "bg-[#fb7185]",
    textAccent: "text-[#fb7185]",
    borderColor: "border-[#fb7185]/30",
    bgPattern: "bg-radial-at-t",
  },
  cyber: {
    name: "Premium Cyber Gold",
    gradient: "from-[#0f172a] via-[#1e293b] to-[#b45309]",
    accent: "bg-[#b45309]",
    textAccent: "text-[#b45309]",
    borderColor: "border-[#b45309]/30",
    bgPattern: "bg-radial-at-t",
  },
};

// Preset elegant avatars
const PRESET_AVATARS = [
  { id: "doc_m", label: "Male Doctor", icon: "solar:user-rounded-bold", color: "bg-blue-100 text-blue-600" },
  { id: "doc_f", label: "Female Doctor", icon: "solar:user-rounded-bold", color: "bg-rose-100 text-rose-600" },
  { id: "nurse", label: "Staff Nurse", icon: "solar:user-rounded-bold", color: "bg-teal-100 text-teal-600" },
  { id: "reception", label: "Receptionist", icon: "solar:user-rounded-bold", color: "bg-purple-100 text-purple-600" },
  { id: "patient", label: "Generic Patient", icon: "solar:user-rounded-bold", color: "bg-emerald-100 text-emerald-600" },
];

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const rawBaseUrl = AxiosInstance.defaults.baseURL || "http://localhost:3026";
  const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

function Identicards({ isPublic }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId: urlPatientId } = useParams();
  const [cardType, setCardType] = useState("staff"); // 'staff' | 'patient'
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardTheme, setCardTheme] = useState("blue");
  const [layout, setLayout] = useState("vertical"); // 'vertical' | 'horizontal'
  const [isFlipped, setIsFlipped] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states for manual customization or auto-populated fields
  const [formData, setFormData] = useState({
    name: "Dr. Alexander Pierce",
    role: "Senior Cardiologist",
    dept: "Cardiology Department",
    idNumber: "PHN-D-8840",
    phone: "+1 234 567 8900",
    email: "a.pierce@phnclinic.com",
    bloodGroup: "O+",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0],
    clinicName: "PHN Global Healthcare",
    clinicLocation: "New York, USA",
    photo: "", // base64 or empty for preset
    avatarPreset: "doc_m",
  });

  const printAreaRef = useRef(null);

  const handleQrScan = (decodedText) => {
    setIsScannerOpen(false);
    try {
      const parts = decodedText.split('/');
      const id = parts[parts.length - 1]; // e.g. PHN-P-1234
      
      // Search in patients
      const patientMatch = patients.find(p => p.patientId === id);
      if (patientMatch) {
        setCardType("patient");
        handleSelectEntity(patientMatch);
        message.success("Found patient from QR code! Redirecting...");
        navigate(`/patient-details/${id}`);
        return;
      }

      // Search in staff
      const staffMatch = users.find(u => u.userId === id);
      if (staffMatch) {
        setCardType("staff");
        handleSelectEntity(staffMatch);
        message.success("Found staff from QR code!");
        return;
      }

      message.warning(`QR code scanned but user (${id}) not found in directory.`);
    } catch (err) {
      message.error("Invalid QR Code format.");
    }
  };

  // Fetch Users and Patients on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      if (isPublic && urlPatientId) {
        const res = await AxiosInstance.get(`/patient/get-by-id/${urlPatientId}`);
        if (res.data?.patient) {
          setPatients([res.data.patient]);
        }
        setLoading(false);
        return;
      }

      // 1) Fetch Users (Staff)
      const userRes = await AxiosInstance.get("/user/getAllUsers");
      setUsers(userRes.data?.user || []);

      // 2) Fetch Patients
      const userSession = sessionStorage.getItem("user");
      const loggedUser = userSession ? JSON.parse(userSession) : null;
      const clinicId = loggedUser?.clinicId;
      const patientRoute = clinicId ? `/patient/get-all-by-clinic/${clinicId}` : "/patient/get-all";
      
      const patientRes = await AxiosInstance.get(patientRoute);
      setPatients(patientRes.data?.patients || []);
    } catch (error) {
      console.error("Failed to load records:", error);
      message.error("Could not fetch latest directory from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter staff/patients based on user search
  const filteredEntities = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (cardType === "staff") {
      return users.filter(
        (u) =>
          u.userName?.toLowerCase().includes(query) ||
          u.userId?.toLowerCase().includes(query) ||
          u.userType?.toLowerCase().includes(query)
      );
    } else {
      return patients.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(query) ||
          p.patientId?.toLowerCase().includes(query) ||
          p.patientPhone?.toLowerCase().includes(query)
      );
    }
  }, [cardType, users, patients, searchQuery]);

  // Handle selecting an entity from directory
  const handleSelectEntity = (entity) => {
    if (cardType === "staff") {
      setFormData({
        name: entity.userName || "Unnamed Staff",
        role: entity.userType ? entity.userType.toUpperCase() : "Hospital Worker",
        dept: entity.department || "General Administration",
        idNumber: entity.userId || "PHN-S-0000",
        phone: entity.phone || "+1 555-0199",
        email: entity.email || "staff@phn.com",
        bloodGroup: "B+",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
        clinicName: "PHN Global Healthcare",
        clinicLocation: `Clinic ${entity.clinicId || "PHN-C-0001"}`,
        photo: "",
        avatarPreset: entity.userType === "doctor" ? "doc_m" : entity.userType === "receptionist" ? "reception" : "nurse",
      });
      message.success(`Loaded staff details: ${entity.userName}`);
    } else {
      setFormData({
        name: entity.patientName || "Unnamed Patient",
        role: "PATIENT",
        dept: "Outpatient Division",
        idNumber: entity.patientId || "PHN-P-0000",
        phone: entity.patientPhone || "+1 555-0100",
        email: entity.email || "patient@phn.com",
        bloodGroup: entity.bloodGroup || "O+",
        issueDate: new Date(entity.createdAt || new Date()).toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split("T")[0],
        clinicName: "PHN Global Healthcare",
        clinicLocation: entity.location || "Patient Registry Center",
        photo: entity.profileImg || entity.photo || "",
        avatarPreset: "patient",
      });
      message.success(`Loaded patient details: ${entity.patientName}`);
    }
  };

  // Switch card type (Staff <-> Patient) and reset some variables
  const handleCardTypeChange = (type) => {
    setCardType(type);
    setSearchQuery("");
    if (type === "staff") {
      setFormData({
        name: "Dr. Alexander Pierce",
        role: "Senior Cardiologist",
        dept: "Cardiology Department",
        idNumber: "PHN-D-8840",
        phone: "+1 234 567 8900",
        email: "a.pierce@phnclinic.com",
        bloodGroup: "O+",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0],
        clinicName: "PHN Global Healthcare",
        clinicLocation: "New York, USA",
        photo: "",
        avatarPreset: "doc_m",
      });
    } else {
      setFormData({
        name: "Eleanor Vance",
        role: "PATIENT",
        dept: "Outpatient Division",
        idNumber: "PHN-P-9921",
        phone: "+1 987 654 3210",
        email: "eleanor.v@patient.phn.com",
        bloodGroup: "A-",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split("T")[0],
        clinicName: "PHN Global Healthcare",
        clinicLocation: "Boston Center, USA",
        photo: "",
        avatarPreset: "patient",
      });
    }
  };

  // Handle local text fields change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image Upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        message.error("Photo size must be less than 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result, avatarPreset: "" }));
        message.success("Photo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      message.loading({ content: 'Sharing ID card via WhatsApp...', key: 'whatsappShare' });
      const patientId = formData.idNumber;
      if (!patientId) {
        message.error({ content: 'Patient ID is missing', key: 'whatsappShare' });
        return;
      }
      await AxiosInstance.post('/share/whatsapp-id-card', { patientId });
      message.success({ content: 'ID Card shared successfully via WhatsApp!', key: 'whatsappShare' });
    } catch (error) {
      console.error(error);
      message.error({ content: 'Failed to share ID card. Please try again.', key: 'whatsappShare' });
    }
  };

  // High quality print helper
  const handlePrint = () => {
    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>PHN Hospital Identicard - ${formData.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { margin: 0; padding: 0; background-color: #fff; }
              .no-print { display: none !important; }
              .print-container {
                display: block !important;
              }
              .card-wrapper {
                page-break-after: always;
                break-after: page;
                margin: 0 auto !important;
                padding: 40px 0;
                display: flex !important;
                justify-content: center !important;
                box-sizing: border-box;
              }
              .card-wrapper:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
            }
            /* Screen view styles for the print tab */
            .card-wrapper {
              margin-bottom: 2rem;
              display: flex;
              justify-content: center;
            }
            .card-theme-gradient {
              background: linear-gradient(135deg, ${
                cardTheme === "blue" ? "#1b2b85, #28328c, #14bef0" :
                cardTheme === "green" ? "#0f5143, #0f766e, #0d9488" :
                cardTheme === "purple" ? "#3b0764, #581c87, #7c3aed" :
                cardTheme === "sunset" ? "#881337, #be123c, #fb7185" :
                "#0f172a, #1e293b, #b45309"
              });
            }
            /* Tailwind v2 compatibility fixes */
            .line-clamp-1 {
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body class="flex flex-col items-center p-8 bg-slate-50 min-h-screen">
          <div class="print-container w-full">
            ${printContent}
          </div>
          <div class="mt-8 text-center no-print">
            <button onclick="window.print()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all">
              Print Now
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
    const element = printAreaRef.current;
    if (!element) return;
    
    try {
      message.loading({ content: 'Generating high-quality Image...', key: 'imgGen' });

      // Temporarily make the element visible for capturing if it's hidden out of viewport
      const originalPosition = element.style.position;
      const originalTop = element.style.top;
      const originalLeft = element.style.left;
      
      // To ensure perfect rendering with html-to-image, it's best if the element is in the viewport temporarily
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '-9999';

      // Small delay to let browser reflow
      await new Promise(res => setTimeout(res, 100));

      const scale = 4;
      const dataUrl = await htmlToImage.toPng(element, { quality: 1.0, pixelRatio: scale });
      
      // Restore styles
      element.style.position = originalPosition;
      element.style.top = originalTop;
      element.style.left = originalLeft;

      // Create an anchor element to trigger the download
      const link = document.createElement('a');
      link.download = `${formData.name.replace(/\s+/g, '_')}_ID_Card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success({ content: 'ID Card Downloaded Successfully!', key: 'imgGen' });
    } catch (error) {
      console.error('Failed to generate Image:', error);
      message.error({ content: `Failed to generate Image: ${error.message || 'Unknown error'}`, key: 'imgGen', duration: 5 });
    }
  };

  useEffect(() => {
    if (patients.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const patientIdParam = urlPatientId || searchParams.get("patientId");
      const autostartParam = searchParams.get("autostart");
      
      if (patientIdParam) {
        setCardType("patient");
        const found = patients.find(p => p.patientId === patientIdParam);
        if (found) {
          setFormData({
            name: found.patientName || "Unnamed Patient",
            role: "PATIENT",
            dept: "Outpatient Division",
            idNumber: found.patientId || "PHN-P-0000",
            phone: found.patientPhone || "+1 555-0100",
            email: found.email || "patient@phn.com",
            bloodGroup: found.bloodGroup || "O+",
            issueDate: new Date(found.createdAt || new Date()).toISOString().split("T")[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split("T")[0],
            clinicName: "PHN Global Healthcare",
            clinicLocation: found.location || "Patient Registry Center",
            photo: found.profileImg || found.photo || "",
            avatarPreset: "patient",
          });
          
        }
      }
    }
  }, [patients, location.search]);

  // Auto-trigger download or print ONLY AFTER form data has successfully updated
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const patientIdParam = urlPatientId || searchParams.get("patientId");
    const autostartParam = searchParams.get("autostart");

    if (patientIdParam && formData.idNumber === patientIdParam) {
      if (autostartParam === "true") {
        const timer = setTimeout(() => {
          handlePrint();
        }, 1000);
        return () => clearTimeout(timer);
      }
      
      if (isPublic) {
        const timer = setTimeout(() => {
          handleDownloadImage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.idNumber, isPublic, location.search, urlPatientId]);

  // Colors based on theme selection
  const theme = CARD_THEMES[cardTheme];

  // Helper component to render photo or preset avatar
  const CardAvatar = () => {
    if (formData.photo) {
      return (
        <img
          src={getImageUrl(formData.photo)}
          alt={formData.name}
          className="w-full h-full object-cover rounded-xl border-2 border-white/60 shadow-md"
        />
      );
    }
    const preset = PRESET_AVATARS.find((p) => p.id === formData.avatarPreset) || PRESET_AVATARS[0];
    return (
      <div className={`w-full h-full rounded-xl border-2 border-white/60 shadow-md flex flex-col items-center justify-center ${preset.color}`}>
        <Icon icon={preset.icon} className="text-4xl" />
        <span className="text-[9px] font-black uppercase mt-1 tracking-wider opacity-85">PRESET</span>
      </div>
    );
  };

  // Helper component to render QR code dynamically (uses SVG type for print compatibility)
  const QRCode = ({ size = 36 }) => {
    const origin = "https://demo.physicianhealthnet.com";
    const qrValue = `${origin}/patient-details/${formData.idNumber}`;
    return (
      <div 
        className="bg-white rounded flex items-center justify-center shrink-0 shadow-md"
        style={{ width: `${size}px`, height: `${size}px`, padding: "3px" }}
      >
        <AntdQRCode
          value={qrValue}
          size={size - 6}
          type="svg"
          bordered={false}
        />
      </div>
    );
  };

  if (isPublic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <style>{`
          @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-container { display: flex !important; justify-content: center; align-items: center; min-height: 100vh; }
            .card-wrapper {
               -webkit-print-color-adjust: exact;
               print-color-adjust: exact;
               margin: 0 auto !important;
            }
          }
        `}</style>
        
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mb-8 no-print">
          <Icon icon="solar:check-circle-bold-duotone" className="text-7xl text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">ID Card Ready</h2>
          <p className="text-slate-500 font-medium mb-6">Your secure digital ID card has been generated. Use the button below to save it as a high-quality image.</p>
          <button onClick={handleDownloadImage} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all w-full flex items-center justify-center gap-2">
            <Icon icon="solar:download-bold" className="text-xl" />
            Download ID Card Image
          </button>
        </div>

        <div className="absolute pointer-events-none" style={{ top: "-9999px", left: "-9999px" }}>
          <div ref={printAreaRef}>
            {/* We force vertical layout for download since it fits standard letter/A4 better */}
            <div className="card-wrapper" style={{ margin: "40px auto" }}>
              <div 
                className="rounded-2xl shadow-xl overflow-hidden relative text-white flex flex-col"
                style={{ width: "300px", height: "480px" }}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} opacity-90`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full -ml-16 -mb-16" />
                <div className="relative z-10 flex flex-col h-full p-6 items-center justify-between">
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-lg bg-white/30 flex items-center justify-center shadow-inner border border-white/30">
                        <Icon icon="solar:health-bold" className="text-2xl text-white" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-black tracking-widest uppercase text-white/90" style={{ fontSize: "10px" }}>
                          {formData.clinicName}
                        </h3>
                        <p className="text-white/70 font-semibold" style={{ fontSize: "8px" }}>MEDICAL IDENTITY</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-2xl p-1 bg-white/30 shadow-xl mb-4 relative z-20">
                        <CardAvatar />
                      </div>
                      <div className="text-center w-full">
                        <h2 className="text-xl font-black tracking-tight leading-tight truncate">{formData.name}</h2>
                        <p className={`font-black uppercase tracking-widest mt-1 ${theme.textAccent}`} style={{ fontSize: "11px" }}>
                          {formData.role}
                        </p>
                      </div>
                      <div className="mt-4 w-full bg-white/20 rounded-xl p-3 border border-white/20 shadow-inner">
                        <div className="flex flex-col gap-1 text-center">
                          <p className="text-white/80 font-medium truncate" style={{ fontSize: "11px" }}>Dept: {formData.dept}</p>
                          <p className="font-mono text-white/90 font-bold" style={{ fontSize: "12px" }}>ID: {formData.idNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/20 pt-4 flex justify-between items-end w-full">
                    <QRCode size={65} />
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-white/60" style={{ fontSize: "9px" }}>SCAN FOR VERIFICATION</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StaggerContainer>
      {/* QR Scanner Modal */}
      <QrScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleQrScan} 
      />

      <div className="flex flex-col gap-10 p-6 md:p-10 bg-white/70 rounded backdrop-blur-3xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] min-h-[900px]">
        {/* Upper Title Area */}
        <StaggerItem>
          <div className="flex flex-col gap-1">
            <h1 className="font-black text-slate-800 text-4xl tracking-tight flex items-center gap-3">
              Administration <span className="text-blue-500 font-extrabold">& Identicard Center</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Generate premium dual-sided identity cards for medical workers, doctors, nurses, receptionists, and patients.
            </p>
          </div>
        </StaggerItem>

        <StaggerItem className="w-full">
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            
            {/* Left Side: Directory and Configuration Panels (58.3%) */}
            <div className="w-full lg:w-7/12 flex flex-col gap-8">
          
          {/* Card Category Selection & Directory */}
          <Card title="1. Select User from Directory" className="bg-white/70 backdrop-blur border-slate-200">
            <div className="flex gap-4 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => handleCardTypeChange("staff")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${cardType === "staff" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon icon="solar:stethoscope-bold" className="text-lg text-blue-500" />
                Hospital Staff Directory ({users.length})
              </button>
              <button
                onClick={() => handleCardTypeChange("patient")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${cardType === "patient" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon icon="solar:users-group-two-rounded-bold" className="text-lg text-rose-500" />
                Active Patients ({patients.length})
              </button>
            </div>

            {/* Live Search Directory */}
            <div className="flex gap-3 mb-4">
              <Button onClick={() => setIsScannerOpen(true)} variant="secondary" className="px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 shadow-none">
                <Icon icon="solar:scanner-bold-duotone" className="text-xl" />
              </Button>
              <div className="relative flex-1">
                <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type="text"
                  placeholder={`Search ${cardType === "staff" ? "staff members (Dr, nurse, admin)..." : "patients by name or ID..."}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/50 text-slate-700 font-medium"
                />
              </div>
              <Button onClick={fetchData} variant="secondary" className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-none">
                <Icon icon="solar:restart-bold" className={`text-xl text-slate-600 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Quick Choice Dropdown Grid */}
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
              {loading ? (
                <div className="py-8 text-center text-slate-400 font-medium flex items-center justify-center gap-2">
                  <Icon icon="solar:spinner-linear" className="animate-spin text-lg" /> Loading directory...
                </div>
              ) : filteredEntities.length > 0 ? (
                filteredEntities.map((entity, idx) => {
                  const name = cardType === "staff" ? entity.userName : entity.patientName;
                  const id = cardType === "staff" ? entity.userId : entity.patientId;
                  const tag = cardType === "staff" ? entity.userType : "PATIENT";
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectEntity(entity)}
                      className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-none mb-1">{name}</p>
                          <p className="text-xs text-slate-400 font-medium">{id}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                        ${tag === "doctor" || tag === "DOCTOR" ? "bg-blue-100 text-blue-600" :
                          tag === "receptionist" ? "bg-purple-100 text-purple-600" :
                          tag === "PATIENT" ? "bg-rose-100 text-rose-600" :
                          "bg-emerald-100 text-emerald-600"}`}
                      >
                        {tag}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 font-semibold">
                  No records matching search query.
                </div>
              )}
            </div>
          </Card>

          {/* Form Editor */}
          <Card title="2. Customize Card Information" className="bg-white/70 backdrop-blur border-slate-200">
            <form className="flex flex-col gap-6">
              
              {/* Photo Options */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2.5 block">
                  Profile Photo Source
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset Avatar Selection */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-400">Choose Preset avatar:</span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatarPreset: p.id, photo: "" }))}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            formData.avatarPreset === p.id && !formData.photo
                              ? "ring-2 ring-blue-500 ring-offset-2 scale-105"
                              : "hover:bg-slate-100"
                          } ${p.color}`}
                          title={p.label}
                        >
                          <Icon icon={p.icon} className="text-xl" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual File Upload */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-400">Or Upload Profile Image:</span>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="avatar-file-input"
                      />
                      <label
                        htmlFor="avatar-file-input"
                        className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-600 transition-all"
                      >
                        <Icon icon="solar:upload-bold" className="text-lg text-blue-500" />
                        {formData.photo ? "Replace Photo" : "Upload Custom JPG/PNG"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Full Name</label>
                  <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Designation / Role</label>
                  <Input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="Designation" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Department / Division</label>
                  <Input type="text" name="dept" value={formData.dept} onChange={handleChange} placeholder="Department" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">ID Identifier</label>
                  <Input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="ID Identification" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Phone</label>
                  <Input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/50 text-slate-700 font-semibold text-sm"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not Selected"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Hospital Location</label>
                  <Input type="text" name="clinicLocation" value={formData.clinicLocation} onChange={handleChange} placeholder="Clinic Location" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Issue Date</label>
                  <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Expiry Date</label>
                  <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium" />
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Side: Interactive Real-time Dual-Sided Card Preview (41.6%) */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6 sticky top-6">
          
          {/* Visual Settings Controls */}
          <Card title="Interactive Preview Options" className="bg-white/70 backdrop-blur border-slate-200">
            {/* Theme selector */}
            <div className="mb-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
                Premium Color Themes
              </label>
              <div className="flex gap-2.5">
                {Object.entries(CARD_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setCardTheme(key)}
                    className={`w-9 h-9 rounded-full relative flex items-center justify-center transition-transform hover:scale-110 shadow
                      bg-linear-to-tr ${t.gradient}
                      ${cardTheme === key ? "ring-2 ring-offset-2 ring-slate-900 scale-105" : ""}`}
                    title={t.name}
                  >
                    {cardTheme === key && <Icon icon="solar:check-read-bold" className="text-white text-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Orientation Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLayout("vertical")}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2
                  ${layout === "vertical" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                <Icon icon="solar:smartphone-line-duotone" className="text-lg" />
                Vertical (CR80)
              </button>
              <button
                onClick={() => setLayout("horizontal")}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2
                  ${layout === "horizontal" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                <Icon icon="solar:smartphone-rotate-orientation-bold-duotone" className="text-lg" />
                Horizontal
              </button>
            </div>
          </Card>

          {/* Dual-Sided Card Animation Box */}
          <div className="flex flex-col items-center justify-center py-6">
            
            <div
              key={layout}
              className={`relative transition-all duration-700 ease-in-out`}
              style={{
                perspective: "1000px",
                width: layout === "vertical" ? "320px" : "480px",
                height: layout === "vertical" ? "500px" : "300px",
              }}
            >
              {/* Inner animated flipper */}
              <div
                className="w-full h-full relative"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                
                {/* ---------------- CARD FRONT SIDE ---------------- */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/20 select-none text-white card-theme-gradient"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${
                      cardTheme === "blue" ? "#1b2b85, #28328c, #14bef0" :
                      cardTheme === "green" ? "#0f5143, #0f766e, #0d9488" :
                      cardTheme === "purple" ? "#3b0764, #581c87, #7c3aed" :
                      cardTheme === "sunset" ? "#881337, #be123c, #fb7185" :
                      "#0f172a, #1e293b, #b45309"
                    })`,
                  }}
                >
                  {/* Holographic Security Overlay details */}
                  <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 mix-blend-overlay pointer-events-none" />
                  
                  {/* Card Front Content Layout */}
                  {layout === "vertical" ? (
                    // Vertical Front Layout
                    <div className="w-full h-full p-6 flex flex-col justify-between relative">
                      
                      {/* Hospital Brand Header */}
                      <div className="flex items-center justify-between border-b border-white/15 pb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-md">
                            <span className="font-black text-[#28328c] text-sm">PHN</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[12px] uppercase leading-none tracking-tight">PHN Healthcare</h4>
                            <span className="text-[8px] text-white/70 leading-none">Global Wellness</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm`}>
                          {formData.role === "PATIENT" ? "Patient" : "Staff"}
                        </span>
                      </div>

                      {/* Hologram Graphic */}
                      <div className="flex justify-end items-center py-2">
                        <Icon icon="solar:magnetic-card-bold-duotone" className="text-2xl text-white/30" />
                      </div>

                      {/* Profile Photo Area */}
                      <div className="flex flex-col items-center justify-center my-3 relative">
                        <div className="w-28 h-28 relative">
                          <CardAvatar />
                          {/* Inner glowing ring */}
                          <div className="absolute inset-0 rounded-xl border border-white/40 pointer-events-none" />
                        </div>
                      </div>

                      {/* User Core Data */}
                      <div className="text-center">
                        <h2 className="text-lg font-black tracking-tight leading-tight line-clamp-1">{formData.name}</h2>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${theme.textAccent}`}>
                          {formData.role}
                        </p>
                        <p className="text-[10px] text-white/80 font-medium leading-none mt-1.5">{formData.dept}</p>
                      </div>

                      {/* Identification / QR Code Footer */}
                      <div className="border-t border-white/15 pt-3 mt-2 flex items-center justify-between w-full px-2">
                        <div className="text-[10px] font-black font-mono bg-black/20 px-2 py-0.5 rounded text-white/90">
                          ID: {formData.idNumber}
                        </div>
                        <QRCode size={90} />
                      </div>
                    </div>
                  ) : (
                    // Horizontal Front Layout
                    <div className="w-full h-full p-6 flex flex-col justify-between relative">
                      
                      {/* Upper Header */}
                      <div className="flex justify-between items-center border-b border-white/15 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
                            <span className="font-black text-[#28328c] text-sm">PHN</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[12px] uppercase leading-none tracking-tight">PHN Global Healthcare</h4>
                            <span className="text-[8px] text-white/70 leading-none">Medical Center Services</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm`}>
                          {formData.role === "PATIENT" ? "Patient" : "Staff"}
                        </span>
                      </div>

                      {/* Middle Flex Group */}
                      <div className="flex gap-4 items-center flex-1 py-2 w-full">
                        {/* Avatar */}
                        <div className="w-1/3 flex justify-center shrink-0">
                          <div className="w-22 h-22 relative">
                            <CardAvatar />
                          </div>
                        </div>
                        {/* Core details */}
                        <div className="w-2/3 flex flex-col gap-1 min-w-0">
                          <div>
                            <h2 className="text-[17px] font-black tracking-tight leading-tight line-clamp-1">{formData.name}</h2>
                            <p className={`text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 ${theme.textAccent}`}>
                              {formData.role}
                            </p>
                          </div>
                          
                          <div className="text-[10px] text-white/80 font-medium flex flex-col gap-0.5 mt-1">
                            <p className="line-clamp-1">Dept: {formData.dept}</p>
                            <p className="font-mono text-white/90">ID Number: {formData.idNumber}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Grid */}
                      <div className="border-t border-white/15 pt-2 flex justify-between items-center">
                        <QRCode size={75} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-white/60">SECURE ID</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ---------------- CARD BACK SIDE ---------------- */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/20 select-none text-white bg-slate-950"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {layout === "vertical" ? (
                    // Vertical Back Layout
                    <div className="w-full h-full flex flex-col justify-between relative bg-slate-900">
                      {/* Magnetic Stripe graphic */}
                      <div className="w-full h-11 bg-slate-950 border-b border-slate-800 shrink-0" />

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        {/* Guidelines terms */}
                        <div className="text-[8px] text-slate-400 font-medium leading-relaxed text-left">
                          <p className="font-bold text-slate-300 uppercase mb-1">Terms & Security Regulations</p>
                          This identity document is the property of PHN Global Healthcare Services and is non-transferable. Loss must be reported immediately to security. Unauthorized duplication is strictly prohibited.
                        </div>

                        {/* User metadata & details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 my-2.5 text-[9.5px]">
                          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800 text-left">
                            <span className="text-slate-400 block text-[7.5px] uppercase font-bold leading-none mb-0.5">Blood Group</span>
                            <span className="font-black text-rose-500">{formData.bloodGroup}</span>
                          </div>
                          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800 text-left">
                            <span className="text-slate-400 block text-[7.5px] uppercase font-bold leading-none mb-0.5">Clinic Location</span>
                            <span className="font-extrabold text-slate-200 truncate block">{formData.clinicLocation}</span>
                          </div>
                          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800 text-left">
                            <span className="text-slate-400 block text-[7.5px] uppercase font-bold leading-none mb-0.5">Issued Date</span>
                            <span className="font-bold text-slate-300">{formData.issueDate}</span>
                          </div>
                          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800 text-left">
                            <span className="text-slate-400 block text-[7.5px] uppercase font-bold leading-none mb-0.5">Expiry Date</span>
                            <span className="font-bold text-slate-300">{formData.expiryDate}</span>
                          </div>
                        </div>

                        {/* Contact metadata */}
                        <div className="border-t border-slate-800 pt-2 flex flex-col gap-0.5 text-[8.5px] text-slate-400 text-left">
                          <div className="flex items-center gap-1.5">
                            <Icon icon="solar:phone-bold" className="text-xs text-slate-500" />
                            <span>Phone: {formData.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon icon="solar:letter-bold" className="text-xs text-slate-500" />
                            <span>Email: {formData.email}</span>
                          </div>
                        </div>

                        {/* Signature graphic & Security QR */}
                        <div className="flex justify-between items-end border-t border-slate-800 pt-2.5 mt-2.5">
                          <div className="flex flex-col gap-1 w-3/5 text-left">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-wider leading-none">Authorized Signature</span>
                            <div className="h-6 border-b border-slate-800 flex items-end pb-1 font-serif italic text-sm text-slate-300 font-extrabold tracking-wide select-none">
                              Alexander P.
                            </div>
                          </div>
                          <QRCode size={90} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Horizontal Back Layout
                    <div className="w-full h-full flex flex-col justify-between relative bg-slate-900">
                      {/* Magnetic Stripe graphic */}
                      <div className="w-full h-8 bg-slate-950 border-b border-slate-800 shrink-0" />

                      <div className="p-4 flex-1 flex gap-4 justify-between min-h-0">
                        {/* Left Column: Guidelines + Contact */}
                        <div className="w-1/2 flex flex-col justify-between text-left">
                          <div className="text-[7.5px] text-slate-400 font-medium leading-relaxed">
                            <p className="font-bold text-slate-300 uppercase mb-0.5">Terms & Security Regulations</p>
                            This identity document is the property of PHN Global Healthcare Services and is non-transferable. Loss must be reported immediately to security. Unauthorized duplication is strictly prohibited.
                          </div>
                          
                          <div className="border-t border-slate-800 pt-1.5 flex flex-col gap-0.5 text-[8px] text-slate-400 mt-2">
                            <div className="flex items-center gap-1">
                              <Icon icon="solar:phone-bold" className="text-[10px] text-slate-500" />
                              <span className="truncate">Phone: {formData.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon="solar:letter-bold" className="text-[10px] text-slate-500" />
                              <span className="truncate">Email: {formData.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Grid Info + Signature / QR */}
                        <div className="w-1/2 flex flex-col justify-between border-l border-slate-800 pl-4 text-left">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px]">
                            <div className="bg-slate-950/40 p-1 rounded border border-slate-800">
                              <span className="text-slate-400 block text-[6.5px] uppercase font-bold leading-none mb-0.5">Blood Group</span>
                              <span className="font-black text-rose-500">{formData.bloodGroup}</span>
                            </div>
                            <div className="bg-slate-950/40 p-1 rounded border border-slate-800">
                              <span className="text-slate-400 block text-[6.5px] uppercase font-bold leading-none mb-0.5">Location</span>
                              <span className="font-extrabold text-slate-200 truncate block">{formData.clinicLocation}</span>
                            </div>
                            <div className="bg-slate-950/40 p-1 rounded border border-slate-800">
                              <span className="text-slate-400 block text-[6.5px] uppercase font-bold leading-none mb-0.5">Issued</span>
                              <span className="font-bold text-slate-300">{formData.issueDate}</span>
                            </div>
                            <div className="bg-slate-950/40 p-1 rounded border border-slate-800">
                              <span className="text-slate-400 block text-[6.5px] uppercase font-bold leading-none mb-0.5">Expiry</span>
                              <span className="font-bold text-slate-300">{formData.expiryDate}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-end gap-2 mt-2">
                            <div className="flex flex-col gap-0.5 flex-1">
                              <span className="text-[6.5px] text-slate-500 uppercase font-black leading-none">Auth Signature</span>
                              <div className="h-5 border-b border-slate-800 flex items-end pb-0.5 font-serif italic text-xs text-slate-300 font-extrabold tracking-wide select-none">
                                Alexander P.
                              </div>
                            </div>
                            <QRCode size={75} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Flip Card Trigger & Export Actions */}
            <div className="flex gap-4 mt-8 w-full max-w-2xl justify-center">
              <Button
                onClick={() => setIsFlipped(!isFlipped)}
                variant="secondary"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 shadow border border-slate-200 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              >
                <Icon icon="solar:refresh-square-bold-duotone" className="text-xl text-blue-500" />
                <span className="font-extrabold text-sm">Flip Card Preview</span>
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              >
                <Icon icon="solar:printer-minimalistic-bold-duotone" className="text-xl" />
                <span className="font-extrabold text-sm">Print ID Card</span>
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              >
                <Icon icon="solar:chat-round-line-bold" className="text-xl" />
                <span className="font-extrabold text-sm">Share via WhatsApp</span>
              </Button>
            </div>
            
          </div>

        </div>

      </div>
      </StaggerItem>

      {/* Hidden print element containing absolute front and back card layouts */}
      <div className="hidden">
        <div ref={printAreaRef}>
          {layout === "vertical" ? (
            <>
              {/* Print Front Side - Vertical */}
              <div className="card-wrapper">
                <div 
                  className="rounded-2xl shadow-xl overflow-hidden text-white flex flex-col justify-between p-6 relative card-theme-gradient"
                  style={{ width: "320px", height: "500px" }}
                >
                  <div className="flex items-center justify-between border-b border-white/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                        <span className="font-black text-[#28328c] text-sm">PHN</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold uppercase leading-none" style={{ fontSize: "12px" }}>PHN Healthcare</h4>
                        <span className="text-white/70 leading-none" style={{ fontSize: "8px" }}>Global Wellness</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-white/20" style={{ fontSize: "8px" }}>
                      {formData.role === "PATIENT" ? "Patient" : "Staff"}
                    </span>
                  </div>

                  <div className="flex justify-end items-center py-2">
                    <Icon icon="solar:magnetic-card-bold-duotone" className="text-2xl text-white/30" />
                  </div>

                  <div className="flex flex-col items-center justify-center my-3 relative">
                    <div className="w-28 h-28 relative">
                      <CardAvatar />
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-lg font-black tracking-tight leading-tight line-clamp-1">{formData.name}</h2>
                    <p className={`font-black uppercase tracking-widest mt-0.5 ${theme.textAccent}`} style={{ fontSize: "10px" }}>
                      {formData.role}
                    </p>
                    <p className="text-white/80 font-medium leading-none mt-1.5" style={{ fontSize: "10px" }}>{formData.dept}</p>
                  </div>

                  <div className="border-t border-white/20 pt-3 flex items-center justify-between w-full px-2">
                    <div className="font-black font-mono bg-black/25 px-2 py-0.5 rounded text-white/95" style={{ fontSize: "10px" }}>
                      ID: {formData.idNumber}
                    </div>
                    <QRCode size={90} />
                  </div>
                </div>
              </div>

              {/* Print Back Side - Vertical */}
              <div className="card-wrapper">
                <div 
                  className="rounded-2xl shadow-xl overflow-hidden text-white flex flex-col justify-between border"
                  style={{ width: "320px", height: "500px", backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                >
                  <div className="w-full h-11 shrink-0" style={{ backgroundColor: "#020617", borderBottom: "1px solid #1e293b" }} />
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="font-medium leading-relaxed text-left" style={{ fontSize: "8.5px", color: "#94a3b8" }}>
                      <p className="font-bold text-slate-300 uppercase mb-1" style={{ color: "#cbd5e1" }}>Terms & Security Regulations</p>
                      This identity document is the property of PHN Global Healthcare Services and is non-transferable. Loss must be reported immediately to security. Unauthorized duplication is strictly prohibited.
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 my-2.5" style={{ fontSize: "9.5px" }}>
                      <div className="p-1.5 rounded border text-left" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                        <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "7.5px", color: "#94a3b8" }}>Blood Group</span>
                        <span className="font-black text-rose-500">{formData.bloodGroup}</span>
                      </div>
                      <div className="p-1.5 rounded border text-left" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                        <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "7.5px", color: "#94a3b8" }}>Clinic Location</span>
                        <span className="font-extrabold text-slate-200 truncate block" style={{ color: "#e2e8f0" }}>{formData.clinicLocation}</span>
                      </div>
                      <div className="p-1.5 rounded border text-left" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                        <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "7.5px", color: "#94a3b8" }}>Issued Date</span>
                        <span className="font-bold text-slate-300" style={{ color: "#cbd5e1" }}>{formData.issueDate}</span>
                      </div>
                      <div className="p-1.5 rounded border text-left" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                        <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "7.5px", color: "#94a3b8" }}>Expiry Date</span>
                        <span className="font-bold text-slate-300" style={{ color: "#cbd5e1" }}>{formData.expiryDate}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-0.5 text-left" style={{ borderTop: "1px solid #1e293b", color: "#94a3b8", fontSize: "8.5px" }}>
                      <div>Phone: {formData.phone}</div>
                      <div>Email: {formData.email}</div>
                    </div>

                    <div className="flex justify-between items-end pt-2.5 mt-2.5" style={{ borderTop: "1px solid #1e293b" }}>
                      <div className="flex flex-col gap-1 w-3/5 text-left">
                        <span className="uppercase font-black leading-none" style={{ fontSize: "7px", color: "#64748b" }}>Authorized Signature</span>
                        <div className="h-6 flex items-end pb-1 font-serif italic text-sm text-slate-300 font-extrabold" style={{ borderBottom: "1px solid #1e293b", color: "#cbd5e1" }}>
                          Alexander P.
                        </div>
                      </div>
                      <QRCode size={90} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Print Front Side - Horizontal */}
              <div className="card-wrapper">
                <div 
                  className="rounded-2xl shadow-xl overflow-hidden text-white flex flex-col justify-between p-6 relative card-theme-gradient"
                  style={{ width: "480px", height: "300px" }}
                >
                  <div className="flex justify-between items-center border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
                        <span className="font-black text-[#28328c] text-sm">PHN</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold uppercase leading-none tracking-tight" style={{ fontSize: "12px" }}>PHN Global Healthcare</h4>
                        <span className="text-white/70 leading-none" style={{ fontSize: "8px" }}>Medical Center Services</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-white/20" style={{ fontSize: "8px" }}>
                      {formData.role === "PATIENT" ? "Patient" : "Staff"}
                    </span>
                  </div>

                  <div className="flex gap-4 items-center flex-1 py-2 w-full">
                    <div className="w-1/3 flex justify-center shrink-0">
                      <div className="w-22 h-22 relative">
                        <CardAvatar />
                      </div>
                    </div>
                    <div className="w-2/3 flex flex-col gap-1 min-w-0 text-left">
                      <div>
                        <h2 className="font-black tracking-tight leading-tight line-clamp-1" style={{ fontSize: "17px" }}>{formData.name}</h2>
                        <p className={`font-black uppercase tracking-widest leading-none mt-0.5 ${theme.textAccent}`} style={{ fontSize: "10px" }}>
                          {formData.role}
                        </p>
                      </div>
                      
                      <div className="text-white/80 font-medium flex flex-col gap-0.5 mt-1" style={{ fontSize: "10px" }}>
                        <p className="line-clamp-1">Dept: {formData.dept}</p>
                        <p className="font-mono text-white/90">ID Number: {formData.idNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/15 pt-2 flex justify-between items-center w-full">
                    <QRCode size={75} />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white/60" style={{ fontSize: "9px" }}>SECURE ID</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Back Side - Horizontal */}
              <div className="card-wrapper">
                <div 
                  className="rounded-2xl shadow-xl overflow-hidden text-white flex flex-col justify-between border"
                  style={{ width: "480px", height: "300px", backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                >
                  <div className="w-full h-8 shrink-0" style={{ backgroundColor: "#020617", borderBottom: "1px solid #1e293b" }} />

                  <div className="p-4 flex-1 flex gap-4 justify-between min-h-0">
                    {/* Left Column: Guidelines + Contact */}
                    <div className="w-1/2 flex flex-col justify-between text-left">
                      <div className="font-medium leading-relaxed" style={{ fontSize: "7.5px", color: "#94a3b8" }}>
                        <p className="font-bold text-slate-300 uppercase mb-0.5" style={{ fontSize: "8px", color: "#cbd5e1" }}>Terms & Security Regulations</p>
                        This identity document is the property of PHN Global Healthcare Services and is non-transferable. Loss must be reported immediately to security. Unauthorized duplication is strictly prohibited.
                      </div>
                      
                      <div className="pt-1.5 flex flex-col gap-0.5 mt-2" style={{ fontSize: "8px", borderTop: "1px solid #1e293b", color: "#94a3b8" }}>
                        <div>Phone: {formData.phone}</div>
                        <div>Email: {formData.email}</div>
                      </div>
                    </div>

                    {/* Right Column: Grid Info + Signature / QR */}
                    <div className="w-1/2 flex flex-col justify-between pl-4 text-left" style={{ borderLeft: "1px solid #1e293b" }}>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1" style={{ fontSize: "8.5px" }}>
                        <div className="p-1 rounded border" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                          <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "6.5px", color: "#94a3b8" }}>Blood Group</span>
                          <span className="font-black text-rose-500">{formData.bloodGroup}</span>
                        </div>
                        <div className="p-1 rounded border" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                          <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "6.5px", color: "#94a3b8" }}>Location</span>
                          <span className="font-extrabold text-slate-200 truncate block" style={{ color: "#e2e8f0" }}>{formData.clinicLocation}</span>
                        </div>
                        <div className="p-1 rounded border" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                          <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "6.5px", color: "#94a3b8" }}>Issued</span>
                          <span className="font-bold text-slate-300" style={{ color: "#cbd5e1" }}>{formData.issueDate}</span>
                        </div>
                        <div className="p-1 rounded border" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)", borderColor: "#1e293b" }}>
                          <span className="block uppercase font-bold leading-none mb-0.5" style={{ fontSize: "6.5px", color: "#94a3b8" }}>Expiry</span>
                          <span className="font-bold text-slate-300" style={{ color: "#cbd5e1" }}>{formData.expiryDate}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end gap-2 mt-2">
                        <div className="flex flex-col gap-0.5 flex-1">
                          <span className="uppercase font-black leading-none" style={{ fontSize: "6.5px", color: "#64748b" }}>Auth Signature</span>
                          <div className="h-5 flex items-end pb-0.5 font-serif italic font-extrabold" style={{ color: "#cbd5e1", fontSize: "11px" }}>
                            Alexander P.
                          </div>
                        </div>
                        <QRCode size={75} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      </div>
    </StaggerContainer>
  );
}

export default Identicards;
