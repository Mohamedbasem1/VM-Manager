import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Monitor, List, X, Settings, Info, HardDrive, CpuIcon, Command, Grid, Home, User, LayoutDashboard, LogIn, UserPlus, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Add a UserProfile interface to include the profile data we need
interface UserProfile {
  full_name?: string;
}

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedMode ? savedMode === 'true' : prefersDark;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Set to false for now
  const isConnected = true; // Placeholder for connection status
  // Add a profile state with type UserProfile
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(!!user);
    
    // You would normally fetch the profile data here
    // This is a placeholder to fix the TypeScript error
    if (user) {
      // Simulate fetching profile data
      setProfile({ full_name: user.email?.split('@')[0] });
    } else {
      setProfile(null);
    }
  }, [user]);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setProfileOpen(false);
      setIsLoggedIn(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={16} className="mr-2" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} className="mr-2" /> },
    { name: 'Docker', path: '/create?tab=docker', icon: <Package size={16} className="mr-2" /> },
    { name: 'Create', path: '/create', icon: <Command size={16} className="mr-2" /> },
  ];

  const authLinks = [
    { name: 'Login', path: '/login', icon: <LogIn size={16} className="mr-2" /> },
    { name: 'Sign Up', path: '/signup', icon: <UserPlus size={16} className="mr-2" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-white/90 via-purple-50/80 to-white/90 dark:from-gray-900/90 dark:via-purple-950/80 dark:to-gray-900/90 shadow-md backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="relative">
                <Monitor className="h-8 w-8 text-purple-600 dark:text-purple-400" aria-label="QEMU Logo" />
                <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white select-none"> VM Manager</span>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-4 ml-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  aria-label={link.name}
                  className={`${
                    location.pathname === link.path
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  } px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                  tabIndex={0}
                  title={link.name}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            {/* Auth Links */}
            {!isLoggedIn && (
              <div className="hidden sm:flex sm:space-x-2 mr-2">
                {authLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`${
                      location.pathname === link.path
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                    } px-3 py-1.5 rounded-md text-sm font-medium flex items-center border transition-colors duration-150`}
                    aria-label={link.name}
                    title={link.name}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
            {/* Profile Dropdown - only show if logged in */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 group transition-all duration-200 transform hover:scale-105"
                  aria-label="User menu"
                  title="Account"
                >
                  <User size={20} className="text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                  <span className="sr-only">Open user menu</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700 animate-fade-in backdrop-blur-sm">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {profile?.full_name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={16} className="mr-2 text-purple-500" />
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings size={16} className="mr-2 text-purple-500" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Connection Status */}
            <span className={`hidden md:inline px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Open main menu"
                aria-expanded={mobileMenuOpen}
                title="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <List className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-b-lg border-t border-gray-200 dark:border-gray-700 transition-all duration-200 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`${
                  location.pathname === link.path
                    ? 'bg-purple-50 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                } flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150`}
                onClick={closeMobileMenu}
                tabIndex={0}
                aria-label={link.name}
                title={link.name}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            {/* Auth Links for mobile */}
            {!isLoggedIn && (
              <>
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Authentication
                  </div>
                </div>
                {authLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`${
                      location.pathname === link.path
                        ? 'bg-purple-50 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150`}
                    onClick={closeMobileMenu}
                    tabIndex={0}
                    aria-label={link.name}
                    title={link.name}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </>
            )}
            
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Status:
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isConnected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-around py-2">
                <Link
                  to="/info"
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col items-center"
                  onClick={closeMobileMenu}
                  title="Info"
                >
                  <Info size={20} className="mb-1" />
                  <span className="text-xs">Info</span>
                </Link>
                <Link
                  to="/disks"
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col items-center"
                  onClick={closeMobileMenu}
                  title="Disks"
                >
                  <HardDrive size={20} className="mb-1" />
                  <span className="text-xs">Disks</span>
                </Link>
                <Link
                  to="/vms"
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col items-center"
                  onClick={closeMobileMenu}
                  title="VMs"
                >
                  <CpuIcon size={20} className="mb-1" />
                  <span className="text-xs">VMs</span>
                </Link>
                <Link
                  to="/grid"
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col items-center"
                  onClick={closeMobileMenu}
                  title="All"
                >
                  <Grid size={20} className="mb-1" />
                  <span className="text-xs">All</span>
                </Link>
              </div>
              {/* Mobile profile - only show if logged in */}
              {isLoggedIn && (
                <div className="flex items-center justify-center mt-4">
                  <button
                    onClick={() => isLoggedIn && handleLogout()}
                    className="flex items-center p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    aria-label="User menu"
                    title={isLoggedIn ? "Log Out" : "Account"}
                  >
                    {isLoggedIn ? (
                      <LogOut size={20} className="text-red-500 dark:text-red-400" />
                    ) : (
                      <User size={20} className="text-gray-500 dark:text-gray-300" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;