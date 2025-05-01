import React, { useState, useEffect } from 'react';
import { createVirtualMachine, getVirtualDisks, getISOs, uploadISO } from '../services/qemuService';
import { VirtualDisk, ISO } from '../types';
import { Cpu, MemoryStick as Memory, Check, Upload } from 'lucide-react';

const VMCreationForm: React.FC<{ onVMCreated: () => void }> = ({ onVMCreated }) => {
  const [name, setName] = useState('');
  const [cpuCores, setCpuCores] = useState(1);
  const [memory, setMemory] = useState(1024); // 1 GB in MB
  const [selectedDiskId, setSelectedDiskId] = useState('');
  const [selectedIsoId, setSelectedIsoId] = useState('');
  const [disks, setDisks] = useState<VirtualDisk[]>([]);
  const [isos, setISOs] = useState<ISO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diskLoading, setDiskLoading] = useState(true);
  const [isoLoading, setIsoLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await createVirtualMachine(
        name,
        cpuCores,
        memory,
        selectedDiskId,
        selectedIsoId || undefined
      );
      setSuccess(true);
      setName('');
      setCpuCores(1);
      setMemory(1024);
      onVMCreated();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create VM');
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
      
      {disks.length === 0 && !diskLoading ? (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-4">
          No virtual disks available. Please create a disk first.
        </div>
      ) : (
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
            ) : (
              <select
                id="disk"
                value={selectedDiskId}
                onChange={(e) => setSelectedDiskId(e.target.value)}
                required
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Installation ISO (Optional)
            </label>
            <div className="space-y-2">
              {isoLoading ? (
                <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-600 rounded"></div>
              ) : (
                <>
                  <select
                    value={selectedIsoId}
                    onChange={(e) => setSelectedIsoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">No ISO</option>
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
      )}
    </div>
  );
};

export default VMCreationForm;