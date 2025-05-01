import { VirtualDisk, VirtualMachine, Command, VMUpdateParams, ISO, QEMUConnection } from '../types';

// Backend API URL
const API_URL = 'http://localhost:5000/api';

// Simulated storage for VMs, commands, and ISOs (which don't have backend endpoints yet)
let vms: VirtualMachine[] = [];
let commands: Command[] = [];
let isos: ISO[] = [
  // Add your Ubuntu ISO that you already have downloaded
  {
    id: 'ubuntu-24-04',
    name: 'ubuntu-24.04.2-desktop-amd64.iso',
    path: 'C:\\Users\\medob\\Downloads\\ubuntu-24.04.2-desktop-amd64.iso',
    size: 4700, // Approximate size in MB
    uploadedAt: new Date()
  }
];
let commandId = 0;

// Path to the QEMU installation
const QEMU_INSTALLATION_PATH = 'C:\\Users\\medob\\Documents\\QVM';

// Default QEMU connection configuration (portable QEMU on port 6000)
const defaultQEMUConnection: QEMUConnection = {
  host: 'localhost',
  port: 6000,
  enabled: true,
  secured: false
};

// Helper to simulate asynchronous operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to format QEMU connection string
const getQEMUConnectionString = (connection: QEMUConnection = defaultQEMUConnection): string => {
  const protocol = connection.secured ? 'https' : 'http';
  return `${protocol}://${connection.host}:${connection.port}`;
};

// Format path for commands
const formatQEMUPath = (command: string): string => {
  if (command.includes('qemu-img')) {
    return `${QEMU_INSTALLATION_PATH}\\qemu-img.exe`;
  } else if (command.includes('qemu-system')) {
    return `${QEMU_INSTALLATION_PATH}\\qemu-system-x86_64.exe`;
  }
  return command;
};

// Helper to get disk storage path
const getDiskStoragePath = (): string => {
  return `${QEMU_INSTALLATION_PATH}\\disks`;
};

// Helper to get ISO storage path
const getISOStoragePath = (): string => {
  return `${QEMU_INSTALLATION_PATH}\\isos`;
};

// Upload an ISO file
export const uploadISO = async (file: File): Promise<ISO> => {
  await delay(1000); // Simulate upload time
  
  const id = Date.now().toString();
  // Use the correct path to your ISO file
  const path = `C:\\Users\\medob\\Downloads\\${file.name}`;
  
  const newISO: ISO = {
    id,
    name: file.name,
    path,
    size: Math.round(file.size / (1024 * 1024)), // Convert bytes to MB
    uploadedAt: new Date()
  };
  
  isos = [...isos, newISO];
  return newISO;
};

// Get all available ISOs
export const getISOs = async (): Promise<ISO[]> => {
  await delay(300);
  return isos;
};

