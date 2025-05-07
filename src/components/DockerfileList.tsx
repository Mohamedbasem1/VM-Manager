import React, { useState, useEffect } from 'react';
import { Dockerfile } from '../types';
import { getDockerfiles, deleteDockerfile } from '../services/dockerService';
import { RefreshCw, FileCode, Clock, File, AlertTriangle, Trash2, Loader } from 'lucide-react';

const DockerfileList: React.FC = () => {
  const [dockerfiles, setDockerfiles] = useState<Dockerfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  useEffect(() => {
    loadDockerfiles();
  }, []);

  const loadDockerfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDockerfiles();
      setDockerfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Dockerfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDockerfile = async (path: string) => {
    setDeletingPath(path);
    try {
      await deleteDockerfile(path);
      // Remove the deleted dockerfile from the list
      setDockerfiles(prevFiles => prevFiles.filter(file => file.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete Dockerfile');
    } finally {
      setDeletingPath(null);
    }
  };

  if (loading && dockerfiles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading Dockerfiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileCode className="mr-2 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dockerfiles</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadDockerfiles}
            className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-1.5" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-start">
          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {dockerfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <FileCode size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No Dockerfiles available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Create a Dockerfile to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Path
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
              {dockerfiles.map((dockerfile, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {dockerfile.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono max-w-xs truncate">
                    {dockerfile.path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <File size={14} className="mr-1.5 text-gray-400" />
                      {dockerfile.size ? `${Math.round(dockerfile.size / 1024)} KB` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5 text-gray-400" />
                      {new Date(dockerfile.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteDockerfile(dockerfile.path)}
                      disabled={deletingPath === dockerfile.path}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end ml-auto"
                    >
                      {deletingPath === dockerfile.path ? (
                        <>
                          <Loader size={16} className="mr-1 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DockerfileList;