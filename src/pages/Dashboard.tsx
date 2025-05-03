import React, { useState, useEffect } from 'react';
import VMList from '../components/VMList';
import DiskList from '../components/DiskList';
import { Cpu, Plus, Activity, Server, HardDrive, MemoryStick, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVirtualMachines, getVirtualDisks } from '../services/qemuService';

const Dashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState({
    totalVMs: 0,
    runningVMs: 0,
    totalDisks: 0,
    diskSpace: 0,
    qemuStatus: 'unknown'
  });
  const [loading, setLoading] = useState(true);

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Server className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">System Status</h2>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <RefreshCw size={14} className="mr-1" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VM Status */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center mb-2">
              <Cpu className="text-blue-500 dark:text-blue-400 mr-2" size={18} />
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Virtual Machines</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.totalVMs}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {systemStatus.runningVMs} running
                </p>
              </div>
              <Link to="/create" className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center">
                Create VM <ChevronRight size={12} className="ml-1" />
              </Link>
            </div>
          </div>
          
          {/* Disk Status */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="flex items-center mb-2">
              <HardDrive className="text-purple-500 dark:text-purple-400 mr-2" size={18} />
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Virtual Disks</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.totalDisks}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{systemStatus.diskSpace}G</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">GB total</span>
                </div>
              </div>
              <Link to="/create" className="text-purple-600 dark:text-purple-400 hover:underline text-xs flex items-center">
                Create Disk <ChevronRight size={12} className="ml-1" />
              </Link>
            </div>
          </div>
          
          {/* Memory Status */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
            <div className="flex items-center mb-2">
              <MemoryStick className="text-green-500 dark:text-green-400 mr-2" size={18} />
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Memory Usage</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">System: <span className="font-bold">Good</span></p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* QEMU Status */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
            <div className="flex items-center mb-2">
              <Activity className="text-amber-500 dark:text-amber-400 mr-2" size={18} />
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">QEMU Status</h3>
            </div>
            <div className="flex items-end">
              <div>
                <div className="flex items-center">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
                    systemStatus.qemuStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
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
      </div>
    </div>
  );
};

export default Dashboard;