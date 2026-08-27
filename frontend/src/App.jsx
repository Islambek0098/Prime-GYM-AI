import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CheckInModal from './components/CheckInModal';
import MemberModal from './components/MemberModal';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Attendance from './pages/Attendance';
import PosBar from './pages/PosBar';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import Expenses from './pages/Expenses';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };
  
  // Data states
  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lockers, setLockers] = useState({ male: [], female: [] });
  const [posData, setPosData] = useState({ products: [], sales: [] });
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({});

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);

  // Global Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message = "Muvaffaqiyatli qo'shildi!", type = "success") => {
    setToast({ message, type });
  };

  const fetchAllData = async () => {
    try {
      const [memRes, subRes, attRes, posRes, setRes, expRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/members`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/subscriptions`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/attendance`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/pos`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/expenses`).then(r => r.json()).catch(() => [])
      ]);

      setMembers(memRes || []);
      setSubscriptions(subRes || []);
      setAttendance(attRes.attendance || []);
      setLockers(attRes.lockers || { male: [], female: [] });
      setPosData(posRes || { products: [], sales: [] });
      setSettings(setRes || {});
      setExpenses(expRes || []);
    } catch (err) {
      console.error("Error fetching data from API:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleOpenAddMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  // Sidebar Responsiveness state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleMenu = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const handleOpenEditMember = (member) => {
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const activeVisitorsCount = attendance.filter(a => a.status === 'Zalda').length;

  return (
    <div className={`flex min-h-screen font-sans antialiased relative transition-colors duration-300 ${
      theme === 'light' ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        gymName={settings.gymName} 
        gymLogo={settings.gymLogo}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar 
          onOpenCheckIn={() => setIsCheckInOpen(true)}
          onOpenAddMember={handleOpenAddMember}
          activeVisitorsCount={activeVisitorsCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMenu={handleToggleMenu}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              members={members}
              attendance={attendance}
              posSales={posData.sales || []}
              subscriptions={subscriptions}
              onOpenCheckIn={() => setIsCheckInOpen(true)}
              onOpenAddMember={handleOpenAddMember}
            />
          )}

          {activeTab === 'members' && (
            <Members 
              members={members}
              subscriptions={subscriptions}
              onRefresh={fetchAllData}
              onOpenAddMember={handleOpenAddMember}
              onEditMember={handleOpenEditMember}
              showToast={showToast}
            />
          )}

          {activeTab === 'attendance' && (
            <Attendance 
              attendance={attendance}
              lockers={lockers}
              onRefresh={fetchAllData}
              onOpenCheckIn={() => setIsCheckInOpen(true)}
              showToast={showToast}
            />
          )}

          {activeTab === 'pos' && (
            <PosBar 
              posData={posData}
              members={members}
              attendance={attendance}
              onRefresh={fetchAllData}
              showToast={showToast}
            />
          )}

          {activeTab === 'subscriptions' && (
            <Subscriptions 
              subscriptions={subscriptions}
              onRefresh={fetchAllData}
              showToast={showToast}
            />
          )}

          {activeTab === 'finance' && (
            <Finance 
              members={members}
              posSales={posData.sales || []}
              expenses={expenses}
              subscriptions={subscriptions}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses 
              expenses={expenses}
              onRefresh={fetchAllData}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              settings={settings}
              onRefresh={fetchAllData}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Check-In Modal */}
      <CheckInModal 
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={fetchAllData}
        members={members}
        lockers={lockers}
        showToast={showToast}
      />

      {/* Member Add/Edit Modal */}
      <MemberModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={fetchAllData}
        subscriptions={subscriptions}
        memberToEdit={memberToEdit}
        showToast={showToast}
      />

      {/* Floating Bottom-Right Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
