import React, { useState, useEffect, useRef } from 'react';
import { executeCommand, getCommandHistory } from '../services/qemuService';
import { Command } from '../types';
import { Terminal, Send, RefreshCw, CheckCircle, XCircle, Clock, Trash } from 'lucide-react';

const CommandTerminal: React.FC = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const commands = await getCommandHistory();
      setHistory(commands);
    } catch (err) {
      console.error('Failed to load command history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
      const result = await executeCommand(command);
      setHistory(prev => [result, ...prev]);
      setCommand('');
    } catch (err) {
      console.error('Failed to execute command:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Command['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="bg-gray-900 dark:bg-gray-950 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
      <div className="bg-gray-800 dark:bg-gray-900 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Terminal className="text-gray-400 dark:text-gray-300 mr-2" size={18} />
          <h2 className="text-gray-200 font-medium">QEMU Terminal</h2>
        </div>
        <div className="flex">
          <button
            onClick={clearHistory}
            className="text-gray-400 hover:text-gray-200 p-1 mr-2"
            title="Clear History"
          >
            <Trash size={16} />
          </button>
          <button
            onClick={loadHistory}
            className="text-gray-400 hover:text-gray-200 p-1"
            title="Refresh History"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      <div
        ref={terminalRef}
        className="bg-gray-900 dark:bg-gray-950 text-gray-200 p-4 font-mono text-sm overflow-y-auto"
        style={{ height: '300px' }}
      >
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="animate-spin text-gray-500 mr-2" size={20} />
            <span className="text-gray-500">Loading history...</span>
          </div>
        ) : (
          <>
            {history.length === 0 ? (
              <div className="text-gray-500 italic">No command history. Enter a command below to get started.</div>
            ) : (
              history.map((cmd) => (
                <div key={cmd.id} className="mb-4 border-b border-gray-800 dark:border-gray-700 pb-2">
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <span className="mr-1">{formatTimestamp(cmd.timestamp)}</span>
                    {getStatusIcon(cmd.status)}
                  </div>
                  <div className="flex items-center mb-1">
                    <span className="text-green-400 mr-2">$</span>
                    <span className="text-blue-300">{cmd.command}</span>
                  </div>
                  <div className="pl-5 text-gray-300 whitespace-pre-wrap">
                    {cmd.output || <span className="text-gray-500 italic">No output</span>}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="bg-gray-800 dark:bg-gray-900 p-3 flex items-center">
        <span className="text-green-400 mr-2">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter QEMU command..."
          className="flex-1 bg-gray-900 dark:bg-gray-800 text-gray-200 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className={`ml-2 p-2 rounded-md bg-blue-600 text-white ${
            loading || !command.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default CommandTerminal;