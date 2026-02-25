import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StartApplication from './pages/StartApplication';
import ResumeApplication from './pages/ResumeApplication';
import ApplicationFormNew from './pages/ApplicationFormNew';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
// Static Pages
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiePage from './pages/CookiePage';
import TermsPage from './pages/TermsPage';
import FAQPage from './pages/FAQPage';
import SupportPage from './pages/SupportPage';
import ResourcesPage from './pages/ResourcesPage';
import SitemapPage from './pages/SitemapPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function AppRouter() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment (not query params) for session_id
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/apply" element={<StartApplication />} />
      <Route path="/apply/resume" element={<ResumeApplication />} />
      <Route path="/apply/form" element={<ApplicationFormNew />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/properties/add" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
      <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
      <Route path="/properties/:propertyId/edit" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
      {/* Static Pages */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/sitemap" element={<SitemapPage />} />
      {/* 404 - Must be last */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;
