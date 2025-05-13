import React, { useState, useEffect } from 'react';
import { QEMUConnection } from '../types';
import { configureQEMUConnection, getQEMUConnectionStatus } from '../services/qemuService';
import { Server, Globe, Lock, CheckCircle, XCircle, RefreshCw, Activity, Info, HardDrive, Folder } from 'lucide-react';

const QEMUConnectionSettings: React.FC = () => {
  const [connection, setConnection] = useState<QEMUConnection>({
    host: 'localhost',
    port: 6000,
    enabled: true,
    secured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean, version?: string, machineDetails?: any } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    lastChecked: Date | null;
    checking: boolean;
    details?: any;
  }>({
    connected: false,
    lastChecked: null,
    checking: false,
    details: null
  });
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus((prev) => ({ ...prev, checking: true }));
      try {
        const result = await getQEMUConnectionStatus();
        setConnectionStatus({
          connected: result.connected,
          lastChecked: new Date(),
          checking: false,
          details: {
            version: result.version,
            ...(result.machineDetails || {})
          }
        });
        setTestResult(result);
      } catch (err) {
        setConnectionStatus({
          connected: false,
          lastChecked: new Date(),
          checking: false
        });
        setTestResult({ connected: false });
      }
    };

    checkConnection();

    const intervalId = setInterval(checkConnection, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConnection(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await configureQEMUConnection(connection);
      setSuccess(true);

      testConnection();

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await getQEMUConnectionStatus();
      setTestResult(result);
      setConnectionStatus({
        connected: result.connected,
        lastChecked: new Date(),
        checking: false,
        details: {
          version: result.version,
          ...(result.machineDetails || {})
        }
      });
    } catch (error) {
      setTestResult({ connected: false });
      setError(error instanceof Error ? error.message : 'Could not test connection');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center mb-2 text-gray-800 dark:text-white">
          <Server className="mr-2 text-blue-600 dark:text-blue-400" />
          QEMU Connection Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Configure the connection to your QEMU hypervisor
        </p>
      </div>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
        <h3 className="text-md font-semibold mb-2 flex items-center text-gray-700 dark:text-gray-200">
          <Activity className="mr-2 text-blue-600 dark:text-blue-400" />
          Connection Status
        </h3>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {connectionStatus.connected ? (
              <CheckCircle className="text-green-500 dark:text-green-400 mr-2" size={18} />
            ) : (
              <XCircle className="text-red-500 dark:text-red-400 mr-2" size={18} />
            )}
            <span className="text-gray-700 dark:text-gray-200">
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={testConnection}
            disabled={isTesting}
            className="ml-4 inline-flex items-center text-xs p-1 px-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-200 transition-colors"
          >
            <RefreshCw size={14} className={`mr-1 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test'}
          </button>
        </div>

        {connectionStatus.lastChecked && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last checked: {connectionStatus.lastChecked.toLocaleTimeString()}
          </div>
        )}

        {connectionStatus.connected && connectionStatus.details && (
          <div className="mt-3 text-sm border-t border-gray-200 dark:border-gray-600 pt-3">
            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
              <Info size={14} className="mr-2 text-blue-600 dark:text-blue-400" />
              QEMU Version: {connectionStatus.details.version || 'Unknown'}
            </div>

            {connectionStatus.details.vms && (
              <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                <HardDrive size={14} className="mr-2 text-blue-600 dark:text-blue-400" />
                VMs Available: {connectionStatus.details.vms.length || 0}
              </div>
            )}

            {connectionStatus.details.storage && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Folder size={14} className="mr-2 text-blue-600 dark:text-blue-400" />
                Storage: {connectionStatus.details.storage}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              <Globe className="inline mr-1" size={16} />
              Host
            </label>
            <input
              type="text"
              name="host"
              value={connection.host}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Port
            </label>
            <input
              type="number"
              name="port"
              value={connection.port}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="6000"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="secured"
              name="secured"
              checked={connection.secured}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="secured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              <Lock className="inline mr-1" size={16} />
              Use secure connection (TLS)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={connection.enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable QEMU connection
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm flex items-center">
            <CheckCircle className="mr-2" size={16} />
            Settings saved successfully!
          </div>
        )}

        {testResult && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            testResult.connected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {testResult.connected ? (
              <div className="flex items-center">
                <CheckCircle className="mr-2" size={16} />
                Connected successfully to QEMU {testResult.version && `(${testResult.version})`}
              </div>
            ) : (
              <div className="flex items-center">
                <XCircle className="mr-2" size={16} />
                Failed to connect to QEMU server
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={16} />
                Saving...
              </>
            ) : (
              <>Save Settings</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QEMUConnectionSettings;