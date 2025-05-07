import React, { useState, useEffect } from 'react';
import { VirtualMachine } from '../types';
import { getVirtualMachines } from '../services/qemuService';
import VMCard from './VMCard';
import { RefreshCw, MonitorSmartphone } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const VMList: React.FC = () => {
  const [vms, setVMs] = useState<VirtualMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVMs = async () => {
    setLoading(true);
    try {
      const vmList = await getVirtualMachines();
      setVMs(vmList);
      setError(null);
    } catch (err) {
      setError('Failed to load virtual machines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVMs();
  }, []);

  if (loading && vms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-purple-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading virtual machines...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={loadVMs}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (vms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div className="w-40 h-40 mb-4">
            <DotLottieReact 
              src="https://lottie.host/ca8febda-2b9a-4f68-a6df-be72ada2946a/wv4Zz3IjPZ.json" 
              loop 
              autoplay 
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No virtual machines available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Create a new VM to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MonitorSmartphone className="mr-2 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Virtual Machines</h2>
        </div>
        <button
          onClick={loadVMs}
          className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} className="mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vms.map((vm) => (
          <VMCard
            key={vm.id}
            vm={vm}
            onVMUpdated={loadVMs}
            onVMDeleted={loadVMs}
          />
        ))}
      </div>
    </div>
  );
};

export default VMList;