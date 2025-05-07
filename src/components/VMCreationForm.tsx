import React, { useState, useEffect } from 'react';
import { createVirtualMachine, getVirtualDisks, getISOs, uploadISO, registerISOPath } from '../services/qemuService';
import { VirtualDisk, ISO } from '../types';
import { Cpu, Check, Upload, Info, AlertCircle } from 'lucide-react';
import { notify } from './NotificationsContainer';
import path from 'path';

const VMCreationForm: React.FC<{ onVMCreated: () => void }> = ({ onVMCreated }) => {
  const [name, setName] = useState('');
  const [cpuCores, setCpuCores] = useState(2);
  const [memory, setMemory] = useState(2048); // 2 GB in MB
  const [selectedDiskId, setSelectedDiskId] = useState('');
  const [selectedIsoId, setSelectedIsoId] = useState('');
  const [disks, setDisks] = useState<VirtualDisk[]>([]);
  const [isos, setISOs] = useState<ISO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diskLoading, setDiskLoading] = useState(true);
  const [isoLoading, setIsoLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIsoInfo, setShowIsoInfo] = useState(false);
  const [useCustomIsoPath, setUseCustomIsoPath] = useState(false);
  const [customIsoPath, setCustomIsoPath] = useState('');
  const [customIsoName, setCustomIsoName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [availableDisks, availableISOs] = await Promise.all([
          getVirtualDisks(),
          getISOs()
        ]);
        setDisks(availableDisks);
        setISOs(availableISOs);
        if (availableDisks.length > 0) {
          setSelectedDiskId(availableDisks[0].id);
        }
        if (availableISOs.length > 0) {
          setSelectedIsoId(availableISOs[0].id);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setDiskLoading(false);
        setIsoLoading(false);
      }
    };

    loadData();
  }, []);

  const handleISOUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const newISO = await uploadISO(file);
      setISOs(prev => [...prev, newISO]);
      setSelectedIsoId(newISO.id);
      setUseCustomIsoPath(false);
    } catch (err) {
      setError('Failed to upload ISO file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let selectedIso: ISO | undefined;
      
      // Handle ISO selection
      if (useCustomIsoPath && customIsoPath) {
        try {
          // Register the custom ISO path with the server first
          selectedIso = await registerISOPath(
            customIsoPath,
            customIsoName || path.basename(customIsoPath)
          );
        } catch (err) {
          throw new Error(`Failed to register custom ISO: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else if (selectedIsoId) {
        // Find the selected ISO object from the list of ISOs
        selectedIso = isos.find(iso => iso.id === selectedIsoId);
        if (!selectedIso) {
          throw new Error('Selected ISO not found or invalid');
        }
      } else {
        throw new Error('ISO file is required for VM creation');
      }
      
      // Find the selected disk object instead of just using its ID
      const selectedDisk = disks.find(disk => disk.id === selectedDiskId);
      if (!selectedDisk) {
        throw new Error('Selected disk not found or invalid');
      }
      
      // Proceed with VM creation using the full disk and ISO objects
      console.log(`Creating VM with disk: ${selectedDisk.name} and ISO: ${selectedIso.name}`);
      
      await createVirtualMachine(
        name,
        cpuCores,
        memory,
        selectedDisk,
        selectedIso
      );
      
      setSuccess(true);
      setName('');
      setCpuCores(2);
      setMemory(2048);
      onVMCreated();
      
      notify('success', `Virtual machine "${name}" created successfully`);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create VM';
      setError(errorMessage);
      notify('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMemory = (value: number) => {
    if (value < 1024) return `${value} MB`;
    return `${(value / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center mb-4">
        <Cpu className="mr-2 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Virtual Machine</h2>
      </div>
      
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-center">
          <Check size={20} className="mr-2" />
          VM created successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="vm-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VM Name
          </label>
          <input
            id="vm-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="my-virtual-machine"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="cpu-cores" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CPU Cores
          </label>
          <div className="flex items-center">
            <input
              id="cpu-cores"
              type="range"
              min="1"
              max="16"
              value={cpuCores}
              onChange={(e) => setCpuCores(parseInt(e.target.value))}
              className="w-full mr-3"
            />
            <span className="w-12 text-center font-medium text-gray-900 dark:text-white">{cpuCores}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="memory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Memory
          </label>
          <div className="flex items-center">
            <input
              id="memory"
              type="range"
              min="512"
              max="16384"
              step="512"
              value={memory}
              onChange={(e) => setMemory(parseInt(e.target.value))}
              className="w-full mr-3"
            />
            <span className="w-20 text-center font-medium text-gray-900 dark:text-white">{formatMemory(memory)}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="disk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Disk
          </label>
          {diskLoading ? (
            <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ) : disks.length === 0 ? (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-2 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p>No virtual disks available.</p>
                <p className="text-sm mt-1">Please <a href="/create" className="underline hover:text-yellow-800 dark:hover:text-yellow-300">create a disk</a> first.</p>
              </div>
            </div>
          ) : (
            <select
              id="disk"
              value={selectedDiskId}
              onChange={(e) => setSelectedDiskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              {disks.map((disk) => (
                <option key={disk.id} value={disk.id}>
                  {disk.name} ({disk.size} GB, {disk.format})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Installation ISO (Required)
            </label>
            <button 
              type="button"
              onClick={() => setShowIsoInfo(!showIsoInfo)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-xs"
            >
              <Info size={14} className="mr-1" />
              {showIsoInfo ? 'Hide info' : 'What\'s this?'}
            </button>
          </div>
          
          {showIsoInfo && (
            <div className="mt-1 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded border border-blue-100 dark:border-blue-800 text-gray-700 dark:text-gray-300">
              <p>An ISO file is required to install an operating system on your virtual machine. You can:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Select from existing ISO files</li>
                <li>Upload a new ISO file</li>
                <li>Specify a custom path to an ISO file on your system</li>
              </ul>
            </div>
          )}
          
          <div className="space-y-3">
            {/* Option 1: Select ISO from list */}
            <div>
              <div className="flex items-center mb-1">
                <input
                  type="radio"
                  id="select-iso"
                  checked={!useCustomIsoPath}
                  onChange={() => setUseCustomIsoPath(false)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="select-iso" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Select from available ISOs
                </label>
              </div>
              
              {!useCustomIsoPath && (
                <div className="ml-6">
                  {isoLoading ? (
                    <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  ) : (
                    <>
                      <select
                        value={selectedIsoId}
                        onChange={(e) => setSelectedIsoId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select an ISO file</option>
                        {isos.map((iso) => (
                          <option key={iso.id} value={iso.id}>
                            {iso.name} ({iso.size} MB)
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex items-center mt-2">
                        <label
                          htmlFor="iso-upload"
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Upload size={16} className="mr-2" />
                          Upload ISO
                        </label>
                        <input
                          id="iso-upload"
                          type="file"
                          accept=".iso"
                          onChange={handleISOUpload}
                          className="hidden"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Option 2: Custom ISO Path */}
            <div>
              <div className="flex items-center mb-1">
                <input
                  type="radio"
                  id="custom-iso"
                  checked={useCustomIsoPath}
                  onChange={() => setUseCustomIsoPath(true)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="custom-iso" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Specify ISO path on your system
                </label>
              </div>
              
              {useCustomIsoPath && (
                <div className="ml-6 space-y-2">
                  <input
                    type="text"
                    value={customIsoPath}
                    onChange={(e) => setCustomIsoPath(e.target.value)}
                    placeholder="C:\path\to\your\iso\file.iso"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    value={customIsoName}
                    onChange={(e) => setCustomIsoName(e.target.value)}
                    placeholder="Display name for ISO (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Example: C:\Users\username\Downloads\ubuntu-24.04.2-desktop-amd64.iso
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || disks.length === 0}
            className={`
              px-4 py-2 bg-purple-600 text-white rounded-md font-medium
              hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              transition-colors duration-200
              ${(isLoading || disks.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? 'Creating...' : 'Create VM'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VMCreationForm;