import React, { useState } from 'react';
import DiskCreationForm from '../components/DiskCreationForm';
import VMCreationForm from '../components/VMCreationForm';

const Create: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('disk');
  const [refreshVMForm, setRefreshVMForm] = useState<number>(0);

  const handleDiskCreated = () => {
    // Trigger a refresh of the VM form to show the new disk
    setRefreshVMForm(prev => prev + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create Resources</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'disk'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('disk')}
          >
            1. Create Virtual Disk
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'vm'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('vm')}
          >
            2. Create Virtual Machine
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'disk' ? (
            <DiskCreationForm onDiskCreated={handleDiskCreated} />
          ) : (
            <VMCreationForm key={refreshVMForm} onVMCreated={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;