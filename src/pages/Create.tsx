import React, { useState, useEffect } from 'react';
import DiskCreationForm from '../components/DiskCreationForm';
import VMCreationForm from '../components/VMCreationForm';
import { HardDrive, Cpu, ChevronRight, Info } from 'lucide-react';

const Create: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('disk');
  const [refreshVMForm, setRefreshVMForm] = useState<number>(0);
  const [showGuide, setShowGuide] = useState(true);

  const handleDiskCreated = () => {
    // Trigger a refresh of the VM form to show the new disk
    setRefreshVMForm(prev => prev + 1);
    // Automatically switch to VM creation tab after disk is created
    setTimeout(() => {
      setActiveTab('vm');
    }, 1000);
  };

  // For direct navigation to specific tab via URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'vm') {
      setActiveTab('vm');
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create Resources</h1>
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-2 md:mt-0"
        >
          <Info size={16} className="mr-1" />
          {showGuide ? 'Hide guide' : 'Show guide'}
        </button>
      </div>
      
      {showGuide && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2">Quick Start Guide</h3>
          <ol className="list-decimal pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>First, create a virtual disk which will store your operating system and files</li>
            <li>Then, create a virtual machine, select your disk and ISO image</li>
            <li>Start your VM from the dashboard to install and use your operating system</li>
          </ol>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Tabs at the top */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'disk'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            } flex items-center justify-center transition-all duration-200`}
            onClick={() => setActiveTab('disk')}
          >
            <HardDrive size={16} className="mr-2" />
            Virtual Disk
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'vm'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            } flex items-center justify-center transition-all duration-200`}
            onClick={() => setActiveTab('vm')}
          >
            <Cpu size={16} className="mr-2" />
            Virtual Machine
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'disk' && (
            <DiskCreationForm 
              onDiskCreated={handleDiskCreated} 
              onSuccess={() => setActiveTab('vm')}
            />
          )}
          
          {activeTab === 'vm' && (
            <VMCreationForm key={refreshVMForm} onVMCreated={() => {}} />
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {activeTab === 'vm' && (
            <button
              onClick={() => setActiveTab('disk')}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
            >
              Back to Disk Creation
            </button>
          )}
          
          {activeTab === 'disk' && (
            <button
              onClick={() => setActiveTab('vm')}
              className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center"
            >
              Continue to VM Creation <ChevronRight size={16} className="ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;