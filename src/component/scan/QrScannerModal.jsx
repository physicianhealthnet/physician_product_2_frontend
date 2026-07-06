import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QrScannerModal = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset error when opened
    setError(null);

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        // Success callback
        html5QrcodeScanner.clear(); // Stop scanning once we get a result
        onScan(decodedText);
      },
      (errorMessage) => {
        // We can optionally ignore continuous scan errors, but if we need to show them:
        // setError("Scanning..."); // Usually it's just noisy because it scans constantly
      }
    );

    scannerRef.current = html5QrcodeScanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Icon icon="solar:scanner-bold-duotone" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Scan QR Code</h2>
              <p className="text-xs text-slate-500 font-medium">Scan patient or staff ID card</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <Icon icon="solar:close-circle-bold" className="text-2xl" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-6">
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50"></div>
          {error && <p className="text-red-500 text-sm mt-4 text-center font-medium">{error}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QrScannerModal;
