import React, { useState, useEffect } from 'react';
import { DockerContainer } from '../types';
import { getDockerContainers, stopDockerContainer } from '../services/dockerService';
import { RefreshCw, Box, Clock, StopCircle, Terminal, Activity, AlertTriangle } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const DockerContainerList: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stoppingContainer, setStoppingContainer] = useState<string | null>(null);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const containersData = await getDockerContainers();
      setContainers(containersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Docker containers');
    } finally {
      setLoading(false);
    }
  };

  const handleStopContainer = async (containerId: string) => {
    setStoppingContainer(containerId);
    try {
      await stopDockerContainer(containerId);
      // Remove container from the list or update its status
      setContainers(prevContainers => 
        prevContainers.filter(container => container.id !== containerId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop container');
    } finally {
      setStoppingContainer(null);
    }
  };

  if (loading && containers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading Docker containers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Box className="mr-2 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Running Containers</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadContainers}
            className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-1.5" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {containers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div className="w-40 h-40 mb-4">
            <DotLottieReact 
              src="https://lottie.host/91603d67-967d-4aea-afcd-9b6ba17182ea/sFaMyxLy55.json" 
              loop 
              autoplay 
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No running containers</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Build and run a container to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Container ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ports
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {containers.map((container) => (
                <tr key={container.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-300">
                    {container.id.substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {container.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {container.image}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      {container.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {container.ports || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleStopContainer(container.id)}
                      disabled={stoppingContainer === container.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end ml-auto"
                    >
                      {stoppingContainer === container.id ? (
                        <>
                          <Activity size={16} className="mr-1 animate-pulse" />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <StopCircle size={16} className="mr-1" />
                          Stop
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

export default DockerContainerList;