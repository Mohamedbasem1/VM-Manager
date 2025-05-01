import React from 'react';
import VMList from '../components/VMList';
import DiskList from '../components/DiskList';
import { Cpu, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <Link
          to="/create"
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          New VM
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <VMList />
        <DiskList />
      </div>
    </div>
  );
};

export default Dashboard;