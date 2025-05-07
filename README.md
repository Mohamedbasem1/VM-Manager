#  VM Manager

![QEMU VM Manager](https://img.shields.io/badge/QEMU-VM%20Manager-purple)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.2-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-cyan)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern, feature-rich web application for managing QEMU virtual machines and disk images with a beautiful React/TypeScript frontend and Node.js/Express backend.

![Screenshot of QEMU VM Manager Dashboard](https://example.com/screenshot.png)

## 🚀 Features

- **Virtual Disk Management**
  - Create virtual disks with various formats (raw, qcow2, vdi, vmdk)
  - Comprehensive format information and storage considerations
  - Resize existing virtual disks
  - Delete disks when no longer needed

- **Virtual Machine Management**
  - Create VMs with configurable CPU cores and memory
  - Start, stop, and monitor VM status
  - Attach virtual disks and ISO images
  - Edit VM configuration

- **User-Friendly Interface**
  - Clean, responsive design with TailwindCSS
  - Dark mode support
  - Intuitive workflow from disk creation to VM deployment
  - Detailed status information

- **QEMU Integration**
  - Direct integration with QEMU via backend API
  - Support for all major QEMU features
  - Command terminal for advanced operations
  - Format-specific optimizations

## 📋 Requirements

- **Frontend**
  - Node.js 16.x or higher
  - npm or yarn package manager

- **Backend**
  - Node.js 14.x or higher
  - QEMU installed and available in system PATH
  - Windows, Linux or macOS (with slight configuration changes)

## 🔧 Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Cloud_project/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure QEMU path in `server.js` if needed:
   ```javascript
   const QEMU_PATH = 'C:\\Program Files\\qemu'; // Adjust for your system
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. From the project root directory:
   ```bash
   cd Cloud_project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 🧰 Architecture

The application follows a client-server architecture:

- **Frontend**: React with TypeScript, using Vite for fast development and TailwindCSS for styling.
- **Backend**: Node.js with Express, providing RESTful APIs to interface with QEMU.
- **Data Storage**: JSON files for configuration, with actual disk images stored in the filesystem.

## 📖 API Reference

### Disk Management APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-disk` | POST | Create a new virtual disk |
| `/api/disks` | GET | Get all available disks |
| `/api/disks/:name/:format/resize` | PUT | Resize an existing disk |
| `/api/disks/:name/:format` | DELETE | Delete a disk |

### VM Management APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-vm` | POST | Create a new virtual machine |
| `/api/vms` | GET | Get all virtual machines |
| `/api/vms/:id` | GET | Get a specific VM |
| `/api/vms/:id/start` | POST | Start a VM |
| `/api/vms/:id/stop` | POST | Stop a VM |
| `/api/vms/:id` | PUT | Update VM configuration |
| `/api/vms/:id` | DELETE | Delete a VM |

## 🔒 Security Considerations

- Input validation implemented for all API parameters
- Disk names are sanitized to prevent command injection
- Backend API should be secured behind authentication for production use

## 🚨 Known Limitations

- ISO management currently uses hardcoded paths and would need enhancement for production
- QEMU process termination could be more graceful in production environments
- Disk format conversion not currently supported

## 🔜 Future Development

- VM snapshots and restore functionality
- Network configuration UI
- Remote QEMU connection support
- User authentication and multi-user support
- Monitoring and metrics visualization
- Automated VM backups

## 📚 Additional Resources

- [QEMU Documentation](https://www.qemu.org/documentation/)
- [QEMU Disk Image Documentation](https://www.qemu.org/docs/master/system/images.html)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [QEMU Project](https://www.qemu.org/)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
