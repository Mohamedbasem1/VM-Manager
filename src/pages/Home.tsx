import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Server, HardDrive, Cpu, ArrowRight, Cloud, Monitor, Database, Lock, Package, Box, FileCode } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="py-12 md:py-20 text-center">
        <div className="inline-block p-2 px-3 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center space-x-1">
            <Cloud size={16} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">QEMU & Docker Management</p>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Manage VMs & Docker Containers <br /> With Ease
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
          A powerful interface for creating and managing both virtual machines and Docker containers.
          Streamline your virtualization and containerization workflow with our intuitive tools.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            Go to Dashboard
            <ArrowRight size={18} className="ml-2" />
          </button>
          
          <Link 
            to="/create"
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center"
          >
            Create New VM
          </Link>
          
          <Link 
            to="/create?tab=docker&subTab=images"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            <Package size={18} className="mr-2" />
            Docker Images
          </Link>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Comprehensive Management Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Server className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">VM Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create, start, stop and monitor virtual machines with our simple and intuitive interface.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <HardDrive className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Disk Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage virtual disks with different formats and sizes for your virtual machines.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Cpu className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Resource Control</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Efficiently allocate CPU cores and memory to optimize your virtualization environment.
            </p>
          </div>
        </div>
      </div>
      
      {/* Docker Features Section */}
      <div className="py-16 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/10 rounded-xl border border-teal-100 dark:border-teal-800 mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-10">
          Docker Container Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-teal-100 dark:border-teal-800 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <FileCode className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Dockerfile Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage Dockerfiles to build custom container images for your applications.
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-teal-100 dark:border-teal-800 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Package className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Docker Images</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Build, pull and manage Docker images. Search Docker Hub for public images and easily import them.
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-teal-100 dark:border-teal-800 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Box className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Container Runtime</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Start, stop and monitor Docker containers with port mapping and resource allocation controls.
            </p>
          </div>
        </div>
      </div>
      
      {/* Getting Started Section */}
      <div className="py-16 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Getting Started
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
              <Server className="mr-2" />
              Virtual Machines
            </h3>
            
            <ol className="space-y-6">
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold mr-3">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Create Virtual Disk</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Start by creating a virtual disk to store your operating system and files.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold mr-3">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Create Virtual Machine</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Configure your VM with the required CPU, memory and select your disk and ISO image.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold mr-3">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Start Your VM</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Launch your VM and install your operating system. Manage everything from your dashboard.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-4 flex items-center">
              <Package className="mr-2" />
              Docker Containers
            </h3>
            
            <ol className="space-y-6">
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 font-bold mr-3">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Create Dockerfile</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Create a Dockerfile with your application configuration or use our templates.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 font-bold mr-3">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Build or Pull Image</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Build an image from your Dockerfile or pull an existing image from Docker Hub.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 font-bold mr-3">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Run Container</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Start a container from your image with optional port mapping and container name.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link 
            to="/create?tab=docker"
            className="px-8 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
          >
            <Package size={18} className="mr-2" />
            Get Started with Docker
          </Link>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 text-center">
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-900/20 dark:to-purple-900/20 p-10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Ready to manage your virtual infrastructure?
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Go to Dashboard
            </button>
            
            <Link 
              to="/create?tab=docker&subTab=images"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <Package size={18} className="mr-2" />
              Explore Docker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;