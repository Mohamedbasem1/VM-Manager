import React, { useState, useEffect } from 'react';
import { createVirtualDisk, getAvailableDiskSpace } from '../services/qemuService';
import { HardDrive, Check, Info, AlertCircle, Database } from 'lucide-react';

// Updated props to include an optional callback for when disk is created successfully
const DiskCreationForm: React.FC<{ onDiskCreated: () => void, onSuccess?: () => void }> = ({ onDiskCreated, onSuccess }) => {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'qcow2' | 'raw' | 'vdi' | 'vmdk'>('qcow2');
  const [size, setSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [availableSpace, setAvailableSpace] = useState<number | null>(null);
    // Fetch available disk space when component mounts
  useEffect(() => {
    const fetchDiskSpace = async () => {
      try {
        const space = await getAvailableDiskSpace();
        setAvailableSpace(space);
      } catch (err) {
        console.error('Error fetching disk space:', err);
        setError('Could not fetch available disk space');
      }
    };
    
    fetchDiskSpace();
    
    // Refresh disk space every 30 seconds
    const intervalId = setInterval(fetchDiskSpace, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Updated format information with emphasis on raw format's actual size characteristic
  const formatInfo = {
    qcow2: 'QEMU Copy-On-Write v2 format. Uses thin provisioning (only uses as much space as needed). Supports compression, encryption, and snapshots.',
    raw: 'Raw disk image format. Takes up the full allocated space on your disk immediately. Best performance but no advanced features. The only format that saves with its actual size.',
    vdi: 'VirtualBox Disk Image format. Uses thin provisioning and has good compatibility with VirtualBox.',
    vmdk: 'VMware Virtual Machine Disk format. Uses thin provisioning and is compatible with VMware products and some other hypervisors.'
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {      // Client-side validation for disk space
      if (availableSpace !== null) {
        const sizeDisplay = size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`;
        const availableDisplay = availableSpace >= 1000 ? `${(availableSpace/1024).toFixed(2)} TB` : `${availableSpace.toFixed(1)} GB`;
        
        if (format === 'raw' && size > availableSpace * 0.9) {
          throw new Error(`Not enough disk space to create a ${sizeDisplay} raw disk. You have ${availableDisplay} available.`);
        }
        
        // For non-raw formats, just warn if the size is too large but still allow creation
        // The server will do the final validation
        if (format !== 'raw' && size > availableSpace && size > 50) {
          console.warn(`Creating a large ${sizeDisplay} ${format} disk with only ${availableDisplay} available`);
        }
        
        // Extra warning for very large disks
        if (size > 500) {
          console.warn(`Creating a very large disk (${sizeDisplay}). This might take some time to complete.`);
        }
      }
      
      await createVirtualDisk(name, format, size);
      
      // After successful creation, refresh the available space
      try {
        const updatedSpace = await getAvailableDiskSpace();
        setAvailableSpace(updatedSpace);
      } catch (spaceErr) {
        console.error('Error updating disk space after creation:', spaceErr);
      }
      
      setSuccess(true);
      setName('');
      setFormat('qcow2');
      setSize(10);
      onDiskCreated();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000); // Short delay to show the success message before switching tabs
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      // Handle specific errors from the server
      const errorMessage = err instanceof Error ? err.message : 'Failed to create disk';
      
      // Check if the error contains available space information
      if (typeof errorMessage === 'string' && errorMessage.includes('Not enough disk space')) {
        // If this is a disk space error, refresh our available space data
        try {
          const updatedSpace = await getAvailableDiskSpace();
          setAvailableSpace(updatedSpace);
        } catch (spaceErr) {
          console.error('Error updating disk space after error:', spaceErr);
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };  // Helper to display a storage usage warning for raw format
  const showRawFormatWarning = format === 'raw' && size > 20;
  
  // These thresholds are used directly in the UI components below
  // For raw format, use 90% of available space as max
  // For other formats, allow overprovisioning

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center mb-4">
        <HardDrive className="mr-2 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Virtual Disk</h2>
      </div>
      
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-center">
          <Check size={20} className="mr-2" />
          Disk created successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="disk-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Disk Name
          </label>
          <input
            id="disk-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="my-disk"
          />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="disk-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disk Format
            </label>
            <button 
              type="button"
              onClick={() => setShowFormatInfo(!showFormatInfo)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-xs"
            >
              <Info size={14} className="mr-1" />
              {showFormatInfo ? 'Hide info' : 'What\'s this?'}
            </button>
          </div>
          <select
            id="disk-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="qcow2">QCOW2 (recommended for flexibility)</option>
            <option value="raw">Raw (actual size, best performance)</option>
            <option value="vdi">VDI (VirtualBox)</option>
            <option value="vmdk">VMDK (VMware)</option>
          </select>
          
          {showFormatInfo && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded border border-blue-100 dark:border-blue-800 text-gray-700 dark:text-gray-300">
              <h4 className="font-medium mb-1 text-blue-700 dark:text-blue-400">Disk Format Information:</h4>
              <ul className="space-y-2 list-disc pl-5">
                <li><span className="font-medium">QCOW2:</span> {formatInfo.qcow2}</li>
                <li><span className="font-medium">Raw:</span> {formatInfo.raw}</li>
                <li><span className="font-medium">VDI:</span> {formatInfo.vdi}</li>
                <li><span className="font-medium">VMDK:</span> {formatInfo.vmdk}</li>
              </ul>
            </div>
          )}
          
          {!showFormatInfo && format === 'raw' && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Raw format uses the full allocated disk space immediately (actual size)
            </p>
          )}
          
          {!showFormatInfo && format === 'qcow2' && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              QCOW2 supports compression, encryption and snapshots
            </p>
          )}
        </div>
          <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="disk-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disk Size (GB)
            </label>
              {/* Display available space info */}
            {availableSpace !== null && (
              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <Database size={12} className="mr-1" />
                Available: <span className="font-medium ml-1">
                  {availableSpace >= 1000 
                    ? `${(availableSpace/1024).toFixed(2)} TB` 
                    : `${Math.floor(availableSpace)} GB`}
                </span>
              </div>
            )}
          </div>
            <div className="flex flex-col w-full">
            <div className="flex items-center mb-1">
              <input
                id="disk-size"
                type="range"
                min="1"
                max="1024"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-full mr-3"
                step={size < 100 ? "1" : size < 500 ? "10" : "25"}
              />
              <div className="flex items-center">
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Math.max(1, Math.min(1024, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white text-center"
                  min="1"
                  max="1024"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">GB</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>1GB</span>
              <span>512GB</span>
              <span>1TB</span>
            </div>
          </div>
            {/* Space usage indicators */}
          {availableSpace !== null && (
            <div className="mt-3 mb-2">
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    size > availableSpace * 0.9 ? 'bg-red-500' : 
                    size > availableSpace * 0.7 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (size / availableSpace) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500 dark:text-gray-400">
                  {size > availableSpace 
                    ? <span className="text-red-500 font-medium">Exceeds available space</span>
                    : `Using ${Math.round((size / availableSpace) * 100)}% of available space`}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`}
                </span>
              </div>
            </div>
          )}
          
          {/* Disk space warnings */}          {availableSpace !== null && format === 'raw' && size > availableSpace * 0.9 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-sm rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                Warning: Not enough disk space! A {size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`} raw disk requires {size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`} of free space, but you only have {availableSpace >= 1000 ? `${(availableSpace/1024).toFixed(2)} TB` : `${availableSpace.toFixed(1)} GB`} available.
              </span>
            </div>
          )}
          
          {availableSpace !== null && format !== 'raw' && size > availableSpace * 1.2 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-sm rounded border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                This disk size ({size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`}) may be too large for your available space ({availableSpace >= 1000 ? `${(availableSpace/1024).toFixed(2)} TB` : `${availableSpace.toFixed(1)} GB`}). Thin-provisioned formats like {format} start small but can grow up to their full size.
              </span>
            </div>
          )}
          
          {size > 500 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-sm rounded border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-start">
              <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                Creating a {size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`} disk. Large disks may take longer to create and could impact system performance.
              </span>
            </div>
          )}
          
          {showRawFormatWarning && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-sm rounded border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                Warning: A {size}GB raw disk will immediately use {size}GB of storage space on your hard drive.
                Consider using QCOW2 format if disk space is limited.
              </span>
            </div>
          )}
        </div>
          <div className="flex justify-end">          <button
            type="submit"
            disabled={
              isLoading || 
              (availableSpace !== null && format === 'raw' && size > availableSpace * 0.9) ||
              (format === 'raw' && size > 800) // Restrict extremely large raw disks
            }
            title={
              availableSpace !== null && format === 'raw' && size > availableSpace * 0.9 ? 
                `Not enough disk space (need ${size >= 1000 ? `${(size/1024).toFixed(2)} TB` : `${size} GB`}, have ${availableSpace >= 1000 ? `${(availableSpace/1024).toFixed(2)} TB` : `${availableSpace.toFixed(1)} GB`})` :
              format === 'raw' && size > 800 ?
                `Raw disks larger than 800GB may cause performance issues` :
                ''
            }
            className={`
              px-4 py-2 bg-blue-600 text-white rounded-md font-medium
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-colors duration-200
              ${(isLoading || (availableSpace !== null && format === 'raw' && size > availableSpace * 0.9) || (format === 'raw' && size > 800)) ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? 'Creating...' : 'Create Disk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiskCreationForm;