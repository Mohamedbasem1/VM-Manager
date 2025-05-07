import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, AlertCircle, ArrowLeft, Check, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password should be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        setError(error.message || 'Failed to create account');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e293b]/90 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden border border-gray-700 transform transition-all duration-300 hover:scale-[1.01]">
        <div className="p-8">
          {/* Header with logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <Link 
              to="/" 
              className="absolute left-8 top-6 text-gray-300 hover:text-white flex items-center"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm">Home</span>
            </Link>
            
            <div className="relative mb-2">
              <Monitor className="h-12 w-12 text-purple-400" aria-label="VM Manager Logo" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#1e293b] bg-green-500"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">Join VM Manager</h1>
            <p className="mt-2 text-center text-sm text-gray-300">
              Create an account to manage your virtual machines and containers
            </p>
          </div>
          
          {success ? (
            <div className="mt-6 bg-green-900/30 border border-green-800 rounded-lg p-6 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-800/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Check size={38} className="text-green-400" />
              </div>
              <p className="text-xl font-semibold mb-2 text-green-300">Account created successfully!</p>
              <p className="text-center mb-4 text-green-400">
                Please check your email to confirm your account. You will be redirected to the login page.
              </p>
              <Link 
                to="/login" 
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg shadow-green-600/20 transition-all duration-200 flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Go to login page
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-lg flex items-start">
                  <AlertCircle className="mr-2 flex-shrink-0 h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white transition-all duration-200"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700/50 text-white transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`
                      w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg shadow-purple-600/20 transition-all duration-200
                      ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        Sign up
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;