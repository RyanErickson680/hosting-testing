import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import "./index.css";
import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import { muiTheme } from "./theme/muiTheme";
import { AuthProvider } from "./context/AuthContext";
import { HomeContentProvider } from "./context/HomeContentContext";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import VolunteerDashboard from "./pages/VolunteerDashboard.jsx";
import VolunteerOpportunities from "./pages/VolunteerOpportunities.jsx";
import DonationCampaigns from "./pages/DonationCampaigns.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import Donate from "./pages/Donate.jsx";
import DonationSuccess from "./pages/DonationSuccess.jsx";
import SubscriptionSuccess from "./pages/SubscriptionSuccess.jsx";
import ManageRecurringDonation from "./pages/ManageRecurringDonation.jsx";
import Impact from "./pages/Impact.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import WaiverApproval from "./pages/WaiverApproval.jsx";
import EventAttendancePage from "./pages/EventAttendancePage.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import EventCheckInForm from "./pages/EventCheckInForm.jsx";

const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  vault: "true",
  "disable-funding": "paylater", // Disable Pay Later option
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <PayPalScriptProvider options={paypalOptions}>
        <AuthProvider>
          <HomeContentProvider>
          <Router>
          <Routes>
            {/* Public routes with layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route index element={<Home />} />
              <Route path="volunteer-dashboard" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
              <Route
                path="event-attendance"
                element={
                  <ProtectedRoute>
                    <EventAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="event-attendance/check-in/:eventId"
                element={
                  <ProtectedRoute>
                    <EventCheckInForm />
                  </ProtectedRoute>
                }
              />
              <Route path="volunteer-opportunities" element={<VolunteerOpportunities />} />
              <Route path="event/:id" element={<EventDetail />} />
              <Route path="donation-campaigns" element={<DonationCampaigns />} />
              <Route path="donation-campaigns/:id" element={<ProjectDetail />} />
              <Route path="donate/success" element={<DonationSuccess />} />
              <Route path="donate" element={<Donate />} />
              <Route path="donate/:id" element={<Donate />} />
              <Route path="donate/subscription/success" element={<SubscriptionSuccess />} />
              <Route
                path="subscription/:recurringDonationId/manage"
                element={
                  <ProtectedRoute>
                    <ManageRecurringDonation />
                  </ProtectedRoute>
                }
              />
              <Route path="impact" element={<ProtectedRoute><Impact /></ProtectedRoute>} />
              <Route path="inventory" element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route path="account-waiver/:token" element={<WaiverApproval />} />
              <Route path="admin-dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Auth routes without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
          </HomeContentProvider>
      </AuthProvider>
      </PayPalScriptProvider>
    </ThemeProvider>
  </StrictMode>
);
