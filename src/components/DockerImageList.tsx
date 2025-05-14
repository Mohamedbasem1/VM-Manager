import React, { useState, useEffect } from 'react';
import { DockerImage, Dockerfile } from '../types';
import { 
  getDockerImages, 
  getDockerfiles, 
  buildDockerImage, 
  deleteDockerImage, 
  searchLocalImages, 
  searchDockerHub,
  pullDockerImage
} from '../services/dockerService';
import { 
  RefreshCw, 
  Tag, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Loader, 
  Code, 
  Clock, 
  Server, 
  Search, 
  Download,
  ExternalLink,
  X,
  Layers,
  Play
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Define CSS animations
const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .animate-pulse-slow {
    animation: pulse 2s infinite;
  }
`;

// Layer info for Docker image pulling
interface DockerLayerInfo {
  action?: string;
  progress?: string;
  complete?: boolean;
  timestamp?: number;
}

// Base interface for progress data
interface DockerPullProgressBase {
  repository?: string;
  status?: string;
}

// Progress interface for Docker image pulling
interface DockerPullProgress extends DockerPullProgressBase {
  [layerId: string]: DockerLayerInfo | string | undefined;
}

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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DockerImage[]>([]);
  
  // Docker Hub search state
  const [showDockerHubSearch, setShowDockerHubSearch] = useState(false);
  const [dockerHubQuery, setDockerHubQuery] = useState('');
  const [dockerHubResults, setDockerHubResults] = useState<any[]>([]);
  const [isSearchingDockerHub, setIsSearchingDockerHub] = useState(false);
  const [dockerHubError, setDockerHubError] = useState<string | null>(null);
  
  // Pull image state
  const [isPulling, setIsPulling] = useState(false);
  const [pullingImage, setPullingImage] = useState<string | null>(null);
  const [pullSuccess, setPullSuccess] = useState(false);
  const [pullError, setPullError] = useState<string | null>(null);
  
  // Progress bar state
  const [pullProgress, setPullProgress] = useState<DockerPullProgress>({});
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Build form state
  const [selectedDockerfilePath, setSelectedDockerfilePath] = useState('');
  const [imageTag, setImageTag] = useState('');

  const [startingImageId, setStartingImageId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startSuccess, setStartSuccess] = useState<string | null>(null);

  // Container start configuration state
  const [showStartModal, setShowStartModal] = useState(false);
  const [containerName, setContainerName] = useState('');
  const [containerPorts, setContainerPorts] = useState('');
  const [selectedImage, setSelectedImage] = useState<DockerImage | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Effect for local image search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocalImages(searchQuery);
        setSearchResults(results);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search Docker images');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
      setSearchResults(prevResults => prevResults.filter(image => image.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete Docker image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSearchDockerHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dockerHubQuery.trim()) return;
    
    setIsSearchingDockerHub(true);
    setDockerHubError(null);
    
    try {
      const results = await searchDockerHub(dockerHubQuery);
      setDockerHubResults(results);
    } catch (err) {
      setDockerHubError(err instanceof Error ? err.message : 'Failed to search Docker Hub');
    } finally {
      setIsSearchingDockerHub(false);
    }
  };

  const handlePullImage = async (imageName: string) => {
    setPullingImage(imageName);
    setIsPulling(true);
    setPullError(null);
    setPullSuccess(false);
    setPullProgress({});
    setOverallProgress(0);
    
    try {
      // Get the pull progress stream from the API
      const response = await fetch(`http://localhost:5002/api/docker/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageName }),
      });

      // Handle HTTP error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to pull Docker image');
      }

      // Create a reader to read the stream
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Unable to read response stream');
      }

      // Process the streamed response
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and parse each line
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              // Update progress state
              setPullProgress(data.progress);
              
              // Calculate overall progress
              const progressEntries = Object.entries(data.progress);
              if (progressEntries.length > 0) {
                // Calculate average progress for layers that have progress info
                let layerCount = 0;
                let completedCount = 0;
                let progressSum = 0;
                
                progressEntries.forEach(([key, value]: [string, any]) => {
                  if (key !== 'repository' && key !== 'status') {
                    layerCount++;
                    
                    if (value.complete) {
                      completedCount++;
                    } else if (value.progress && typeof value.progress === 'string') {
                      // Extract percentage from progress string like "45.12%" or "10MB/20MB"
                      const percentMatch = value.progress.match(/(\d+(\.\d+)?)%/);
                      if (percentMatch) {
                        progressSum += parseFloat(percentMatch[1]);
                      } else {
                        // Try to parse progress like "10MB/20MB"
                        const bytesMatch = value.progress.match(/(\d+(\.\d+)?)\s*\w+\/(\d+(\.\d+)?)\s*\w+/);
                        if (bytesMatch) {
                          const current = parseFloat(bytesMatch[1]);
                          const total = parseFloat(bytesMatch[3]);
                          if (!isNaN(current) && !isNaN(total) && total > 0) {
                            progressSum += (current / total) * 100;
                          }
                        }
                      }
                    }
                  }
                });
                
                // Calculate overall progress
                let calculatedProgress = 0;
                if (layerCount > 0) {
                  calculatedProgress = (completedCount * 100 + progressSum) / layerCount;
                }
                
                setOverallProgress(Math.min(Math.round(calculatedProgress), 99)); // Cap at 99% until complete
              }
            } else if (data.type === 'complete') {
              // Pull completed successfully
              setPullSuccess(true);
              setOverallProgress(100);
              
              // Reload images after pulling
              const updatedImages = await getDockerImages();
              setImages(updatedImages);
              
              // Clear Docker Hub results after successful pull
              setTimeout(() => {
                setPullSuccess(false);
                if (imageName === dockerHubQuery) {
                  setDockerHubQuery('');
                  setDockerHubResults([]);
                }
              }, 3000);
              
              break;
            } else if (data.type === 'error') {
              throw new Error(data.message || `Failed to pull image: ${imageName}`);
            }
          } catch (e) {
            console.error('Error parsing pull progress:', e, line);
          }
        }
      }
    } catch (err) {
      setPullError(err instanceof Error ? err.message : `Failed to pull image: ${imageName}`);
      setOverallProgress(0);
    } finally {
      setIsPulling(false);
      setPullingImage(null);
    }
  };
  // Formats the progress text from Docker pull progress data
  const formatProgressText = (progress: DockerPullProgress) => {
    if (!progress) return 'Preparing...';
    
    if (progress.status && typeof progress.status === 'string' && progress.status.includes('Downloaded')) {
      return 'Download complete';
    }
    
    const layers = Object.entries(progress).filter(
      ([key, _]) => key !== 'repository' && key !== 'status'
    );
    
    // Count completed and in-progress layers
    const completed = layers.filter(([_, value]) => {
      const layerInfo = value as DockerLayerInfo;
      return layerInfo && layerInfo.complete;
    }).length;
    const total = layers.length;
    
    if (total === 0) return 'Preparing...';
    
    // Find a layer that's actively downloading/extracting to show its progress
    const activeLayer = layers.find(([_, value]) => {
      const layerInfo = value as DockerLayerInfo;
      return layerInfo && layerInfo.action && layerInfo.progress && !layerInfo.complete;
    });
    
    if (activeLayer) {
      const [_, value] = activeLayer;
      const layerInfo = value as DockerLayerInfo;
      return `${completed}/${total} layers complete - ${layerInfo.action}: ${layerInfo.progress}`;
    }
    
    return `${completed}/${total} layers complete`;
  };

  const openStartModal = (image: DockerImage) => {
    setSelectedImage(image);
    setContainerName('');
    setContainerPorts('');
    setShowStartModal(true);
    setStartError(null);
  };

  const closeStartModal = () => {
    setShowStartModal(false);
    setSelectedImage(null);
  };

  const handleStartContainer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!selectedImage) return;
    
    const imageTag = selectedImage.repository && selectedImage.tag ? 
      `${selectedImage.repository}:${selectedImage.tag}` : 
      selectedImage.id;
    
    setStartingImageId(selectedImage.id);
    setStartError(null);
    setStartSuccess(null);
    
    try {
      // Pass options for container name and ports if provided
      const options: { name?: string; ports?: string } = {};
      if (containerName.trim()) options.name = containerName.trim();
      if (containerPorts.trim()) options.ports = containerPorts.trim();
      
      const containerId = await runDockerContainer(imageTag, options);
      setStartSuccess(`Container started successfully with ID: ${containerId}`);
      
      // Close modal and reset form
      closeStartModal();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setStartSuccess(null);
      }, 3000);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start container');
    } finally {
      setStartingImageId(null);
    }
  };

  const displayedImages = searchQuery.trim() ? searchResults : images;

  // Inject CSS animations
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.id = 'docker-image-animations';
    styleTag.innerHTML = fadeInAnimation;
    document.head.appendChild(styleTag);

    return () => {
      const existingStyle = document.getElementById('docker-image-animations');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
            onClick={() => setShowDockerHubSearch(!showDockerHubSearch)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Download size={16} className="mr-1.5" />
            {showDockerHubSearch ? 'Close' : 'Pull Image'}
          </button>
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
      
      {/* Search box for local images */}
      <div className="relative mb-6">
        <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
          <Search className="text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow ml-2 bg-transparent focus:outline-none text-gray-700 dark:text-gray-200"
            placeholder="Search local images..."
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
          {isSearching && <RefreshCw size={16} className="animate-spin text-purple-500 ml-2" />}
        </div>
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No local images match your search.</p>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start">
          <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Docker Hub Search Panel */}
      {showDockerHubSearch && (
        <div className="mb-6 p-6 border border-green-100 dark:border-green-800 rounded-lg bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-1.5 rounded-md shadow-sm mr-2">
              <Download size={18} className="text-white" />
            </div>
            Search and Pull Docker Images
          </h3>
          
          {dockerHubError && (
            <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start">
              <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{dockerHubError}</span>
            </div>
          )}
          
          {pullError && (
            <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start">
              <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{pullError}</span>
            </div>
          )}
          
          {pullSuccess && (
            <div className="bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4 flex items-center">
              <CheckCircle size={18} className="mr-2" />
              Docker image pulled successfully!
            </div>
          )}
          
          {isPulling && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Layers size={18} className="text-blue-500 dark:text-blue-400 mr-2 animate-pulse" />
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Pulling image: {pullingImage}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-teal-500 transition-all duration-300" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                <span>{formatProgressText(pullProgress)}</span>
                <span>{overallProgress}%</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSearchDockerHub} className="space-y-4">
            <div>
              <label htmlFor="dockerhub-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Docker Hub
              </label>
              <div className="flex">
                <input
                  id="dockerhub-search"
                  type="text"
                  value={dockerHubQuery}
                  onChange={(e) => setDockerHubQuery(e.target.value)}
                  placeholder="e.g., nginx, postgres:latest, ubuntu:20.04"
                  className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isSearchingDockerHub || !dockerHubQuery.trim()}
                  className={`
                    px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-r-lg font-medium flex items-center
                    hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    transition-all duration-200 shadow-md hover:shadow-lg
                    ${(isSearchingDockerHub || !dockerHubQuery.trim()) ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isSearchingDockerHub ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={18} className="mr-2" />
                      Search
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search for official or community images
              </p>
            </div>
          </form>
          
          {/* Docker Hub Search Results */}
          {dockerHubResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Search Results</h4>
              <div className="overflow-x-auto bg-white/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stars
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Official
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dockerHubResults.map((image, index) => (
                      <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {image.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <div className="line-clamp-2">
                            {image.description || 'No description available'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {image.star_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {image.is_official ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              Official
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                              Community
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <a
                              href={`https://hub.docker.com/_/${image.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <ExternalLink size={16} className="mr-1" />
                              <span>View</span>
                            </a>
                            <button
                              onClick={() => handlePullImage(image.name)}
                              disabled={isPulling}
                              className={`
                                text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center
                                ${isPulling ? 'opacity-70 cursor-not-allowed' : ''}
                              `}
                            >
                              {isPulling && pullingImage === image.name ? (
                                <>
                                  <Loader size={16} className="mr-1 animate-spin" />
                                  Pulling...
                                </>
                              ) : (
                                <>
                                  <Download size={16} className="mr-1" />
                                  Pull
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
      
      {displayedImages.length === 0 && !searchQuery ? (
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
          <div className="mt-5 flex space-x-3">
            <button
              onClick={() => setShowDockerHubSearch(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download size={16} className="mr-1.5" />
              Pull From Docker Hub
            </button>
            <button
              onClick={() => setShowBuildForm(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Tag size={16} className="mr-1.5" />
              Build Your First Image
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-300">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayedImages.map((image, index) => (
                <tr 
                  key={image.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Package size={18} className="text-blue-500 dark:text-blue-400 mr-2" />
                      <span className="truncate max-w-xs">{image.repository || '<none>'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 shadow-sm">
                      {image.tag || '<none>'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                    {image.id.substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Server size={16} className="mr-1.5 text-gray-400" />
                      {image.size}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1.5 text-gray-400" />
                      {image.created}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openStartModal(image)}
                        disabled={startingImageId === image.id}
                        className={`flex items-center rounded-md px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/60 transition-colors animate-pulse-slow ${
                          startingImageId === image.id ? 'opacity-50 cursor-not-allowed animate-none' : ''
                        }`}
                        title="Start container"
                      >
                        {startingImageId === image.id ? (
                          <>
                            <Loader size={16} className="animate-spin mr-1.5" />
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} className="mr-1.5" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={deletingImageId === image.id}
                        className={`flex items-center rounded-md px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors ${
                          deletingImageId === image.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Delete image"
                      >
                        {deletingImageId === image.id ? (
                          <>
                            <Loader size={16} className="animate-spin mr-1.5" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} className="mr-1.5" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Show message if search has no results */}
          {searchQuery && displayedImages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No Docker images match your search term: <span className="font-semibold">{searchQuery}</span>
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
      
      {startSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded shadow-lg z-50 max-w-md animate-slideIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{startSuccess}</p>
            </div>
            <button 
              onClick={() => setStartSuccess(null)} 
              className="ml-auto -mx-1.5 -my-1.5 rounded-full p-1.5 focus:outline-none"
            >
              <X className="h-4 w-4 text-green-500" />
            </button>
          </div>
        </div>
      )}
      
      {startError && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded shadow-lg z-50 max-w-md animate-slideIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{startError}</p>
            </div>
            <button 
              onClick={() => setStartError(null)} 
              className="ml-auto -mx-1.5 -my-1.5 rounded-full p-1.5 focus:outline-none"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Container Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="container-start-modal" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 sm:p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-lg shadow-md mr-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                      Start Container
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeStartModal}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <form onSubmit={handleStartContainer} className="space-y-5">
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600/50">
                      <label htmlFor="image-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Image
                      </label>
                      <div className="flex items-center bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2.5">
                        <Package className="text-blue-500 dark:text-blue-400 mr-2" size={18} />
                        <input
                          type="text"
                          id="image-name"
                          className="flex-1 bg-transparent focus:outline-none text-gray-900 dark:text-white font-medium"
                          value={selectedImage?.repository && selectedImage?.tag 
                            ? `${selectedImage.repository}:${selectedImage.tag}` 
                            : selectedImage?.id || ''}
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="container-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Container Name <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="container-name"
                          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="e.g., my-web-server"
                          value={containerName}
                          onChange={(e) => setContainerName(e.target.value)}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        A custom name for your container for easy identification
                      </p>
                    </div>
                    <div>
                      <label htmlFor="port-mapping" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Port Mapping <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="port-mapping"
                          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="e.g., 8080:80"
                          value={containerPorts}
                          onChange={(e) => setContainerPorts(e.target.value)}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-start">
                        <span className="flex-shrink-0 mt-0.5 mr-1.5">
                          <Server size={14} className="text-gray-400" />
                        </span>
                        Map host ports to container ports (host:container)
                      </p>
                    </div>
                    {startError && (
                      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-md flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-500" />
                        <p className="text-sm">{startError}</p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md shadow-sm px-5 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-base font-medium text-white hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                  onClick={handleStartContainer}
                  disabled={startingImageId !== null}
                >
                  {startingImageId !== null ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play size={18} className="mr-2" />
                      Start Container
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-3 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  onClick={closeStartModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockerImageList;