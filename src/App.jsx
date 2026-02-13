import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import SplashScreen from "./components/common/SplashScreen";

// Import page components
import Dashboard from "./pages/Dashboard";
import Deliveries from "./pages/Deliveries";
import RoutesPage from "./pages/Routes";
import Profile from "./pages/Profile";
import History from "./pages/History";
import BottomTab from "./components/common/BottomTab";

// Layout component for authenticated pages
const AuthenticatedLayout = ({ onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Desktop Header */}
      <div>
        <Header onLogout={onLogout} />
      </div>

      {/* Main Content */}
      <main className="grow container mx-auto px-4 pt-20 pb-20 lg:pb-6">
        <Outlet />
      </main>

      {/* Desktop Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Bottom Tab */}
      <BottomTab />
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {showSplash && <SplashScreen />}
      <Router>
        <div className="min-h-screen bg-indigo flex-col">
          <Routes>
            <Route
              path="/"
              element={
                !isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Protected routes with shared layout */}
            <Route
              element={
                isAuthenticated ? (
                  <AuthenticatedLayout onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" />
                )
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
