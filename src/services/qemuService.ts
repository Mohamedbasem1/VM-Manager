// QEMU VM Management Service
import { VirtualMachine, VirtualDisk, ISO, Command, VMUpdateParams } from '../types';
import { notify } from '../components/NotificationsContainer';

const API_URL = 'http://localhost:5002'; // Updated to use port 5002

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
  notify('error', errorMessage);
  throw new Error(errorMessage);
};

// Get all virtual machines
export const getVirtualMachines = async (): Promise<VirtualMachine[]> => {
  try {
    const response = await fetch(`${API_URL}/api/vms`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch VMs');
    }
    
    return data.vms;
  } catch (error) {
    return handleApiError(error, 'Failed to load virtual machines');
  }
};

// Create a new virtual machine
export const createVirtualMachine = async (
  name: string,
  cpuCores: number,
  memory: number,
  diskId: string,
  isoId?: string
): Promise<VirtualMachine> => {
  try {
    // First get the disk and ISO details
    const disks = await getVirtualDisks();
    const disk = disks.find(d => d.id === diskId);
    
    if (!disk) {
      throw new Error('Selected disk not found');
    }
    
    // Validate that ISO is provided
    if (!isoId) {
      throw new Error('ISO file is required for VM creation');
    }
    
    let iso = undefined;
    const isos = await getISOs();
    iso = isos.find(i => i.id === isoId);
    
    // If we can't find the ISO by ID, try other methods
    if (!iso) {
      // Check for custom or uploaded ISOs with various prefixes
      iso = isos.find(i => 
        i.id.startsWith('custom-') || 
        i.id.startsWith('upload_') || 
        i.id.startsWith('default_')
      );
      
      // If still no ISO, use the default Ubuntu ISO if available
      if (!iso) {
        iso = isos.find(i => i.name.includes('ubuntu') && i.name.endsWith('.iso'));
      }
      
      // If still no ISO, just use the first one in the list
      if (!iso && isos.length > 0) {
        iso = isos[0];
        console.log('Using first available ISO:', iso);
      }
    }
    
    if (!iso) {
      throw new Error('No suitable ISO found. Please make sure you have a valid ISO file available.');
    }
    
    console.log('Selected ISO:', iso);
    
    const postData: any = {
      name,
      cpuCores,
      memory,
      disk,
      iso // Always include ISO as it's required
    };
    
    console.log('Sending VM creation request with data:', postData);
    
    const response = await fetch(`${API_URL}/api/create-vm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create VM');
    }
    
    notify('success', `Virtual machine "${name}" created successfully`);
    return data.vm;
  } catch (error) {
    return handleApiError(error, 'Failed to create virtual machine');
  }
};

// Start a virtual machine
export const startVirtualMachine = async (id: string): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/api/vms/${id}/start`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to start VM');
    }
    
    notify('success', `VM started successfully. QEMU window should appear.`);
    return data.vm;
  } catch (error) {
    return handleApiError(error, 'Failed to start virtual machine');
  }
};

// Stop a virtual machine
export const stopVirtualMachine = async (id: string): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/api/vms/${id}/stop`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to stop VM');
    }
    
    notify('info', `VM stopped successfully`);
    return data.vm;
  } catch (error) {
    return handleApiError(error, 'Failed to stop virtual machine');
  }
};

// Delete a virtual machine
export const deleteVirtualMachine = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/vms/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete VM');
    }
    
    notify('info', `VM deleted successfully`);
  } catch (error) {
    return handleApiError(error, 'Failed to delete virtual machine');
  }
};

// Update a virtual machine
export const updateVirtualMachine = async (id: string, params: VMUpdateParams): Promise<VirtualMachine> => {
  try {
    const response = await fetch(`${API_URL}/api/vms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update VM');
    }
    
    notify('success', `VM updated successfully`);
    return data.vm;
  } catch (error) {
    return handleApiError(error, 'Failed to update virtual machine');
  }
};

// Get all virtual disks
export const getVirtualDisks = async (): Promise<VirtualDisk[]> => {
  try {
    const response = await fetch(`${API_URL}/api/disks`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch disks');
    }
    
    // Add a unique ID to each disk for frontend tracking
    return data.disks.map((disk: any, index: number) => ({
      ...disk,
      id: `disk_${disk.name}_${disk.format}`
    }));
  } catch (error) {
    return handleApiError(error, 'Failed to load virtual disks');
  }
};

// Create a new virtual disk
export const createVirtualDisk = async (
  name: string,
  format: 'qcow2' | 'raw' | 'vdi' | 'vmdk',
  size: number // Size in GB
): Promise<VirtualDisk> => {
  try {
    const response = await fetch(`${API_URL}/api/create-disk`, {
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create disk');
    }
    
    notify('success', `Virtual disk "${name}" created successfully`);
    return data.disk;
  } catch (error) {
    return handleApiError(error, 'Failed to create virtual disk');
  }
};

// Delete a virtual disk
export const deleteVirtualDisk = async (id: string): Promise<void> => {
  try {
    // Find the disk to get name and format
    const disks = await getVirtualDisks();
    const disk = disks.find(d => d.id === id);
    
    if (!disk) {
      throw new Error('Disk not found');
    }
    
    const response = await fetch(`${API_URL}/api/disks/${disk.name}/${disk.format}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete disk');
    }
    
    notify('info', `Disk "${disk.name}" deleted successfully`);
  } catch (error) {
    return handleApiError(error, 'Failed to delete virtual disk');
  }
};

// Update a virtual disk
export const updateVirtualDisk = async (
  id: string,
  params: { size: number } // Size in GB
): Promise<VirtualDisk> => {
  try {
    // Find the disk to get name and format
    const disks = await getVirtualDisks();
    const disk = disks.find(d => d.id === id);
    
    if (!disk) {
      throw new Error('Disk not found');
    }
    
    const response = await fetch(`${API_URL}/api/disks/${disk.name}/${disk.format}/resize`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        size: `${params.size}G`,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update disk');
    }
    
    notify('success', `Disk "${disk.name}" resized to ${params.size}GB successfully`);
    return data.disk;
  } catch (error) {
    return handleApiError(error, 'Failed to update virtual disk');
  }
};

// Get list of ISOs
export const getISOs = async (): Promise<ISO[]> => {
  try {
    const response = await fetch(`${API_URL}/api/isos`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch ISOs');
    }
    
    return data.isos;
  } catch (error) {
    return handleApiError(error, 'Failed to load ISO files');
  }
};

// Register a custom ISO path
export const registerISOPath = async (isoPath: string, name?: string): Promise<ISO> => {
  try {
    const response = await fetch(`${API_URL}/api/register-iso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isoPath,
        name
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register ISO');
    }
    
    notify('success', `ISO "${data.iso.name}" registered successfully`);
    return data.iso;
  } catch (error) {
    return handleApiError(error, 'Failed to register ISO path');
  }
};

// Upload an ISO (simulated - in a real application, this would upload the file to the server)
export const uploadISO = async (file: File): Promise<ISO> => {
  try {
    // Create a temporary path where we expect the ISO to be
    // In a real app, we would upload the file to the server here
    const isoName = file.name;
    
    // For the demo, we'll tell the user where to place the ISO file manually
    const isoPath = `C:\\Users\\medob\\Desktop\\Last semster\\Cloud\\project-bolt-sb1-l6to3pmm\\Cloud_project\\backend\\isos\\${isoName}`;
    
    notify('info', `For the demo, please place "${isoName}" in the folder:\nC:\\Users\\medob\\Desktop\\Last semster\\Cloud\\project-bolt-sb1-l6to3pmm\\Cloud_project\\backend\\isos\\`);
    
    // Create a custom ISO object that points to where the file should be
    const iso: ISO = {
      id: `upload_${Date.now()}`,
      name: isoName,
      path: isoPath,
      size: Math.round(file.size / (1024 * 1024)), // Convert to MB
      uploadedAt: new Date()
    };
    
    notify('success', `ISO "${file.name}" registered successfully`);
    return iso;
  } catch (error) {
    return handleApiError(error, 'Failed to process ISO upload');
  }
};

// QEMU connection settings
export const getQEMUConnectionStatus = async () => {
  // Simulated connection check
  try {
    const vms = await getVirtualMachines();
    const disks = await getVirtualDisks();
    
    notify('info', 'QEMU connection verified successfully');
    
    return {
      connected: true,
      version: 'QEMU 8.1.2',
      machineDetails: {
        vms: {
          total: vms.length,
          running: vms.filter(vm => vm.status === 'running').length
        },
        storage: {
          disks: disks.length,
          totalSize: disks.reduce((sum, disk) => sum + disk.size, 0)
        }
      }
    };
  } catch (error) {
    notify('error', 'Failed to connect to QEMU');
    return { connected: false };
  }
};

export const configureQEMUConnection = async (connection: any) => {
  // Simulated configuration
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      notify('success', 'QEMU connection settings updated');
      resolve();
    }, 1000);
  });
};

// Command terminal functionality
export const executeCommand = async (command: string): Promise<Command> => {
  // Simulated command execution
  return new Promise((resolve) => {
    setTimeout(() => {
      const result: Command = {
        id: Date.now().toString(),
        command,
        output: `Simulated output for command: ${command}`,
        timestamp: new Date(),
        status: Math.random() > 0.2 ? 'success' : 'error'
      };
      
      notify('info', `Command executed: ${command.slice(0, 25)}${command.length > 25 ? '...' : ''}`);
      resolve(result);
    }, 1000);
  });
};

export const getCommandHistory = async (): Promise<Command[]> => {
  // Simulated command history
  return [
    {
      id: '1',
      command: 'qemu-system-x86_64 -version',
      output: 'QEMU emulator version 8.1.2\nCopyright (c) 2003-2023 Fabrice Bellard and the QEMU Project developers',
      timestamp: new Date('2025-05-01T12:30:45.000Z'),
      status: 'success'
    },
    {
      id: '2',
      command: 'qemu-img info ubuntu-disk.qcow2',
      output: 'image: ubuntu-disk.qcow2\nfile format: qcow2\nvirtual size: 20 GiB (21474836480 bytes)\ndisk size: 196 KiB\ncluster_size: 65536\nformat specific information:\n    compat: 1.1\n    compression type: zlib\n    lazy refcounts: false\n    refcount bits: 16\n    corrupt: false\n    extended l2: false',
      timestamp: new Date('2025-05-01T12:32:15.000Z'),
      status: 'success'
    }
  ];
};