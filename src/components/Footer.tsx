import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-gray-300 py-4 px-6 mt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© 2025 QEMU VM Manager</p>
          </div>
          <div>
            <ul className="flex space-x-4">
              <li>
                <a 
                  href="https://www.qemu.org/documentation/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200"
                >
                  QEMU Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://wiki.qemu.org/Category:Status" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200"
                >
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;