// Create a new virtual disk - Now using the backend API
export const createVirtualDisk = async (
  name: string,
  format: VirtualDisk['format'],
  size: number,
  connection: QEMUConnection = defaultQEMUConnection
): Promise<VirtualDisk> => {
  try {
    // Log the command to command history
    const connectionString = getQEMUConnectionString(connection);
    const qemuImgPath = formatQEMUPath('qemu-img');
    const command = `${connectionString}/${qemuImgPath} create -f ${format} ${getDiskStoragePath()}\\${name}.${format} ${size}G`;
    await executeCommand(command);
    
    // Call the backend API to create the disk
    const response = await fetch(`${API_URL}/create-disk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diskName: name,
        size: `${size}G`,
        format
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create disk');
    }
    
    const data = await response.json();
    
    // Convert the response to our VirtualDisk type
    const newDisk: VirtualDisk = {
      id: Date.now().toString(), // Generate a unique ID since backend doesn't provide one
      name: data.disk.name,
      format: data.disk.format,
      size: parseInt(data.disk.size), // Convert "10G" to 10
      path: data.disk.path,
      createdAt: new Date()
    };
    
    return newDisk;
  } catch (error) {
    console.error('Error creating virtual disk:', error);
    throw error;
  }
};

// Get all virtual disks - Now using the backend API
export const getVirtualDisks = async (
  connection: QEMUConnection = defaultQEMUConnection
): Promise<VirtualDisk[]> => {
  try {
    const response = await fetch(`${API_URL}/disks`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get disks');
    }
    
    const data = await response.json();
    
    // Convert the response to our VirtualDisk type array
    const disks: VirtualDisk[] = data.disks.map((disk: any) => {
      // Parse size - extract number from string like "32G"
      let size = 1; // Default fallback
      if (disk.size && typeof disk.size === 'string') {
        const sizeMatch = disk.size.match(/^(\d+)/);
        if (sizeMatch && sizeMatch[1]) {
          size = parseInt(sizeMatch[1]);
        }
      } else if (typeof disk.size === 'number') {
        size = disk.size;
      }
      
      return {
        id: disk.name, // Using name as ID for simplicity
        name: disk.name,
        format: disk.format,
        size: size, // Parsed size as integer
        path: disk.path,
        createdAt: new Date(disk.createdAt)
      };
    });
    
    return disks;
  } catch (error) {
    console.error('Error getting virtual disks:', error);
    throw error;
  }
};

// Update a virtual disk
export const updateVirtualDisk = async (
  id: string,
  params: { name?: string; size?: number },
  connection: QEMUConnection = defaultQEMUConnection
): Promise<VirtualDisk> => {
  try {
    // Get all disks to find the one with the matching ID
    const diskList = await getVirtualDisks();
    const disk = diskList.find(d => d.id === id);
    
    if (!disk) {
      throw new Error('Disk not found');
    }
    
    // Check if the disk is used by a VM
    const vms = await getVirtualMachines();
    const isUsed = vms.some(vm => vm.disk.id === id);
    
    if (isUsed && params.size && params.size !== disk.size) {
      // For now, we'll allow resizing a disk used by VMs, but warn in the future or provide specific resize functionality
      console.warn('Resizing a disk that is already attached to a VM. This might cause issues.');
    }
    
    // If size is changing, we need to resize the disk
    if (params.size && params.size !== disk.size) {
      try {
        // Call the resize endpoint
        const response = await fetch(`${API_URL}/disks/${disk.name}/${disk.format}/resize`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            size: `${params.size}G`, // Make sure to append 'G' for gigabytes
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to resize disk');
        }
        
        const data = await response.json();
        
        // Update disk with new size
        return {
          ...disk,
          size: params.size,
        };
      } catch (error) {
        console.error('Error calling resize API:', error);
        throw error;
      }
    }
    
    // For name change, we would need to create a new disk and copy content, which is not implemented
    // For simplicity, we'll just log a warning for now and not change the name
    if (params.name && params.name !== disk.name) {
      console.warn('Disk name change is not supported in this version. Name will remain unchanged.');
    }
    
    // Return updated disk object
    return {
      ...disk,
      size: params.size || disk.size,
    };
  } catch (error) {
    console.error('Error updating virtual disk:', error);
    throw error;
  }
};

// Create a new virtual machine
export const createVirtualMachine = async (
  name: string,
  cpuCores: number,
  memory: number,
  diskId: string,
  isoId?: string,
  connection: QEMUConnection = defaultQEMUConnection
): Promise<VirtualMachine> => {
  // Get all disks to find the one with the matching ID
  const diskList = await getVirtualDisks();
  const disk = diskList.find(d => d.id === diskId);
  if (!disk) throw new Error('Disk not found');

  // Get all ISOs to find the one with the matching ID
  let iso = undefined;
  if (isoId) {
    const isoList = await getISOs();
    iso = isoList.find(i => i.id === isoId);
    if (!iso) throw new Error('ISO not found');
  }

  // Call backend API
  const response = await fetch('http://localhost:5000/api/create-vm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      cpuCores,
      memory,
      disk,
      iso
    })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create VM');
  }
  const data = await response.json();
  return data.vm;
};

// Update a virtual machine - Now using the backend API
export const updateVirtualMachine = async (
  id: string,
  params: VMUpdateParams
): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/vms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        cpuCores: params.cpuCores,
        memory: params.memory,
        diskSize: params.diskSize
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update VM');
    }
    
    const data = await response.json();
    return data.vm;
  } catch (error) {
    console.error('Error updating virtual machine:', error);
    throw error;
  }
};

// Get all virtual machines - Now using the backend API
export const getVirtualMachines = async (
  connection: QEMUConnection = defaultQEMUConnection
): Promise<VirtualMachine[]> => {
  try {
    const response = await fetch(`${API_URL}/vms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get VMs');
    }
    
    const data = await response.json();
    
    // Return the VMs from the backend
    return data.vms || [];
  } catch (error) {
    console.error('Error getting virtual machines:', error);
    throw error;
  }
};

// Start a virtual machine - Now using the backend API
export const startVirtualMachine = async (id: string): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/vms/${id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start VM');
    }
    
    const data = await response.json();
    return data.vm;
  } catch (error) {
    console.error('Error starting virtual machine:', error);
    throw error;
  }
};

