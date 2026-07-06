import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MainLayout from "./component/Layout/MainLayout";
import { PageSkeleton } from "./component/ui/Skeleton";
import DashboardWrapper from "./component/DashboardWrapper";
import PageTransition from "./component/ui/PageTransition";

// Lazy Load Pages
const Home = lazy(() => import("./pages/receptionist/home/Home"));
const Login = lazy(() => import("./pages/general/login/Login"));
const EnquiryRegistraionForm = lazy(
  () => import("./component/forms/enquiryForm/EnquiryRegistraionForm"),
);
const PatientDetails = lazy(
  () => import("./pages/general/patientDetails/PatientDetails"),
);
const PatientHealthDashboard = lazy(
  () => import("./pages/general/patientDetails/PatientHealthDashboard"),
);
const Assessment = lazy(() => import("./pages/general/assessment/Assessment"));
const ExerciseUpload = lazy(
  () => import("./component/exercise/ExerciseUpload"),
);
const DoctorAndStaffs = lazy(() => import("./pages/master/DoctorAndStaffs"));
const Inventory = lazy(() => import("./pages/general/inventory/Inventory"));
const ExpenditureShow = lazy(
  () => import("./pages/general/expenditure/ExpenditureShow"),
);
const Supplier = lazy(() => import("./component/supplier/Supplier"));
const AllFeedback = lazy(() => import("./pages/general/feedback/AllFeedback"));
const Calendar = lazy(
  () => import("./pages/general/appointments/calendar/Calendar"),
);
const Bill = lazy(() => import("./pages/receptionist/bills/Bill"));
const NextReview = lazy(() => import("./component/nextReview/NextReview"));
const PreloadPrescription = lazy(
  () => import("./pages/general/preloadData/PreloadPrescription"),
);
const TeethChartTesing = lazy(
  () => import("./component/treatment/TeethChartTesing"),
);
const PHNAppointments = lazy(
  () => import("./pages/general/appointments/PHNAppointments"),
);
const PatientChat = lazy(() => import("./component/chat/PatientChat"));
const Pharmacy = lazy(() => import("./pages/general/pharmacy/Pharmacy"));
const ScanPrescriptionFromTheDoctor = lazy(
  () => import("./component/scan/ScanPrescriptionFromTheDoctor"),
);
const ScanAppointmentCreateForm = lazy(
  () => import("./component/scan/ScanAppointmentCreateForm"),
);
const ScanAppointmentDashboard = lazy(
  () => import("./component/scan/ScanAppointmentDashboard"),
);
const AppointmentForTheScan = lazy(
  () => import("./component/scan/AppointmentForTheScan"),
);
const LabPrescriptionFromTheDoctor = lazy(
  () => import("./component/lab/LabPrescriptionFromTheDoctor"),
);
const LabAppointmentCreateForm = lazy(
  () => import("./component/lab/LabAppointmentCreateForm"),
);
const LabAppointmentDashboard = lazy(
  () => import("./component/lab/LabAppointmentDashboard"),
);
const AppointmentForTheLab = lazy(
  () => import("./component/lab/AppointmentForTheLab"),
);
const XRayUpload = lazy(() => import("./component/scan/XRayUpload"));
const VideoConsult = lazy(() => import("./pages/general/videoConsult/VideoConsult"));
const Identicards = lazy(() => import("./pages/general/identicard/Identicards"));

