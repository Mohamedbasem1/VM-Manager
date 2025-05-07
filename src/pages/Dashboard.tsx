import React, { useState, useEffect } from 'react';
import VMList from '../components/VMList';
import DiskList from '../components/DiskList';
import DockerfileList from '../components/DockerfileList';
import DockerImageList from '../components/DockerImageList';
import DockerContainerList from '../components/DockerContainerList';
import { Cpu, Plus, Activity, Server, HardDrive, MemoryStick, RefreshCw, ChevronRight, FileCode, Package, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVirtualMachines, getVirtualDisks } from '../services/qemuService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState({
    totalVMs: 0,
    runningVMs: 0,
    totalDisks: 0,
    diskSpace: 0,
    qemuStatus: 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [dockerTab, setDockerTab] = useState<'dockerfiles' | 'images' | 'containers'>('images');

  useEffect(() => {
    const fetchSystemStatus = async () => {
      setLoading(true);
      try {
        const [vms, disks] = await Promise.all([
          getVirtualMachines(),
          getVirtualDisks()
        ]);
        
        // Calculate total disk space
        const totalSpace = disks.reduce((total, disk) => total + disk.size, 0);
        
        setSystemStatus({
          totalVMs: vms.length,
          runningVMs: vms.filter(vm => vm.status === 'running').length,
          totalDisks: disks.length,
          diskSpace: totalSpace,
          qemuStatus: 'online'
        });
      } catch (err) {
        console.error('Error fetching system status:', err);
        setSystemStatus(prev => ({
          ...prev,
          qemuStatus: 'offline'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
    
    // Refresh status every 30 seconds
    const intervalId = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Format disk size to display properly
  const formatDiskSize = (size: number) => {
    return `${size} GB`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your virtual machines and disks</p>
        </div>
        <Link
          to="/create"
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Plus size={18} className="mr-2" />
          Create New VM
        </Link>
      </div>

      {/* System Status Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg shadow-md mr-3">
              <Server className="text-white" size={22} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">System Status</h2>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VM Status */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center mb-3">
              <div className="bg-blue-500 bg-opacity-20 dark:bg-blue-500 dark:bg-opacity-30 p-2 rounded-md mr-3">
                <Cpu className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Virtual Machines</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.totalVMs}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {systemStatus.runningVMs} running
                </p>
              </div>
              <Link to="/create" className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center group">
                Create VM <ChevronRight size={12} className="ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          
          {/* Disk Status */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-lg border border-purple-100 dark:border-purple-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center mb-3">
              <div className="bg-purple-500 bg-opacity-20 dark:bg-purple-500 dark:bg-opacity-30 p-2 rounded-md mr-3">
                <HardDrive className="text-purple-600 dark:text-purple-400" size={18} />
              </div>
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Virtual Disks</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.totalDisks}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{systemStatus.diskSpace}G</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">GB total</span>
                </div>
              </div>
              <Link to="/create" className="text-purple-600 dark:text-purple-400 hover:underline text-xs flex items-center group">
                Create Disk <ChevronRight size={12} className="ml-1 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          
          {/* Memory Status */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-5 rounded-lg border border-green-100 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center mb-3">
              <div className="bg-green-500 bg-opacity-20 dark:bg-green-500 dark:bg-opacity-30 p-2 rounded-md mr-3">
                <MemoryStick className="text-green-600 dark:text-green-400" size={18} />
              </div>
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Memory Usage</h3>
            </div>
            <div className="flex justify-between items-end">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-800 dark:text-white">System: <span className="font-bold">Good</span></p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* QEMU Status */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5 rounded-lg border border-amber-100 dark:border-amber-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center mb-3">
              <div className="bg-amber-500 bg-opacity-20 dark:bg-amber-500 dark:bg-opacity-30 p-2 rounded-md mr-3">
                <Activity className="text-amber-600 dark:text-amber-400" size={18} />
              </div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">QEMU Status</h3>
            </div>
            <div className="flex items-end">
              <div>
                <div className="flex items-center">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
                    systemStatus.qemuStatus === 'online' 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-red-500'
                  }`}></span>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {systemStatus.qemuStatus === 'online' ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {loading ? 'Checking status...' : 'Updated recently'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VM and Disk Lists */}
      <div className="grid grid-cols-1 gap-8">
        <VMList />
        <DiskList />
        
        {/* Docker Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:shadow-2xl">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  dockerTab === 'dockerfiles'
                    ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } flex items-center justify-center transition-all duration-200`}
                onClick={() => setDockerTab('dockerfiles')}
              >
                <FileCode size={18} className="mr-2" />
                Dockerfiles
              </button>
              
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  dockerTab === 'images'
                    ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } flex items-center justify-center transition-all duration-200`}
                onClick={() => setDockerTab('images')}
              >
                <Package size={18} className="mr-2" />
                Docker Images
              </button>
              
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  dockerTab === 'containers'
                    ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } flex items-center justify-center transition-all duration-200`}
                onClick={() => setDockerTab('containers')}
              >
                <Box size={18} className="mr-2" />
                Docker Containers
              </button>
            </div>
          </div>
          
          <div className="p-0">
            {dockerTab === 'dockerfiles' && <DockerfileList />}
            {dockerTab === 'images' && <DockerImageList />}
            {dockerTab === 'containers' && <DockerContainerList />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;