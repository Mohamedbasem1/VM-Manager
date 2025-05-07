import { supabase } from './supabase';
import { qemuService } from './qemuService';
import { dockerService } from './dockerService';
import { DiskMetadata, VMMetadata, DockerMetadata } from '../types';

/**
 * Service to handle synchronization between local resources and Supabase database
 */
export const syncService = {
  /**
   * Sync all resources with Supabase
   * This should be called when user logs in
   */
  async syncAll(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found. Cannot synchronize data.');
      return;
    }

    try {
      await Promise.all([
        this.syncVirtualMachines(),
        this.syncVirtualDisks(),
        this.syncDocker()
      ]);
      console.log('All resources synchronized with Supabase');
    } catch (error) {
      console.error('Error synchronizing resources:', error);
      throw error;
    }
  },

  /**
   * Sync virtual machines with Supabase
   */
  async syncVirtualMachines(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get local VMs
      const localVMs = await qemuService.getVirtualMachines();
      
      // Get VM metadata from Supabase
      const { data: vmMetadata, error } = await supabase
        .from('virtual_machines_metadata')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // For each local VM, check if it exists in Supabase
      for (const vm of localVMs) {
        const existingMetadata = vmMetadata?.find(m => m.local_vm_id === vm.id);

        if (!existingMetadata) {
          // VM doesn't exist in Supabase - create it
          await supabase.from('virtual_machines_metadata').insert({
            name: vm.name,
            cpu_cores: vm.cpuCores,
            memory: vm.memory,
            status: vm.status,
            disk_path: vm.disk?.path,
            iso_path: vm.iso?.path,
            local_vm_id: vm.id,
            user_id: user.id,
            created_at: vm.createdAt,
            updated_at: new Date().toISOString()
          });
        } else {
          // VM exists - update it if needed
          if (
            existingMetadata.name !== vm.name ||
            existingMetadata.cpu_cores !== vm.cpuCores ||
            existingMetadata.memory !== vm.memory ||
            existingMetadata.status !== vm.status ||
            existingMetadata.disk_path !== vm.disk?.path ||
            existingMetadata.iso_path !== vm.iso?.path
          ) {
            await supabase
              .from('virtual_machines_metadata')
              .update({
                name: vm.name,
                cpu_cores: vm.cpuCores,
                memory: vm.memory,
                status: vm.status,
                disk_path: vm.disk?.path,
                iso_path: vm.iso?.path,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMetadata.id);
          }
        }
      }

      // Handle VM deletions - if a VM exists in Supabase but not locally, mark it as deleted
      if (vmMetadata) {
        for (const metadata of vmMetadata) {
          const localVM = localVMs.find(vm => vm.id === metadata.local_vm_id);
          if (!localVM) {
            // VM in Supabase doesn't exist locally anymore - mark as deleted
            await supabase
              .from('virtual_machines_metadata')
              .delete()
              .eq('id', metadata.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing virtual machines with Supabase:', error);
      throw error;
    }
  },

  /**
   * Sync virtual disks with Supabase
   */
  async syncVirtualDisks(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get local disks
      const localDisks = await qemuService.getVirtualDisks();
      
      // Get disk metadata from Supabase
      const { data: diskMetadata, error } = await supabase
        .from('virtual_disks_metadata')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // For each local disk, check if it exists in Supabase
      for (const disk of localDisks) {
        // Extract name and format from id (format: disk_name_format)
        const [_, name, format] = disk.id.split('_');
        
        const existingMetadata = diskMetadata?.find(
          m => m.name === name && m.format === format
        );

        if (!existingMetadata) {
          // Disk doesn't exist in Supabase - create it
          await supabase.from('virtual_disks_metadata').insert({
            name,
            format,
            size: disk.size,
            path: disk.path,
            user_id: user.id,
            created_at: disk.createdAt,
            updated_at: new Date().toISOString()
          });
        } else {
          // Disk exists - update it if needed
          if (
            existingMetadata.size !== disk.size ||
            existingMetadata.path !== disk.path
          ) {
            await supabase
              .from('virtual_disks_metadata')
              .update({
                size: disk.size,
                path: disk.path,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMetadata.id);
          }
        }
      }

      // Handle disk deletions - if a disk exists in Supabase but not locally
      if (diskMetadata) {
        for (const metadata of diskMetadata) {
          const localDisk = localDisks.find(
            d => {
              const [_, name, format] = d.id.split('_');
              return name === metadata.name && format === metadata.format;
            }
          );
          
          if (!localDisk) {
            // Disk in Supabase doesn't exist locally anymore - delete it
            await supabase
              .from('virtual_disks_metadata')
              .delete()
              .eq('id', metadata.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing virtual disks with Supabase:', error);
      throw error;
    }
  },

  /**
   * Sync Docker resources with Supabase
   */
  async syncDocker(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await Promise.all([
        this.syncDockerfiles(user.id),
        this.syncDockerImages(user.id),
        this.syncDockerContainers(user.id)
      ]);
    } catch (error) {
      console.error('Error syncing Docker resources with Supabase:', error);
      throw error;
    }
  },

  /**
   * Sync Dockerfiles with Supabase
   */
  async syncDockerfiles(userId: string): Promise<void> {
    try {
      // Get local Dockerfiles
      const localDockerfiles = await dockerService.getDockerfiles();
      
      // Get Dockerfile metadata from Supabase
      const { data: dockerfileMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'dockerfile');

      if (error) {
        throw error;
      }

      // For each local Dockerfile, check if it exists in Supabase
      for (const dockerfile of localDockerfiles) {
        const existingMetadata = dockerfileMetadata?.find(
          m => m.name === dockerfile.name && m.path === dockerfile.path
        );

        if (!existingMetadata) {
          // Dockerfile doesn't exist in Supabase - create it
          await supabase.from('docker_metadata').insert({
            type: 'dockerfile',
            name: dockerfile.name,
            path: dockerfile.path,
            content: dockerfile.content,
            user_id: userId,
            created_at: dockerfile.createdAt,
            updated_at: new Date().toISOString()
          });
        } else {
          // Dockerfile exists - update it if needed
          if (
            existingMetadata.content !== dockerfile.content ||
            existingMetadata.path !== dockerfile.path
          ) {
            await supabase
              .from('docker_metadata')
              .update({
                content: dockerfile.content,
                path: dockerfile.path,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMetadata.id);
          }
        }
      }

      // Handle Dockerfile deletions
      if (dockerfileMetadata) {
        for (const metadata of dockerfileMetadata) {
          const localDockerfile = localDockerfiles.find(
            d => d.name === metadata.name && d.path === metadata.path
          );
          
          if (!localDockerfile) {
            // Dockerfile in Supabase doesn't exist locally anymore - delete it
            await supabase
              .from('docker_metadata')
              .delete()
              .eq('id', metadata.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Dockerfiles with Supabase:', error);
      throw error;
    }
  },

  /**
   * Sync Docker images with Supabase
   */
  async syncDockerImages(userId: string): Promise<void> {
    try {
      // Get local Docker images
      const localImages = await dockerService.getDockerImages();
      
      // Get Docker image metadata from Supabase
      const { data: imageMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'image');

      if (error) {
        throw error;
      }

      // For each local image, check if it exists in Supabase
      for (const image of localImages) {
        const imageName = `${image.repository}:${image.tag}`;
        const existingMetadata = imageMetadata?.find(
          m => m.local_id === image.id
        );

        if (!existingMetadata) {
          // Image doesn't exist in Supabase - create it
          await supabase.from('docker_metadata').insert({
            type: 'image',
            name: imageName,
            local_id: image.id,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      // Handle image deletions
      if (imageMetadata) {
        for (const metadata of imageMetadata) {
          const localImage = localImages.find(
            i => i.id === metadata.local_id
          );
          
          if (!localImage) {
            // Image in Supabase doesn't exist locally anymore - delete it
            await supabase
              .from('docker_metadata')
              .delete()
              .eq('id', metadata.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Docker images with Supabase:', error);
      throw error;
    }
  },

  /**
   * Sync Docker containers with Supabase
   */
  async syncDockerContainers(userId: string): Promise<void> {
    try {
      // Get local Docker containers
      const localContainers = await dockerService.getDockerContainers();
      
      // Get Docker container metadata from Supabase
      const { data: containerMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'container');

      if (error) {
        throw error;
      }

      // For each local container, check if it exists in Supabase
      for (const container of localContainers) {
        const existingMetadata = containerMetadata?.find(
          m => m.local_id === container.id
        );

        if (!existingMetadata) {
          // Container doesn't exist in Supabase - create it
          await supabase.from('docker_metadata').insert({
            type: 'container',
            name: container.name,
            local_id: container.id,
            status: container.status,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          // Container exists - update status if needed
          if (existingMetadata.status !== container.status) {
            await supabase
              .from('docker_metadata')
              .update({
                status: container.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMetadata.id);
          }
        }
      }

      // Handle container deletions
      if (containerMetadata) {
        for (const metadata of containerMetadata) {
          const localContainer = localContainers.find(
            c => c.id === metadata.local_id
          );
          
          if (!localContainer) {
            // Container in Supabase doesn't exist locally anymore - delete it
            await supabase
              .from('docker_metadata')
              .delete()
              .eq('id', metadata.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Docker containers with Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Get user's virtual machines from both local and remote sources
   * This combines local VMs with metadata stored in Supabase
   */
  async getUserVMs(): Promise<VMMetadata[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('virtual_machines_metadata')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user VMs from Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Get user's virtual disks from both local and remote sources
   */
  async getUserDisks(): Promise<DiskMetadata[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('virtual_disks_metadata')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user disks from Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Get user's Docker resources from both local and remote sources
   */
  async getUserDockerResources(): Promise<DockerMetadata[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user Docker resources from Supabase:', error);
      throw error;
    }
  }
};