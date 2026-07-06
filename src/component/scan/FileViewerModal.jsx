import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import cornerstone from 'cornerstone-core';
import dicomParser from 'dicom-parser';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import Hammer from 'hammerjs';

// Setup cornerstone and tools
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

// Initialize tools
// React functional component might re-run this, be careful.
let isCornerstoneInitialized = false;

const initCornerstone = () => {
  if (!isCornerstoneInitialized) {
    cornerstoneWADOImageLoader.configure({
      beforeSend: function (xhr) {
        // Add custom headers here (e.g. auth tokens)
      }
    });

    cornerstoneWADOImageLoader.webWorkerManager.initialize({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
      startWebWorkersOnDemand: true,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false,
          usePDFJS: false,
          strict: false,
        },
      },
    });

    try {
      cornerstoneTools.init();
    } catch (e) {
      console.warn("Cornerstone Tools already initialized");
    }

    isCornerstoneInitialized = true;
  }
};

const FileViewerModal = ({ fileUrl, onClose }) => {
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine file type from extension
  const getFileType = (url) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop().toLowerCase();
    
    // Explicit DICOM test OR assume file without extension is DICOM if they requested it? 
    // Usually DICOM files end with .dcm or .dicom
    if (['dcm', 'dicom'].includes(extension)) return 'dicom';
    
    // Basic image types
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
    
    // Documents
    if (['pdf'].includes(extension)) return 'pdf';

    // Default fallback to unknown
    return 'unknown';
  };

  const fileType = getFileType(fileUrl);
  // Using WADO URI scheme for DICOM
  const dicomUrl = fileType === 'dicom' ? `wadouri:${fileUrl}` : fileUrl;

  useEffect(() => {
    if (!fileUrl) {
      setError("No file URL provided.");
      setLoading(false);
      return;
    }

    if (fileType === 'dicom') {
      initCornerstone();
      
      const loadDicom = async () => {
        try {
          const element = viewerRef.current;
          if (element) {
            cornerstone.enable(element);
            
            // Basic tools
            const ImageId = dicomUrl;
            cornerstone.loadImage(ImageId).then((image) => {
              cornerstone.displayImage(element, image);

              // Add a tool -> we only need WWWC and Zoom/Pan for minimal viewing
              const WwwcTool = cornerstoneTools.WwwcTool;
              const ZoomTool = cornerstoneTools.ZoomTool;
              const PanTool = cornerstoneTools.PanTool;

              try {
                cornerstoneTools.addTool(WwwcTool);
                cornerstoneTools.addTool(ZoomTool);
                cornerstoneTools.addTool(PanTool);
                
                cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
                cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
                cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
              } catch (e) {
                // If added once, you might catch an error, it's fine
              }

              setLoading(false);
            }).catch((err) => {
              console.error("Cornerstone Load Error:", err);
              setError("Failed to load DICOM file. Please ensure it is a valid DICOM medical image.");
              setLoading(false);
            });
          }
        } catch (e) {
          console.error(e);
          setError("Failed to initialize viewer.");
          setLoading(false);
        }
      };

      loadDicom();

      return () => {
        const element = viewerRef.current;
        if (element) {
          try {
            cornerstone.disable(element);
          } catch(e) {}
        }
      };
    } else {
      // For images and PDFs just finish loading immediately or rely on native onload
      setLoading(false);
    }
  }, [fileUrl, fileType, dicomUrl]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-slate-200 w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white/50 z-10 box-border">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Icon icon="solar:document-medicine-bold-duotone" className="text-blue-500 text-2xl" /> Let's review
            </h2>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate max-w-md">
              {fileUrl || "Loading file..."}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {fileType === 'dicom' && !error && !loading && (
              <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Icon icon="solar:info-circle-bold-duotone" /> LC: Window/Level | MC: Zoom | RC: Pan
              </div>
            )}
            <a href={fileUrl} target="_blank" rel="noreferrer" download className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-xl hover:bg-blue-50" title="Open in new window">
              <Icon icon="solar:export-bold-duotone" className="text-xl" />
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 mb-0.5">
              <Icon icon="solar:close-circle-bold-duotone" className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 w-full bg-slate-100 flex items-center justify-center relative overflow-hidden box-border">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-100/80 backdrop-blur-sm">
              <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-blue-500" />
              <span className="text-xs font-black text-slate-500 tracking-widest uppercase">Fetching Document...</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-50">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center text-rose-500">
                <Icon icon="solar:danger-triangle-bold-duotone" className="text-3xl" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-800">Unsupported or Error Loading File</h3>
                <p className="text-sm font-bold text-slate-500 mt-1 max-w-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Render based on file type */}
          {fileType === 'dicom' && !error && (
            <div 
              ref={viewerRef} 
              className="w-full h-full bg-black cursor-crosshair box-border touching-none select-none relative" 
              style={{ minHeight: '400px' }}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {fileType === 'image' && !error && (
            <img 
              src={fileUrl} 
              alt="Scan Report" 
              className="max-w-full max-h-full object-contain p-4 drop-shadow-xl" 
            />
          )}

          {fileType === 'pdf' && !error && (
            <iframe 
              src={fileUrl} 
              className="w-full h-full border-none shadow-sm"
              title="PDF Report Viewer" 
            />
          )}

          {fileType === 'unknown' && !error && (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <Icon icon="solar:file-broken-bold-duotone" className="text-6xl text-slate-300" />
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-700">Unknown File Type</h3>
                <p className="text-slate-500 font-bold mt-2 text-sm max-w-md tracking-tight">The provided file extension is not explicitly handled by the native viewer. We recommend opening it manually.</p>
                <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex mt-6 items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-black transition-all uppercase tracking-widest">
                  Open File Manually <Icon icon="solar:export-bold-duotone" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
