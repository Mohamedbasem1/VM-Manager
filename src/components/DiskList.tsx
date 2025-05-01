import React, { useState, useEffect } from 'react';
import { VirtualDisk } from '../types';
import { getVirtualDisks, deleteVirtualDisk, updateVirtualDisk } from '../services/qemuService';
import { HardDrive, Trash2, RefreshCw, Edit2, X, Check } from 'lucide-react';

const DiskList: React.FC = () => {
  const [disks, setDisks] = useState<VirtualDisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editedDisk, setEditedDisk] = useState<{ size: number }>({ size: 0 });

  const loadDisks = async () => {
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
  };

  useEffect(() => {
    loadDisks();
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteVirtualDisk(id);
      setDisks(disks.filter(disk => disk.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete disk');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEditStart = (disk: VirtualDisk) => {
    setEditId(disk.id);
    setEditedDisk({ size: disk.size });
    setIsEditing(false); // Set to false as we're just starting the edit, not submitting yet
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditId(null);
    setIsEditing(false);
    setEditError(null);
  };

  const handleEditSave = async (id: string) => {
    setIsEditing(true);
    setEditError(null);
    
    // Form validation
    if (editedDisk.size <= 0) {
      setEditError('Disk size must be greater than 0 GB');
      setIsEditing(false);
      return;
    }
    
    try {
      const updatedDisk = await updateVirtualDisk(id, { size: editedDisk.size });
      setDisks(disks.map(disk => disk.id === id ? { ...disk, ...updatedDisk } : disk));
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update disk');
    } finally {
      setIsEditing(false);
    }
  };

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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={loadDisks}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

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
          onClick={loadDisks}
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
                  {editId === disk.id ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editedDisk.size}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            setEditedDisk({ size: value });
                          }
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm dark:text-white"
                      />
                      <span className="ml-1">GB</span>
                    </div>
                  ) : (
                    <>{disk.size} GB</>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(disk.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {deleteId === disk.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setDeleteId(null)}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(disk.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  ) : editId === disk.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleEditCancel}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        disabled={isEditing}
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(disk.id)}
                        className="flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        disabled={isEditing}
                      >
                        <Check size={16} className="mr-1" />
                        {isEditing ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditStart(disk)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Edit2 size={16} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(disk.id)}
                        className="flex items-center text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
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