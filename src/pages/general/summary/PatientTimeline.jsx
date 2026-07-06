import React, { useMemo, useState } from 'react';
import { Timeline, Tag, Modal, Button } from 'antd';
import { Icon } from '@iconify/react';
import Card from '../../../component/ui/Card';
import { AxiosInstance } from '../../../utilities/AxiosInstance';

export default function PatientTimeline({
  patientMinimalData,
  assessmentData,
  prescriptions,
  labDocs,
  scanDocs,
  allNotes,
  treatmentTracker,
  exerciseSummary,
  bills,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const rawBaseUrl = AxiosInstance.defaults.baseURL || "http://localhost:3026";
    const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const events = useMemo(() => {
    let allEvents = [];

    // 1. Patient Registration
    if (patientMinimalData?.createdAt) {
      allEvents.push({
        date: new Date(patientMinimalData.createdAt),
        title: "Patient Registered",
        description: `Patient ID: ${patientMinimalData.PHN_ID || 'N/A'}, Phone: ${patientMinimalData.patientPhone || 'N/A'}`,
        color: "blue",
        icon: "solar:user-bold-duotone",
      });
    }

    // 2. Assessment
    if (assessmentData?.createdAt) {
      allEvents.push({
        date: new Date(assessmentData.createdAt),
        title: "Clinical Assessment Completed",
        description: assessmentData.chiefComplaints
          ? `Chief Complaint: ${assessmentData.chiefComplaints}`
          : "Assessment details recorded.",
        color: "purple",
        icon: "solar:clipboard-check-bold-duotone",
      });
    }

    // 3. Prescriptions
    if (Array.isArray(prescriptions)) {
      prescriptions.forEach((p) => {
        if (p.createdAt) {
          allEvents.push({
            date: new Date(p.createdAt),
            title: "Medical Prescription Added",
            description: `Prescribed ${p.medicinesData?.length || 0} medicine(s).`,
            color: "green",
            icon: "solar:pill-bold-duotone",
            data: p,
            type: "prescription",
          });
        }
      });
    }

    // 4. Lab Prescriptions
    if (Array.isArray(labDocs)) {
      labDocs.forEach((l) => {
        if (l.raw?.createdAt || l.createdAt) {
          allEvents.push({
            date: new Date(l.raw?.createdAt || l.createdAt),
            title: "Lab Test Ordered",
            description: `Test: ${l.raw?.labType || l.labType || 'N/A'}`,
            color: "orange",
            icon: "solar:test-tube-bold-duotone",
            extra: l.status || l.raw?.status,
            data: l.raw || l,
            type: "lab",
          });
        }
      });
    }

    // 5. Scan Prescriptions
    if (Array.isArray(scanDocs)) {
      scanDocs.forEach((s) => {
        if (s.raw?.createdAt || s.createdAt) {
          allEvents.push({
            date: new Date(s.raw?.createdAt || s.createdAt),
            title: "Scan Ordered",
            description: `Scan: ${s.raw?.scanType || s.scanType || 'N/A'}`,
            color: "orange",
            icon: "solar:scanner-bold-duotone",
            extra: s.status || s.raw?.status,
            data: s.raw || s,
            type: "scan",
          });
        }
      });
    }

    // 6. Session Notes
    if (Array.isArray(allNotes)) {
      allNotes.forEach((n) => {
        const d = n.date || n.createdAt;
        if (d) {
          allEvents.push({
            date: new Date(d),
            title: "Session Note Added",
            description: `Recorded session progress.`,
            color: "teal",
            icon: "solar:notes-bold-duotone",
            data: n,
            type: "sessionNote",
          });
        }
      });
    }

    // 7. Treatment Tracker
    if (Array.isArray(treatmentTracker)) {
      treatmentTracker.forEach((t) => {
        const d = t.date || t.createdAt;
        if (d) {
          allEvents.push({
            date: new Date(d),
            title: "Treatment Tracked",
            description: `Treatment logged.`,
            color: "cyan",
            icon: "solar:heart-pulse-bold-duotone",
            data: t,
            type: "treatment",
          });
        }
      });
    }

    // 8. Exercise Summary
    if (Array.isArray(exerciseSummary)) {
      exerciseSummary.forEach((e) => {
        const d = e.date || e.createdAt;
        if (d) {
          allEvents.push({
            date: new Date(d),
            title: "Exercise Logged",
            description: `Exercise summary added.`,
            color: "volcano",
            icon: "solar:dumbbell-large-bold-duotone",
            data: e,
            type: "exercise",
          });
        }
      });
    }

    // 9. Bills
    if (Array.isArray(bills)) {
      bills.forEach((b) => {
        const d = b.invoiceDate || b.createdAt;
        if (d) {
          allEvents.push({
            date: new Date(d),
            title: "Bill Generated",
            description: `Total: ₹${b.totalAmount || 0} (${b.modeOfPayment || 'Unknown mode'})`,
            color: "gold",
            icon: "solar:bill-list-bold-duotone",
            extra: `ID: ${b.treatmentBillId || 'N/A'}`,
            data: b,
            type: "bill",
          });
        }
      });
    }

    // Sort by date descending
    allEvents.sort((a, b) => b.date - a.date);

    return allEvents;
  }, [
    patientMinimalData,
    assessmentData,
    prescriptions,
    labDocs,
    scanDocs,
    allNotes,
    treatmentTracker,
    exerciseSummary,
    bills,
  ]);

  if (!events || events.length === 0) {
    return (
      <Card className="mt-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Icon icon="solar:history-bold-duotone" className="text-blue-500" />
          Patient Timeline
        </h2>
        <p className="text-slate-500">No timeline data available for this patient.</p>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-sm" data-html2canvas-ignore="false">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
        <Icon icon="solar:history-bold-duotone" className="text-blue-500" />
        Patient Activity Timeline
      </h2>
      <div className="px-4 py-2">
        <Timeline
          mode="left"
          items={events.map((event, index) => ({
            color: event.color,
            dot: <Icon icon={event.icon} className="text-xl" style={{ color: event.color }} />,
            children: (
              <div 
                className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-blue-200"
                onClick={() => event.data && setSelectedEvent(event)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 m-0">{event.title}</h4>
                  <div className="flex items-center gap-3">
                    {event.data && (
                      <span className="text-xs text-blue-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                        View <Icon icon="solar:arrow-right-line-duotone" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                      {event.date.toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 m-0 text-sm">{event.description}</p>
                {event.extra && (
                  <div className="mt-2">
                    <Tag color="blue">{event.extra}</Tag>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </div>

      {/* Modal to display event data */}
      <Modal
        title={<span className="flex items-center gap-2 text-slate-800"><Icon icon={selectedEvent?.icon} className="text-2xl" style={{ color: selectedEvent?.color }}/> {selectedEvent?.title}</span>}
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedEvent(null)}>Close</Button>
        ]}
        width={700}
      >
        {selectedEvent?.data && (
          <div className="mt-6 flex flex-col gap-4">
            {selectedEvent.type === "prescription" && (
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Prescribed Medicines</p>
                {selectedEvent.data.medicinesData?.length > 0 ? selectedEvent.data.medicinesData.map((med, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-2">
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span>{med.medication}</span>
                      <span className="text-emerald-600">{med.days} days</span>
                    </div>
                    <div className="text-sm text-slate-600 flex gap-4">
                      <span>Dosage: {med.dosage}</span>
                      <span>Schedule: {med.morning}-{med.afternoon}-{med.night}</span>
                      <span>Relation: {med.af_bf}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500">No medicines recorded for this prescription.</p>
                )}
              </div>
            )}
            
            {selectedEvent.type === "lab" && (
              <div>
                <p className="mb-2"><strong>Test Type:</strong> {selectedEvent.data.labType}</p>
                <p className="mb-2"><strong>Status:</strong> <Tag color="blue">{selectedEvent.data.status}</Tag></p>
                {selectedEvent.data.finalReportNotes && (
                  <p className="mb-2 whitespace-pre-wrap"><strong>Report Notes:</strong><br/>{selectedEvent.data.finalReportNotes}</p>
                )}
                {selectedEvent.data.testResults?.length > 0 && (
                  <div className="mb-4">
                    <p className="font-bold text-slate-800 mb-2">Test Results:</p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedEvent.data.testResults.map((tr, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-200 last:border-0 py-1 text-sm">
                          <span className="font-medium text-slate-700">{tr.name}</span>
                          <span>{tr.value} {tr.unit} <span className="text-slate-400 text-xs ml-2">(Ref: {tr.referenceRange})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {selectedEvent.data.finalReportFileUrl && (
                    <Button type="primary" href={getFileUrl(selectedEvent.data.finalReportFileUrl)} target="_blank">View PDF Report</Button>
                  )}
                  {selectedEvent.data.ultrasoundImgUrl && (
                    <Button href={getFileUrl(selectedEvent.data.ultrasoundImgUrl)} target="_blank">View Ultrasound Image</Button>
                  )}
                </div>
              </div>
            )}

            {selectedEvent.type === "scan" && (
              <div>
                <p className="mb-2"><strong>Scan Type:</strong> {selectedEvent.data.scanType}</p>
                <p className="mb-2"><strong>Status:</strong> <Tag color="blue">{selectedEvent.data.status}</Tag></p>
                {selectedEvent.data.finalReportNotes && (
                  <p className="mb-2 whitespace-pre-wrap"><strong>Report Notes:</strong><br/>{selectedEvent.data.finalReportNotes}</p>
                )}
                {selectedEvent.data.finalReportFileUrl && (
                  <Button type="primary" href={getFileUrl(selectedEvent.data.finalReportFileUrl)} target="_blank">View PDF Report</Button>
                )}
              </div>
            )}

            {selectedEvent.type === "sessionNote" && (
              <div>
                <p className="mb-2"><strong>Doctor:</strong> {selectedEvent.data.sessionDocName}</p>
                <p className="mb-2 whitespace-pre-wrap"><strong>Note:</strong><br/>{selectedEvent.data.sessionNote}</p>
              </div>
            )}

            {selectedEvent.type === "treatment" && (
              <div>
                <p className="mb-2"><strong>Treated By:</strong> {selectedEvent.data.treatedBy}</p>
                <p className="mb-2"><strong>Therapy Name:</strong> {selectedEvent.data.therapyName}</p>
                <p className="mb-2"><strong>Region:</strong> {selectedEvent.data.treatedRegion}</p>
                <p className="mb-2 whitespace-pre-wrap"><strong>Note:</strong><br/>{selectedEvent.data.treatmentNote}</p>
              </div>
            )}

            {selectedEvent.type === "exercise" && (
              <div>
                <p className="mb-2 whitespace-pre-wrap"><strong>Summary:</strong><br/>{selectedEvent.data.summary}</p>
              </div>
            )}

            {selectedEvent.type === "bill" && (
              <div>
                <p className="mb-2"><strong>Bill ID:</strong> {selectedEvent.data.treatmentBillId}</p>
                <p className="mb-2"><strong>Total Amount:</strong> ₹{selectedEvent.data.totalAmount}</p>
                <p className="mb-2"><strong>Payment Mode:</strong> {selectedEvent.data.modeOfPayment}</p>
                <p className="mb-2 text-xs text-slate-400">Bills are viewable in detail under the Billing tab.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
