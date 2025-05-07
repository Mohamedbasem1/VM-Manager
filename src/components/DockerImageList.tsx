import React, { useState, useEffect } from 'react';
import { DockerImage, Dockerfile } from '../types';
import { getDockerImages, getDockerfiles, buildDockerImage, deleteDockerImage } from '../services/dockerService';
import { RefreshCw, Tag, Package, AlertTriangle, CheckCircle, Trash2, Loader, Code, Clock, Server } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-purple-600 dark:text-purple-400 mr-2" />
          <span className="text-gray-600 dark:text-gray-300">Loading Docker images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg shadow-md mr-3">
            <Package className="text-white" size={22} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Docker Images</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBuildForm(!showBuildForm)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Tag size={16} className="mr-1.5" />
            {showBuildForm ? 'Cancel' : 'Build Image'}
          </button>
          <button
            onClick={loadData}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
      
      {showBuildForm && (
        <div className="mb-6 p-6 border border-blue-100 dark:border-blue-800 rounded-lg bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-md shadow-sm mr-2">
              <Tag size={18} className="text-white" />
            </div>
            Build Docker Image
          </h3>
          
          {buildError && (
            <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start">
              <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{buildError}</span>
            </div>
          )}
          
          {buildSuccess && (
            <div className="bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4 flex items-center">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all duration-200"
              >
                <option value="">-- Select a Dockerfile --</option>
                {dockerfiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.name}
                  </option>
                ))}
              </select>
              {dockerfiles.length === 0 && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400 flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  No Dockerfiles found. Create a Dockerfile first.
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all duration-200"
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
                  px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium flex items-center
                  hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  transition-all duration-200 shadow-md hover:shadow-lg
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
                    <Code size={18} className="mr-2" />
                    Build Image
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-40 h-40 mb-4">
            <DotLottieReact 
              src="https://lottie.host/74762741-9eea-4850-89f8-73b8490248e8/VffZvvNxzT.json" 
              loop 
              autoplay 
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">No Docker images available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Create a Dockerfile and build an image to get started with containerized applications
          </p>
          <button
            onClick={() => setShowBuildForm(true)}
            className="mt-5 flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Tag size={16} className="mr-1.5" />
            Build Your First Image
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
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
                <tr key={image.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Package size={16} className="text-blue-500 dark:text-blue-400 mr-2" />
                      {image.repository || '<none>'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className="px-2 py-1 text-xs font-semibold rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {image.tag || '<none>'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                    {image.id.substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Server size={14} className="mr-1.5 text-gray-400" />
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
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end ml-auto group"
                    >
                      {deletingImageId === image.id ? (
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

export default DockerImageList;