// Protected Route Component to enforce authentication
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = sessionStorage.getItem("user") || sessionStorage.getItem("master");

  if (!isLoggedIn) {
    sessionStorage.setItem("redirectUrl", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes - No Layout */}
        <Route
          path="/"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PageTransition>
                <Login />
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PageTransition>
                <Login />
              </PageTransition>
            </Suspense>
          }
        />
        <Route
          path="/master-login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PageTransition>
                <Login />
              </PageTransition>
            </Suspense>
          }
        />

        <Route
          path="/download-id/:patientId"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PageTransition>
                <Identicards isPublic={true} />
              </PageTransition>
            </Suspense>
          }
        />

        {/* Application Routes - Wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route
            path="/home"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <DashboardWrapper />
              </PageTransition>
            }
          />
          <Route
            path="/bill"
            element={
              <PageTransition>
                <Bill />
              </PageTransition>
            }
          />
          <Route
            path="/book-appointment"
            element={
              <PageTransition>
                <Calendar />
              </PageTransition>
            }
          />
          <Route
            path="/next-review"
            element={
              <PageTransition>
                <NextReview />
              </PageTransition>
            }
          />
          <Route
            path="/enquiry-registration"
            element={
              <PageTransition>
                <EnquiryRegistraionForm />
              </PageTransition>
            }
          />
          <Route
            path="/enquiry-registration/:patient_id"
            element={
              <PageTransition>
                <EnquiryRegistraionForm />
              </PageTransition>
            }
          />
          <Route
            path="/patient-details/:patient_id"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <PatientDetails />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-dashboard/:patientId"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <PatientHealthDashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:patient_id"
            element={
              <PageTransition>
                <Assessment />
              </PageTransition>
            }
          />
          <Route
            path="/inventory"
            element={
              <PageTransition>
                <Inventory />
              </PageTransition>
            }
          />
          <Route
            path="/exercise-upload"
            element={
              <PageTransition>
                <ExerciseUpload />
              </PageTransition>
            }
          />
          <Route
            path="/master/doctor-and-staffs"
            element={
              <PageTransition>
                <DoctorAndStaffs />
              </PageTransition>
            }
          />
          <Route
            path="/expenditure"
            element={
              <PageTransition>
                <ExpenditureShow />
              </PageTransition>
            }
          />
          <Route
            path="/supplier"
            element={
              <PageTransition>
                <Supplier />
              </PageTransition>
            }
          />
          <Route
            path="/feedback"
            element={
              <PageTransition>
                <AllFeedback />
              </PageTransition>
            }
          />
          <Route
            path="/pre-load-prescription"
            element={
              <PageTransition>
                <PreloadPrescription />
              </PageTransition>
            }
          />
          <Route
            path="/chart-test"
            element={
              <PageTransition>
                <TeethChartTesing />
              </PageTransition>
            }
          />
          <Route
            path="/PHNAppointments"
            element={
              <PageTransition>
                <PHNAppointments />
              </PageTransition>
            }
          />
          <Route
            path="/patient-chat"
            element={
              <PageTransition>
                <PatientChat />
              </PageTransition>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <PageTransition>
                <Pharmacy />
              </PageTransition>
            }
          />
          <Route
            path="/scan-prescription-from-the-doctor"
            element={
              <PageTransition>
                <ScanPrescriptionFromTheDoctor />
              </PageTransition>
            }
          />
          <Route
            path="/scan-appointment-create-form"
            element={
              <PageTransition>
                <ScanAppointmentCreateForm />
              </PageTransition>
            }
          />
          <Route
            path="/scan-appointment-dashboard"
            element={
              <PageTransition>
                <ScanAppointmentDashboard />
              </PageTransition>
            }
          />
          <Route
            path="/appointment-for-the-scan"
            element={
              <PageTransition>
                <AppointmentForTheScan />
              </PageTransition>
            }
          />
          <Route
            path="/lab-prescription-from-the-doctor"
            element={
              <PageTransition>
                <LabPrescriptionFromTheDoctor />
              </PageTransition>
            }
          />
          <Route
            path="/lab-appointment-create-form"
            element={
              <PageTransition>
                <LabAppointmentCreateForm />
              </PageTransition>
            }
          />
          <Route
            path="/lab-appointment-dashboard"
            element={
              <PageTransition>
                <LabAppointmentDashboard />
              </PageTransition>
            }
          />
          <Route
            path="/appointment-for-the-lab"
            element={
              <PageTransition>
                <AppointmentForTheLab />
              </PageTransition>
            }
          />
          <Route
            path="/xray-analysis"
            element={
              <PageTransition>
                <XRayUpload />
              </PageTransition>
            }
          />
          <Route
            path="/video-consult"
            element={
              <PageTransition>
                <VideoConsult />
              </PageTransition>
            }
          />
          <Route
            path="/administration/identicards"
            element={
              <PageTransition>
                <Identicards />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
