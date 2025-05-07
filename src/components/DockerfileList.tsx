import React, { useState, useEffect } from 'react';
import { Dockerfile } from '../types';
import { getDockerfiles, deleteDockerfile } from '../services/dockerService';
import { RefreshCw, FileCode, Clock, File, AlertTriangle, Trash2, Loader } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-purple-600 dark:text-purple-400 mr-2" />
          <span className="text-gray-600 dark:text-gray-300">Loading Dockerfiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg shadow-md mr-3">
            <FileCode className="text-white" size={22} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dockerfiles</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadDockerfiles}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className="mr-1.5" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start">
          <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {dockerfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-40 h-40 mb-4">
            <DotLottieReact 
              src="https://lottie.host/d4d5f47c-5389-4769-b194-0cc3b503446a/TLGxjeodpz.json" 
              loop 
              autoplay 
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">No Dockerfiles available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Create a Dockerfile to get started with containerized applications
          </p>
          <button
            onClick={() => window.location.href = '/create?tab=docker&subTab=dockerfile'}
            className="mt-5 flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FileCode size={16} className="mr-1.5" />
            Create Your First Dockerfile
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
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
                <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <FileCode size={16} className="text-indigo-500 dark:text-indigo-400 mr-2" />
                      {dockerfile.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono max-w-xs truncate">
                    <span className="hover:opacity-70 cursor-pointer transition-opacity" title={dockerfile.path}>
                      {dockerfile.path}
                    </span>
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
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end ml-auto group"
                    >
                      {deletingPath === dockerfile.path ? (
                        <>
                          <Loader size={16} className="mr-1 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} className="mr-1 group-hover:animate-pulse" />
                          <span>Delete</span>
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