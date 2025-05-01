import React, { useState } from 'react';
import { VirtualMachine } from '../types';
import { PlayCircle, StopCircle, Trash2, HardDrive, Cpu, MemoryStick as Memory, Edit2 } from 'lucide-react';
import { startVirtualMachine, stopVirtualMachine, deleteVirtualMachine, updateVirtualMachine } from '../services/qemuService';

interface VMCardProps {
  vm: VirtualMachine;
  onVMUpdated: () => void;
  onVMDeleted: () => void;
}

const VMCard: React.FC<VMCardProps> = ({ vm, onVMUpdated, onVMDeleted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({
    name: vm.name,
    cpuCores: vm.cpuCores,
    memory: vm.memory
  });
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startVirtualMachine(vm.id);
      onVMUpdated();
    } catch (err) {
      console.error('Failed to start VM:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopVirtualMachine(vm.id);
      onVMUpdated();
    } catch (err) {
      console.error('Failed to stop VM:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteVirtualMachine(vm.id);
      onVMDeleted();
    } catch (err) {
      console.error('Failed to delete VM:', err);
      setIsLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const handleEdit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateVirtualMachine(vm.id, {
        name: editedValues.name,
        cpuCores: editedValues.cpuCores,
        memory: editedValues.memory
      });
      onVMUpdated();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update VM');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (vm.status) {
      case 'running':
        return 'text-green-500';
      case 'stopped':
        return 'text-gray-500 dark:text-gray-400';
      case 'paused':
        return 'text-yellow-500';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const formatMemory = (memory: number) => {
    if (memory < 1024) return `${memory} MB`;
    return `${(memory / 1024).toFixed(1)} GB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-800 dark:to-purple-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold truncate">{vm.name}</h3>
          <div className={`flex items-center ${getStatusColor()}`}>
            <span className="inline-block h-3 w-3 rounded-full bg-current mr-2"></span>
            <span className="text-white text-sm capitalize">{vm.status}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 dark:text-white">
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={editedValues.name}
                onChange={(e) => setEditedValues(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPU Cores</label>
              <input
                type="number"
                min="1"
                max="16"
                value={editedValues.cpuCores}
                onChange={(e) => setEditedValues(prev => ({ ...prev, cpuCores: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Memory (MB)</label>
              <input
                type="number"
                min="512"
                max="16384"
                step="512"
                value={editedValues.memory}
                onChange={(e) => setEditedValues(prev => ({ ...prev, memory: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <Cpu size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{vm.cpuCores} Cores</span>
              </div>
              <div className="flex items-center">
                <Memory size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{formatMemory(vm.memory)}</span>
              </div>
              <div className="flex items-center col-span-2">
                <HardDrive size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {vm.disk.name} ({vm.disk.size} GB, {vm.disk.format})
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              <div>Created: {formatDate(vm.createdAt)}</div>
              {vm.lastStarted && <div>Last started: {formatDate(vm.lastStarted)}</div>}
            </div>
          </>
        )}
        
        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            {vm.status === 'running' ? (
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
              >
                <StopCircle size={16} className="mr-1" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
              >
                <PlayCircle size={16} className="mr-1" />
                Start
              </button>
            )}
            {!isEditing && vm.status !== 'running' && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Edit2 size={16} className="mr-1" />
                Edit
              </button>
            )}
          </div>
          
          {showConfirmDelete ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VMCard;