# VM & Docker Manager

![QEMU VM Manager](https://img.shields.io/badge/QEMU-VM%20Manager-purple)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.2-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-cyan)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)
![Supabase](https://img.shields.io/badge/Supabase-Integrated-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern, feature-rich web application for managing QEMU virtual machines, disk images, and Docker resources with a beautiful React/TypeScript frontend and Node.js/Express backend. Metadata is managed via Supabase for multi-user support.

![Screenshot of QEMU VM Manager Dashboard](https://example.com/screenshot.png)

## 🚀 Features

- **Virtual Disk Management**
  - Create, resize, and delete virtual disks (raw, qcow2, vdi, vmdk)
  - Disk format information and storage considerations
  - Disk metadata stored in Supabase for user isolation

- **Virtual Machine Management**
  - Create VMs with configurable CPU/memory
  - Start, stop, and monitor VM status
  - Attach disks and ISO images
  - Edit and delete VMs
  - VM metadata stored in Supabase

- **ISO Management**
  - List, register, and use ISO images for VM installation

- **Docker Management**
  - Create, list, and delete Dockerfiles
  - Build, list, and delete Docker images
  - List, run, and stop Docker containers
  - Search and pull images from Docker Hub

- **User-Friendly Interface**
  - Clean, responsive design with TailwindCSS
  - Dark mode support
  - Dashboard with system status, resource lists, and quick actions
  - Command terminal for advanced QEMU operations

- **Security**
  - Input validation and disk name sanitization
  - Error handling for all operations
  - Authentication via Supabase (multi-user ready)

## 📋 Requirements

- **Frontend**
  - Node.js 16.x or higher
  - npm or yarn

- **Backend**
  - Node.js 14.x or higher
  - QEMU installed and available in system PATH (update `QEMU_PATH` in `server.js` as needed)
  - Docker installed and available in system PATH (for Docker features)
  - Supabase project and credentials (for metadata)
  - Windows, Linux, or macOS (with minor config changes)

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
4. Ensure Docker is installed and running for Docker features.
5. Add your Supabase credentials (see `.env.example` or Supabase docs).
6. Start the backend server:
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
3. Add your Supabase credentials to the frontend (see `.env.example` or Supabase docs).
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`

## 🧰 Architecture

The application follows a client-server architecture:

- **Frontend**: React with TypeScript, Vite, and TailwindCSS. Handles authentication, dashboards, resource creation, and command terminal.
- **Backend**: Node.js with Express. Provides RESTful APIs for QEMU, disk, VM, ISO, and Docker management. Handles filesystem operations and process management.
- **Supabase**: Stores metadata for VMs/disks per user, enabling multi-user support and cloud sync.
- **Data Storage**: Disk images, ISOs, and Dockerfiles are stored in the backend filesystem.

## 📖 API Reference

### Disk Management APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-disk` | POST | Create a new virtual disk |
| `/api/disks` | GET | Get all available disks |
| `/api/disks/:name/:format/resize` | PUT | Resize an existing disk |
| `/api/disks/:name/:format` | DELETE | Delete a disk |
| `/api/disk-space` | GET | Get available disk space |

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

### ISO Management APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/isos` | GET | List all ISO images |
| `/api/register-iso` | POST | Register a custom ISO path |

### Docker Management APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dockerfile` | POST | Create a Dockerfile |
| `/api/dockerfiles` | GET | List all Dockerfiles |
| `/api/dockerfile` | DELETE | Delete a Dockerfile |
| `/api/docker/build` | POST | Build a Docker image from a Dockerfile |
| `/api/docker/images` | GET | List Docker images |
| `/api/docker/images/:id` | DELETE | Delete a Docker image |
| `/api/docker/containers` | GET | List Docker containers |
| `/api/docker/containers/run` | POST | Run a Docker container |
| `/api/docker/containers/:id/stop` | POST | Stop a Docker container |
| `/api/docker/search` | GET | Search Docker Hub images |
| `/api/docker/pull` | POST | Pull a Docker image from Docker Hub |

### Command Terminal
- The frontend provides a command terminal for advanced QEMU operations, interacting with backend APIs for command execution and history.

## 🔒 Security Considerations
- Input validation for all API parameters
- Disk names sanitized to prevent command injection
- Backend API should be secured behind authentication for production use
- Error handling for all operations

## 🚨 Known Limitations
- ISO management uses hardcoded paths; production enhancement recommended
- QEMU process termination is basic; production should track PIDs
- Disk format conversion not currently supported
- Docker and Supabase features require proper configuration

## 🔜 Future Development
- VM snapshots and restore
- Network configuration UI
- Remote QEMU connection support
- User authentication improvements and multi-user support
- Monitoring and metrics visualization
- Automated VM and disk backups
- Enhanced Docker integration (logs, exec, etc.)

## 📚 Additional Resources
- [QEMU Documentation](https://www.qemu.org/documentation/)
- [QEMU Disk Image Documentation](https://www.qemu.org/docs/master/system/images.html)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)
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
- [Docker](https://www.docker.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
