import React, { useState } from 'react';
import { createDockerfile } from '../services/dockerService';
import { FileCode, Check, AlertCircle, Save } from 'lucide-react';

const DockerfileCreationForm: React.FC<{ onDockerfileCreated: () => void }> = ({ onDockerfileCreated }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('FROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]');
  const [directory, setDirectory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Dockerfile templates
  const templates = {
    node: 'FROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
    python: 'FROM python:3.9\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 5000\nCMD ["python", "app.py"]',
    nginx: 'FROM nginx:latest\nCOPY ./html /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]',
    ubuntu: 'FROM ubuntu:latest\nRUN apt-get update && apt-get install -y \\\n    curl \\\n    wget \\\n    && rm -rf /var/lib/apt/lists/*\nWORKDIR /app\nCMD ["/bin/bash"]'
  };

  const handleSelectTemplate = (templateKey: keyof typeof templates) => {
    setContent(templates[templateKey]);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await createDockerfile(name, content, directory || undefined);
      setSuccess(true);
      setName('');
      setContent(templates.node);
      setDirectory('');
      onDockerfileCreated();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Dockerfile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center mb-4">
        <FileCode className="mr-2 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Dockerfile</h2>
      </div>
      
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 flex items-center">
          <Check size={20} className="mr-2" />
          Dockerfile created successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="dockerfile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dockerfile Name
          </label>
          <input
            id="dockerfile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="my-dockerfile"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If you don't include "Dockerfile" in the name, it will be prefixed (e.g., "Dockerfile.my-dockerfile")
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="dockerfile-directory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Directory (Optional)
          </label>
          <input
            id="dockerfile-directory"
            type="text"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="C:\path\to\directory (leave empty for default location)"
          />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="dockerfile-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dockerfile Content
            </label>
            <button 
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-xs"
            >
              {showTemplates ? 'Hide templates' : 'Show templates'}
            </button>
          </div>
          
          {showTemplates && (
            <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTemplate('node')}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30"
              >
                Node.js
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('python')}
                className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/30"
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('nginx')}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/30"
              >
                Nginx
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('ubuntu')}
                className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800/30"
              >
                Ubuntu
              </button>
            </div>
          )}
          
          <textarea
            id="dockerfile-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm"
            rows={15}
            placeholder="FROM node:14..."
          />
          
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-sm rounded border border-yellow-100 dark:border-yellow-800 text-gray-700 dark:text-gray-300 flex items-start">
            <AlertCircle size={16} className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Make sure Docker is installed and running on your system before building images.
            </span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              px-4 py-2 bg-blue-600 text-white rounded-md font-medium flex items-center
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-colors duration-200
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Creating...' : 'Create Dockerfile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DockerfileCreationForm;