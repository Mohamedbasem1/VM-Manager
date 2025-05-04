import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Server, HardDrive, Cpu, ArrowRight, Cloud, Monitor, Database, Lock } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="py-12 md:py-20 text-center">
        <div className="inline-block p-2 px-3 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center space-x-1">
            <Cloud size={16} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">QEMU Cloud Management</p>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Manage Your Virtual Infrastructure <br /> With Ease
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
          A powerful interface for creating and managing QEMU virtual machines in the cloud.
          Streamline your virtualization workflow with our intuitive tools.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
          >
            Go to Dashboard
            <ArrowRight size={18} className="ml-2" />
          </button>
          
          <Link 
            to="/create"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          >
            Create New VM
          </Link>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 mb-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Server className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">VM Management</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create, start, stop and monitor virtual machines with our simple and intuitive interface.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 mb-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <HardDrive className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Disk Management</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create and manage virtual disks with different formats and sizes for your virtual machines.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 mb-4 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Cpu className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Resource Control</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Efficiently allocate CPU cores and memory to optimize your virtualization environment.
          </p>
        </div>
      </div>
      
      {/* Getting Started Section */}
      <div className="py-16 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Getting Started
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="absolute top-0 left-6 h-full w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Virtual Disk</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Start by creating a virtual disk to store your operating system and files.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute top-0 left-6 h-full w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Virtual Machine</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Configure your VM with the required CPU, memory and select your disk and ISO image.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Start Your VM</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Launch your VM and install your operating system. Manage everything from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 text-center">
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-900/20 dark:to-purple-900/20 p-10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Ready to start managing your virtual infrastructure?
          </h2>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;