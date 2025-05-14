// QEMU VM Management Service
import { supabase } from './supabase';
import { VirtualMachine, VirtualDisk, ISO, Command, QEMUConnection } from '../types';
import { notify } from '../components/NotificationsContainer';

const API_URL = 'http://localhost:5002'; // Updated to use port 5002

// Helper function to handle API errors
// This is kept for future use, so we silence the "unused" warning
// @ts-expect-error - Function is kept for future use
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
  notify('error', errorMessage);
  throw new Error(errorMessage);
};

// QEMU service for managing virtual machines and disks with Supabase integration
export const qemuService = {
  /**
   * Get all virtual machines
   * Fetches data directly from Supabase
   */
  async getVirtualMachines(): Promise<VirtualMachine[]> {
    try {
      // Get current user first to determine which VMs to retrieve
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get VMs directly from Supabase
      const { data: vmMetadata, error } = await supabase
        .from('virtual_machines_metadata')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching VMs from Supabase:', error);
        throw new Error('Failed to fetch virtual machines from Supabase');
      }
      
      if (!vmMetadata || vmMetadata.length === 0) {
        return []; // Return empty array if no VMs found
      }
      
      // Get all disk metadata first to avoid async issues inside map
      const { data: diskMetadata } = await supabase
        .from('virtual_disks_metadata')
        .select('*')
        .eq('user_id', user.id);
      
      // Map Supabase data to VirtualMachine objects
      const vms = vmMetadata.map(vm => {
        // Extract disk info from path
        let disk;
        if (vm.disk_path) {
          const diskPathParts = vm.disk_path.split('\\');
          const diskFileName = diskPathParts[diskPathParts.length - 1];
          const diskNameParts = diskFileName.split('.');
          const diskName = diskNameParts[0];
          const diskFormat = diskNameParts[1];
          
          // Find the disk size from the pre-fetched disk metadata
          let diskSize = 10; // Default to 10GB
          if (diskMetadata) {
            const matchingDisk = diskMetadata.find(
              d => d.name === diskName && d.format === diskFormat
            );
            if (matchingDisk && matchingDisk.size) {
              diskSize = matchingDisk.size;
            }
          }
          
          disk = {
            id: `disk_${diskName}_${diskFormat}`,
            name: diskName,
            format: diskFormat,
            path: vm.disk_path,
            size: diskSize,
            createdAt: new Date(vm.created_at)
          };
        }
        
        // Extract ISO info from path if available
        let iso;
        if (vm.iso_path) {
          const isoPathParts = vm.iso_path.split('\\');
          const isoFileName = isoPathParts[isoPathParts.length - 1];
          
          iso = {
            id: `iso_${isoFileName.replace(/\s+/g, '_').toLowerCase()}`,
            name: isoFileName,
            path: vm.iso_path,
            size: 0, // Size info not available directly
            uploadedAt: new Date()
          };
        }
        
        return {
          id: vm.local_vm_id || `vm_${vm.id}`,
          name: vm.name,
          cpuCores: vm.cpu_cores,
          memory: vm.memory,
          status: vm.status || 'stopped',
          disk: disk,
          iso: iso,
          createdAt: new Date(vm.created_at),
          lastStarted: vm.updated_at ? new Date(vm.updated_at) : undefined,
          user_id: vm.user_id
        };
      });
      
      return vms;
    } catch (error) {
      console.error('Error fetching virtual machines:', error);
      throw error;
    }
  },

  /**
   * Get a specific virtual machine by ID
   */
  async getVirtualMachine(id: string): Promise<VirtualMachine> {
    try {
      const response = await fetch(`${API_URL}/api/vms/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch virtual machine');
      }

      const data = await response.json();
      return data.vm;
    } catch (error) {
      console.error(`Error fetching virtual machine ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new virtual machine
   */
  async createVirtualMachine(
    name: string,
    cpuCores: number,
    memory: number,
    disk: VirtualDisk,
    iso?: ISO
  ): Promise<VirtualMachine> {
    try {
      // Create VM locally first
      const response = await fetch(`${API_URL}/api/create-vm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          cpuCores,
          memory,
          disk,
          iso
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create virtual machine');
      }

      const data = await response.json();
      
      // Get current user for Supabase integration
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Store metadata in Supabase
        const { error } = await supabase
          .from('virtual_machines_metadata')
          .insert({
            name: data.vm.name,
            cpu_cores: data.vm.cpuCores,
            memory: data.vm.memory,
            status: data.vm.status,
            disk_path: disk.path,
            iso_path: iso?.path,
            local_vm_id: data.vm.id,
            user_id: user.id,
            created_at: data.vm.createdAt,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error storing VM metadata in Supabase:', error);
        }
      }

      return data.vm;
    } catch (error) {
      console.error('Error creating virtual machine:', error);
      throw error;
    }
  },

  /**
   * Start a virtual machine
   */
  async startVirtualMachine(id: string): Promise<VirtualMachine> {
    try {
      // First get the current VM details
      const { data: currentVM, error: fetchError } = await supabase
        .from('virtual_machines_metadata')
        .select('*')
        .eq('local_vm_id', id)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch VM details before starting');
      }

      if (!currentVM) {
        throw new Error('VM not found');
      }

      const response = await fetch(`${API_URL}/api/vms/${id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          name: currentVM.name,
          cpuCores: currentVM.cpu_cores,
          memory: currentVM.memory,
          disk: {
            path: currentVM.disk_path,
          },
          iso: {
            path: currentVM.iso_path,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start virtual machine');
      }

      const data = await response.json();
      
      // Update status in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('virtual_machines_metadata')
            .update({
              status: 'running',
              updated_at: new Date().toISOString()
            })
            .eq('id', currentVM.id);
        }
      } catch (err) {
        console.warn('Failed to update VM status in Supabase:', err);
      }

      return data.vm;
    } catch (error) {
      console.error(`Error starting virtual machine ${id}:`, error);
      throw error;
    }
  },

  /**
   * Stop a virtual machine
   */
  async stopVirtualMachine(id: string): Promise<VirtualMachine> {
    try {
      const response = await fetch(`${API_URL}/api/vms/${id}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to stop virtual machine');
      }

      const data = await response.json();
      
      // Update status in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: vmMetadata } = await supabase
            .from('virtual_machines_metadata')
            .select('id')
            .eq('local_vm_id', id)
            .eq('user_id', user.id)
            .single();
            
          if (vmMetadata) {
            await supabase
              .from('virtual_machines_metadata')
              .update({
                status: 'stopped',
                updated_at: new Date().toISOString()
              })
              .eq('id', vmMetadata.id);
          }
        }
      } catch (err) {
        console.warn('Failed to update VM status in Supabase:', err);
      }

      return data.vm;
    } catch (error) {
      console.error(`Error stopping virtual machine ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a virtual machine
   */
  async updateVirtualMachine(
    id: string,
    updates: { name?: string; cpuCores?: number; memory?: number }
  ): Promise<VirtualMachine> {
    try {
      const response = await fetch(`${API_URL}/api/vms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update virtual machine');
      }

      const data = await response.json();
      
      // Update in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: vmMetadata } = await supabase
            .from('virtual_machines_metadata')
            .select('id')
            .eq('local_vm_id', id)
            .eq('user_id', user.id)
            .single();
            
          if (vmMetadata) {
            await supabase
              .from('virtual_machines_metadata')
              .update({
                ...(updates.name && { name: updates.name }),
                ...(updates.cpuCores && { cpu_cores: updates.cpuCores }),
                ...(updates.memory && { memory: updates.memory }),
                updated_at: new Date().toISOString()
              })
              .eq('id', vmMetadata.id);
          }
        }
      } catch (err) {
        console.warn('Failed to update VM in Supabase:', err);
      }

      return data.vm;
    } catch (error) {
      console.error(`Error updating virtual machine ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a virtual machine
   */
  async deleteVirtualMachine(id: string): Promise<void> {
    try {
      // Delete from Supabase first in case local deletion fails
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: vmMetadata } = await supabase
            .from('virtual_machines_metadata')
            .select('id')
            .eq('local_vm_id', id)
            .eq('user_id', user.id)
            .single();
            
          if (vmMetadata) {
            await supabase
              .from('virtual_machines_metadata')
              .delete()
              .eq('id', vmMetadata.id);
          }
        }
      } catch (err) {
        console.warn('Failed to delete VM from Supabase:', err);
      }

      // Delete locally
      const response = await fetch(`${API_URL}/api/vms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete virtual machine');
      }
    } catch (error) {
      console.error(`Error deleting virtual machine ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new virtual disk
   */  async getAvailableDiskSpace(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/api/disk-space`);
      if (!response.ok) {
        throw new Error('Failed to fetch available disk space');
      }
      
      const data = await response.json();
      return parseFloat(data.availableSpace);
    } catch (error) {
      console.error('Error getting available disk space:', error);
      throw error;
    }
  },
  
  async createVirtualDisk(
    name: string,
    format: string,
    size: number
  ): Promise<VirtualDisk> {
    try {
      // Get current user first to include user_id in the request
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create disk locally first
      const response = await fetch(`${API_URL}/api/create-disk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diskName: name,
          format,
          size,
          user_id: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create virtual disk');
      }

      const data = await response.json();
      const diskData = data.disk;
      
      // Store metadata in Supabase
      const { error } = await supabase
        .from('virtual_disks_metadata')
        .insert({
          name: diskData.name,
          format: diskData.format,
          size: parseInt(diskData.size),
          path: diskData.path,
          user_id: user.id,
          created_at: diskData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error storing disk metadata in Supabase:', error);
      }

      // Convert the disk data to the expected VirtualDisk format
      // Properly parse the size, which might come as "10G" or similar
      let finalSize: number;
      if (typeof diskData.size === 'string') {
        const sizeStr = diskData.size;
        finalSize = parseInt(sizeStr);
      } else {
        finalSize = diskData.size;
      }
      
      return {
        id: `disk_${diskData.name}_${diskData.format}`,
        name: diskData.name,
        format: diskData.format,
        size: finalSize,
        path: diskData.path,
        createdAt: diskData.createdAt || new Date()
      };
    } catch (error) {
      console.error('Error creating virtual disk:', error);
      throw error;
    }
  },

  /**
   * Get all virtual disks
   */
  async getVirtualDisks(): Promise<VirtualDisk[]> {
    try {
      // Get current user first to determine which disks to retrieve
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Add user_id as a query parameter to filter disks by user
      const response = await fetch(`${API_URL}/api/disks?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch virtual disks');
      }

      const data = await response.json();
      
      // Check if we have any disks from the API response
      if (!data.disks || data.disks.length === 0) {
        // If no disks from API, try to get them directly from Supabase
        const { data: userDisks, error } = await supabase
          .from('virtual_disks_metadata')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching disks from Supabase:', error);
          throw new Error('Failed to fetch virtual disks from Supabase');
        }
        
        // Map Supabase data to expected format
        return (userDisks || []).map(disk => ({
          id: `disk_${disk.name}_${disk.format}`,
          name: disk.name,
          format: disk.format,
          size: disk.size,
          path: disk.path,
          createdAt: disk.created_at,
          user_id: disk.user_id
        }));
      }
      
      // Map the API response to VirtualDisk objects
      return data.disks.map((disk: any) => ({
        id: `disk_${disk.name}_${disk.format}`,
        name: disk.name,
        format: disk.format,
        size: typeof disk.size === 'string' && disk.size.endsWith('G')
          ? parseInt(disk.size)
          : disk.size,
        path: disk.path,
        createdAt: disk.createdAt,
        user_id: user.id // Add user_id to the disk object
      }));
    } catch (error) {
      console.error('Error fetching virtual disks:', error);
      throw error;
    }
  },

  /**
   * Update a virtual disk
   */
  async updateVirtualDisk(
    id: string,
    updates: { size: number },
    callback?: () => Promise<void>
  ): Promise<VirtualDisk> {
    try {
      // Parse ID to get name and format
      const [_, name, format] = id.split('_');
      
      const response = await fetch(`${API_URL}/api/disks/${name}/${format}/resize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: updates.size
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update virtual disk');
      }

      const data = await response.json();
      
      // Update in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: diskMetadata } = await supabase
            .from('virtual_disks_metadata')
            .select('id')
            .eq('name', name)
            .eq('format', format)
            .eq('user_id', user.id)
            .single();
            
          if (diskMetadata) {
            await supabase
              .from('virtual_disks_metadata')
              .update({
                size: updates.size,
                updated_at: new Date().toISOString()
              })
              .eq('id', diskMetadata.id);
          }
        }
      } catch (err) {
        console.warn('Failed to update disk in Supabase:', err);
      }

      // Run the callback if provided
      if (callback) {
        await callback();
      }

      return {
        id,
        name,
        format,
        size: updates.size,
        path: data.disk.path,
        createdAt: data.disk.createdAt
      };
    } catch (error) {
      console.error(`Error updating virtual disk ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a virtual disk
   */
  async deleteVirtualDisk(id: string): Promise<void> {
    try {
      // Parse ID to get name and format
      const [_, name, format] = id.split('_');
      
      // Delete from Supabase first in case local deletion fails
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: diskMetadata } = await supabase
            .from('virtual_disks_metadata')
            .select('id')
            .eq('name', name)
            .eq('format', format)
            .eq('user_id', user.id)
            .single();
            
          if (diskMetadata) {
            await supabase
              .from('virtual_disks_metadata')
              .delete()
              .eq('id', diskMetadata.id);
          }
        }
      } catch (err) {
        console.warn('Failed to delete disk from Supabase:', err);
      }

      // Delete locally
      const response = await fetch(`${API_URL}/api/disks/${name}/${format}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete virtual disk');
      }
    } catch (error) {
      console.error(`Error deleting virtual disk ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get list of ISOs
   */
  async getISOs(): Promise<ISO[]> {
    try {
      const response = await fetch(`${API_URL}/api/isos`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ISOs');
      }

      const data = await response.json();
      return data.isos;
    } catch (error) {
      console.error('Error fetching ISOs:', error);
      throw error;
    }
  },

  /**
   * Register a custom ISO
   */
  async registerISO(isoPath: string, name?: string): Promise<ISO> {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register ISO');
      }

      const data = await response.json();
      return data.iso;
    } catch (error) {
      console.error('Error registering ISO:', error);
      throw error;
    }
  },


  // Add this function to the qemuService object:
/**
 * Register a custom ISO path
 */
async registerISOPath(isoPath: string, name: string): Promise<ISO> {
  try {
    const response = await fetch(`${API_URL}/api/register-iso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: isoPath,
        name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register ISO path');
    }

    const data = await response.json();
    return data.iso;
  } catch (error) {
    console.error('Error registering ISO path:', error);
    throw error;
  }
},

  /**
   * Upload an ISO file
   */
  async uploadISO(file: File, onProgress?: (progress: number) => void): Promise<ISO> {
    try {
      const formData = new FormData();
      formData.append('iso', file);

      // Create a custom request with progress event
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.iso);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        // Open and send the request
        xhr.open('POST', `${API_URL}/api/upload-iso`, true);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading ISO:', error);
      throw error;
    }
  },

  /**
   * Execute a QEMU command
   */
  async executeCommand(command: string): Promise<Command> {
    // This is a placeholder - backend doesn't have a proper command execution endpoint yet
    const timestamp = new Date();
    const id = `cmd_${timestamp.getTime()}`;
    
    // For demo purposes, we'll simulate command execution
    // In a real implementation, we would send this to the backend
    return {
      id,
      command,
      output: `Executed command: ${command}`,
      status: 'success',
      timestamp
    };
  },

  /**
   * Get command history
   */
  async getCommandHistory(): Promise<Command[]> {
    // This is a placeholder - backend doesn't have a proper command history endpoint yet
    // In a real implementation, we would fetch this from the backend
    return [
      {
        id: 'cmd_1',
        command: 'qemu-img info disk.qcow2',
        output: 'image: disk.qcow2\nfile format: qcow2\nvirtual size: 10G',
        status: 'success',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 'cmd_2',
        command: 'qemu-system-x86_64 -version',
        output: 'QEMU emulator version 6.2.0\nCopyright (c) 2003-2021 Fabrice Bellard and the QEMU Project developers',
        status: 'success',
        timestamp: new Date(Date.now() - 7200000)
      }
    ];
  }
};

// Re-export the functions as named exports
export const getVirtualMachines = qemuService.getVirtualMachines;
export const getVirtualMachine = qemuService.getVirtualMachine;
export const createVirtualMachine = qemuService.createVirtualMachine;
export const startVirtualMachine = qemuService.startVirtualMachine;
export const stopVirtualMachine = qemuService.stopVirtualMachine;
export const updateVirtualMachine = qemuService.updateVirtualMachine;
export const deleteVirtualMachine = qemuService.deleteVirtualMachine;
export const createVirtualDisk = qemuService.createVirtualDisk;
export const getVirtualDisks = qemuService.getVirtualDisks;
export const getAvailableDiskSpace = qemuService.getAvailableDiskSpace;
export const updateVirtualDisk = qemuService.updateVirtualDisk;
export const deleteVirtualDisk = qemuService.deleteVirtualDisk;
export const getISOs = qemuService.getISOs;
export const registerISO = qemuService.registerISO;
export const executeCommand = qemuService.executeCommand;
export const getCommandHistory = qemuService.getCommandHistory;
// Add this to the re-export section at the bottom of the file
export const registerISOPath = qemuService.registerISOPath;
export const uploadISO = qemuService.uploadISO;

// QEMU Connection configuration
export const configureQEMUConnection = async (connection: QEMUConnection): Promise<{ success: boolean }> => {
  try {
    // In a real app, this would save to backend or local storage
    localStorage.setItem('qemu_connection', JSON.stringify(connection));
    return { success: true };
  } catch (err) {
    console.error('Failed to configure QEMU connection:', err);
    throw new Error('Failed to configure QEMU connection');
  }
};

// Get QEMU connection status
export const getQEMUConnectionStatus = async (): Promise<{ connected: boolean, version?: string, machineDetails?: any }> => {
  try {
    // In a real app, this would check the connection to the QEMU server
    // For now, we'll simulate a successful connection
    return {
      connected: true,
      version: 'QEMU emulator version 6.2.0',
      machineDetails: {
        cpuModel: 'Intel Core i7',
        totalMemory: '16 GB',
        availableCpuCores: 8
      }
    };
  } catch (err) {
    console.error('Failed to get QEMU connection status:', err);
    return { connected: false };
  }
};