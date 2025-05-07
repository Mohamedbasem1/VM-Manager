import React, { useState, useEffect } from 'react';
import { DockerImage, Dockerfile } from '../types';
import { getDockerImages, getDockerfiles, buildDockerImage, deleteDockerImage } from '../services/dockerService';
import { RefreshCw, Tag, Package, Clock, Box, AlertTriangle, CheckCircle, Loader, Trash2 } from 'lucide-react';

const DockerImageList: React.FC = () => {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [dockerfiles, setDockerfiles] = useState<Dockerfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildLoading, setBuildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [showBuildForm, setShowBuildForm] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  
  // Build form state
  const [selectedDockerfilePath, setSelectedDockerfilePath] = useState('');
  const [imageTag, setImageTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [imagesData, dockerfilesData] = await Promise.all([
        getDockerImages(),
        getDockerfiles()
      ]);
      
      setImages(imagesData);
      setDockerfiles(dockerfilesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Docker data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuildLoading(true);
    setBuildError(null);
    setBuildSuccess(false);
    
    try {
      await buildDockerImage(selectedDockerfilePath, imageTag);
      setBuildSuccess(true);
      setImageTag('');
      
      // Reload image list
      const updatedImages = await getDockerImages();
      setImages(updatedImages);
      
      // Reset success message and form after 3 seconds
      setTimeout(() => {
        setBuildSuccess(false);
        setShowBuildForm(false);
      }, 3000);
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : 'Failed to build Docker image');
    } finally {
      setBuildLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      await deleteDockerImage(imageId);
      // Remove the deleted image from the list
      setImages(prevImages => prevImages.filter(image => image.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete Docker image');
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading Docker images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="mr-2 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Docker Images</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBuildForm(!showBuildForm)}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Tag size={16} className="mr-1.5" />
            {showBuildForm ? 'Cancel' : 'Build Image'}
          </button>
          <button
            onClick={loadData}
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
      
      {showBuildForm && (
        <div className="mb-6 p-4 border border-blue-100 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 flex items-center">
            <Tag size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
            Build Docker Image
          </h3>
          
          {buildError && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-start">
              <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{buildError}</span>
            </div>
          )}
          
          {buildSuccess && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle size={18} className="mr-2" />
              Docker image built successfully!
            </div>
          )}
          
          <form onSubmit={handleBuildImage} className="space-y-4">
            <div>
              <label htmlFor="dockerfile-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Dockerfile
              </label>
              <select
                id="dockerfile-select"
                value={selectedDockerfilePath}
                onChange={(e) => setSelectedDockerfilePath(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="">-- Select a Dockerfile --</option>
                {dockerfiles.map((dockerfile) => (
                  <option key={dockerfile.path} value={dockerfile.path}>
                    {dockerfile.name} - {dockerfile.path}
                  </option>
                ))}
              </select>
              {dockerfiles.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  No Dockerfiles found. Create one first.
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="image-tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image Name/Tag
              </label>
              <div className="flex">
                <input
                  id="image-tag"
                  type="text"
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  placeholder="my-image:latest"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Format: name:tag (e.g., myapp:latest)
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={buildLoading || dockerfiles.length === 0}
                className={`
                  px-4 py-2 bg-blue-600 text-white rounded-md font-medium flex items-center
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  transition-colors duration-200
                  ${(buildLoading || dockerfiles.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {buildLoading ? (
                  <>
                    <Loader size={18} className="mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Tag size={18} className="mr-2" />
                    Build Image
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <Package size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No Docker images available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Build an image to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Image ID
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
              {images.map((image, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {image.repository}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                      {image.tag}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                    {image.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Box size={14} className="mr-1.5 text-gray-400" />
                      {image.size}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5 text-gray-400" />
                      {image.created}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingImageId === image.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end ml-auto"
                    >
                      {deletingImageId === image.id ? (
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

export default DockerImageList;