// Stop a virtual machine - Now using the backend API
export const stopVirtualMachine = async (id: string): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/vms/${id}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to stop VM');
    }
    
    const data = await response.json();
    return data.vm;
  } catch (error) {
    console.error('Error stopping virtual machine:', error);
    throw error;
  }
};

// Delete a virtual machine - Now using the backend API
export const deleteVirtualMachine = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/vms/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete VM');
    }
  } catch (error) {
    console.error('Error deleting virtual machine:', error);
    throw error;
  }
};

// Delete a virtual disk - Now using the backend API
export const deleteVirtualDisk = async (id: string): Promise<void> => {
  try {
    // Get all disks to find the one with the matching ID
    const diskList = await getVirtualDisks();
    const disk = diskList.find(d => d.id === id);
    
    if (!disk) {
      throw new Error('Disk not found');
    }
    
    // Check if disk is used by any VM
    const isUsed = vms.some(vm => vm.disk.id === id);
    if (isUsed) {
      throw new Error('Disk is in use by a virtual machine');
    }
    
    // Call the backend API to delete the disk
    const response = await fetch(`${API_URL}/disks/${disk.name}/${disk.format}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete disk');
    }
    
    // Log the command
    const connectionString = getQEMUConnectionString(defaultQEMUConnection);
    const command = `${connectionString}/rm ${disk.path}`;
    await executeCommand(command);
    
  } catch (error) {
    console.error('Error deleting virtual disk:', error);
    throw error;
  }
};

// Execute a QEMU command
export const executeCommand = async (command: string): Promise<Command> => {
  await delay(500);
  
  const id = (++commandId).toString();
  let output = '';
  let status: 'success' | 'error' = 'success';
  
  if (command.includes('create')) {
    output = `Formatting '${QEMU_INSTALLATION_PATH}\\disks\\disk.qcow2', fmt=qcow2 size=10737418240 cluster_size=65536 lazy_refcounts=off refcount_bits=16`;
  } else if (command.includes('qemu-system-x86_64')) {
    output = 'QEMU emulator version 5.2.0\nCopyright (c) 2003-2020 Fabrice Bellard and the QEMU Project developers';
  } else if (command.includes('system_powerdown')) {
    output = 'VM is shutting down...';
  } else if (command.includes('resize')) {
    output = `Resizing disk image to ${command.split(' ').pop()}`;
  } else if (command.includes('rm')) {
    output = '';
  } else {
    output = 'Command executed successfully';
  }
  
  if (Math.random() < 0.1) {
    output = 'Error: Command failed to execute';
    status = 'error';
  }
  
  const newCommand: Command = {
    id,
    command,
    output,
    timestamp: new Date(),
    status
  };
  
  commands = [...commands, newCommand];
  return newCommand;
};

// Get command history
export const getCommandHistory = async (): Promise<Command[]> => {
  await delay(200);
  return [...commands].reverse();
};

// Get QEMU connection status
export const getQEMUConnectionStatus = async (
  connection: QEMUConnection = defaultQEMUConnection
): Promise<{ connected: boolean, version?: string, machineDetails?: any }> => {
  await delay(300);
  
  try {
    const connectionString = getQEMUConnectionString(connection);
    
    if (Math.random() < 0.25) {
      throw new Error("Connection timeout");
    }
    
    const version = "5.2.0";
    
    const machineDetails = {
      installPath: QEMU_INSTALLATION_PATH,
      running: Math.random() < 0.5,
      cpuModel: "Intel Core i7",
      memoryUsage: {
        total: 4096,
        used: Math.floor(Math.random() * 4096)
      },
      networkType: Math.random() < 0.5 ? "NAT" : "Bridged",
      accelerator: "KVM",
      graphics: "VGA"
    };
    
    return { 
      connected: true, 
      version, 
      machineDetails 
    };
  } catch (error) {
    console.error("Failed to connect to QEMU:", error);
    return { connected: false };
  }
};

// Configure QEMU connection
export const configureQEMUConnection = async (
  connection: QEMUConnection
): Promise<QEMUConnection> => {
  Object.assign(defaultQEMUConnection, connection);
  
  try {
    const status = await getQEMUConnectionStatus(connection);
    if (!status.connected) {
      console.warn("Warning: Configured QEMU connection, but couldn't establish connection");
    }
  } catch (error) {
    console.error("Error validating QEMU connection:", error);
  }
  
  return defaultQEMUConnection;
};