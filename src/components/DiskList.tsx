import React, { useState, useEffect, useCallback } from 'react';
import { VirtualDisk } from '../types';
import { 
  getVirtualDisks, 
  deleteVirtualDisk, 
  updateVirtualDisk, 
  getVirtualMachines 
} from '../services/qemuService';
import { HardDrive, Trash2, RefreshCw, Edit2, X, Check } from 'lucide-react';

// Define interfaces for individual disk actions to isolate state per disk
interface DiskAction {
  id: string;
  isLoading: boolean;
}

const DiskList: React.FC = () => {
  const [disks, setDisks] = useState<VirtualDisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use separate objects for tracking deletion and editing states
  const [deletingDisk, setDeletingDisk] = useState<DiskAction | null>(null);
  const [editingDisk, setEditingDisk] = useState<DiskAction & { size: number } | null>(null);
  
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Calculate total disk size
  const totalDiskSize = disks.reduce((total, disk) => total + disk.size, 0);

  // Create a memoized version of loadDisks to avoid recreation on each render
  const loadDisks = useCallback(async () => {
    setLoading(true);
    try {
      const diskList = await getVirtualDisks();
      setDisks(diskList);
      setError(null);
    } catch (err) {
      setError('Failed to load disks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh VMs when disks are updated
  const refreshVMs = useCallback(async () => {
    try {
      // Trigger a VM list refresh - this will be called after disk resize
      await getVirtualMachines();
      console.log('VM list refreshed after disk update');
    } catch (err) {
      console.error('Failed to refresh VMs:', err);
    }
  }, []);

  useEffect(() => {
    loadDisks();
  }, [loadDisks]);

  const handleDelete = async (id: string) => {
    setDeletingDisk({ id, isLoading: true });
    setDeleteError(null);

    try {
      await deleteVirtualDisk(id);
      setDisks(prevDisks => prevDisks.filter(disk => disk.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete disk');
    } finally {
      setDeletingDisk(null);
    }
  };

  const handleEditStart = (disk: VirtualDisk) => {
    setEditingDisk({ 
      id: disk.id, 
      size: disk.size,
      isLoading: false 
    });
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingDisk(null);
    setEditError(null);
  };

  const handleEditSave = async (id: string) => {
    if (!editingDisk) return;

    setEditingDisk({
      ...editingDisk,
      isLoading: true
    });

    setEditError(null);

    if (editingDisk.size <= 0) {
      setEditError('Disk size must be greater than 0 GB');
      setEditingDisk({
        ...editingDisk,
        isLoading: false
      });
      return;
    }

    try {
      const diskToUpdate = disks.find(disk => disk.id === id);
      if (!diskToUpdate) {
        throw new Error('Disk not found');
      }

      // Pass the refreshVMs callback to update VM cards when disk size changes
      await updateVirtualDisk(id, { size: editingDisk.size }, refreshVMs);

      setDisks(prevDisks => 
        prevDisks.map(disk => 
          disk.id === id ? { ...disk, size: editingDisk.size } : disk
        )
      );

      setEditingDisk(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update disk');
      setEditingDisk({
        ...editingDisk,
        isLoading: false
      });
    }
  };

  // Helper for applying changes to only the input value
  const handleSizeChange = (value: number) => {
    if (editingDisk && !isNaN(value)) {
      setEditingDisk({
        ...editingDisk,
        size: value
      });
    }
  };

  // Helper for handling action clicks to prevent event propagation
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  // Determine if a specific disk is being deleted
  const isDiskBeingDeleted = (id: string) => 
    deletingDisk !== null && deletingDisk.id === id;
  
  // Determine if a specific disk is being edited
  const isDiskBeingEdited = (id: string) => 
    editingDisk !== null && editingDisk.id === id;

  // Display loading state
  if (loading && disks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading disks...</span>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => loadDisks()}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  // Display empty state
  if (disks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <HardDrive size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No virtual disks available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Create a new disk to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HardDrive className="mr-2 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Virtual Disks</h2>
        </div>
        <button
          onClick={(e) => handleActionClick(e, loadDisks)}
          className="flex items-center px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </button>
      </div>
      
      {deleteError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {deleteError}
        </div>
      )}
      
      {editError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {editError}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Format
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {disks.map((disk) => (
              <tr key={disk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {disk.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 uppercase">
                  {disk.format}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {isDiskBeingEdited(disk.id) ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingDisk?.size || disk.size}
                        onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        id={`disk-size-input-${disk.id}`}
                        name={`disk-size-input-${disk.name}`}
                        data-testid={`disk-size-input-${disk.id}`}
                        aria-label={`Edit size for disk ${disk.name}`}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm dark:text-white disk-size-input"
                      />
                      <span className="ml-1">GB</span>
                    </div>
                  ) : (
                    <span data-testid={`disk-size-display-${disk.id}`}>{disk.size} GB</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(disk.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isDiskBeingDeleted(disk.id) ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => handleActionClick(e, () => setDeletingDisk(null))}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        disabled={deletingDisk?.isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, () => handleDelete(disk.id))}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        disabled={deletingDisk?.isLoading}
                        data-testid={`confirm-delete-${disk.id}`}
                      >
                        {deletingDisk?.isLoading ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  ) : isDiskBeingEdited(disk.id) ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => handleActionClick(e, handleEditCancel)}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        disabled={editingDisk?.isLoading}
                        data-testid={`cancel-edit-${disk.id}`}
                        id={`cancel-edit-${disk.name}`}
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, () => handleEditSave(disk.id))}
                        className="flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        disabled={editingDisk?.isLoading}
                        data-testid={`save-edit-${disk.id}`}
                        id={`save-edit-${disk.name}`}
                      >
                        <Check size={16} className="mr-1" />
                        {editingDisk?.isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => handleActionClick(e, () => handleEditStart(disk))}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        data-testid={`edit-disk-${disk.id}`}
                        id={`edit-disk-${disk.name}`}
                      >
                        <Edit2 size={16} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, () => setDeletingDisk({ id: disk.id, isLoading: false }))}
                        className="flex items-center text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        data-testid={`delete-disk-${disk.id}`}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiskList;