import { supabase } from './supabase';
import { Dockerfile, DockerImage, DockerContainer, DockerMetadata } from '../types';

const API_URL = 'http://localhost:5002'; // Make sure this matches your backend port

/**
 * Docker service for managing Docker resources with Supabase integration
 */
export const dockerService = {
  /**
   * Create a new Dockerfile
   */
  async createDockerfile(name: string, content: string, directory?: string): Promise<Dockerfile> {
    try {
      // Create Dockerfile locally first
      const response = await fetch(`${API_URL}/api/dockerfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          content,
          directory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create Dockerfile');
      }

      const data = await response.json();
      
      // Get current user for Supabase integration
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Store metadata in Supabase
        const { error } = await supabase
          .from('docker_metadata')
          .insert({
            type: 'dockerfile',
            name: data.dockerfile.name,
            path: data.dockerfile.path,
            content: data.dockerfile.content,
            user_id: user.id,
            created_at: data.dockerfile.createdAt,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error storing Dockerfile metadata in Supabase:', error);
        }
      }

      return data.dockerfile;
    } catch (error) {
      console.error('Error creating Dockerfile:', error);
      throw error;
    }
  },

  /**
   * Get all Dockerfiles for the current user
   */
  async getDockerfiles(): Promise<Dockerfile[]> {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Attempt to get dockerfile data from API
      const response = await fetch(`${API_URL}/api/dockerfiles`);
      if (!response.ok) {
        throw new Error('Failed to fetch Dockerfiles');
      }

      const data = await response.json();
      let dockerfiles = data.dockerfiles || [];
      
      // Get Dockerfile metadata from Supabase to filter by user
      const { data: dockerMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('type', 'dockerfile')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching Dockerfile metadata from Supabase:', error);
      }
      
      // If we have Supabase metadata, filter the local dockerfiles by path
      if (dockerMetadata && dockerMetadata.length > 0) {
        const userFilePaths = dockerMetadata.map(meta => meta.path);
        dockerfiles = dockerfiles.filter((file: Dockerfile) => userFilePaths.includes(file.path));
      } else {
        // If no Supabase metadata, return empty array to be safe
        dockerfiles = [];
      }
      
      return dockerfiles;
    } catch (error) {
      console.error('Error fetching Dockerfiles:', error);
      throw error;
    }
  },

  /**
   * Build a Docker image from a Dockerfile
   */
  async buildDockerImage(dockerfile: string, tag: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/docker/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dockerfile,
          tag
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to build Docker image');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error building Docker image:', error);
      throw error;
    }
  },

  /**
   * Get all Docker images for the current user
   */
  async getDockerImages(): Promise<DockerImage[]> {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get all Docker images from local system
      const response = await fetch(`${API_URL}/api/docker/images`);
      if (!response.ok) {
        throw new Error('Failed to fetch Docker images');
      }

      const data = await response.json();
      let allImages = data.images || [];
      
      // Get Docker image metadata from Supabase to filter by user
      const { data: imageMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('type', 'image')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching Docker image metadata from Supabase:', error);
      }
      
      // Just return all images rather than filtering - this ensures all 
      // locally built images and pulled images are displayed
      return allImages;
    } catch (error) {
      console.error('Error fetching Docker images:', error);
      throw error;
    }
  },

  /**
   * Delete a Docker image
   */
  async deleteDockerImage(id: string): Promise<any> {
    try {
      // Delete Docker image locally first
      const response = await fetch(`${API_URL}/api/docker/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete Docker image');
      }

      const data = await response.json();
      
      // Get current user for Supabase integration
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Delete metadata from Supabase
        const { data: imageMetadata } = await supabase
          .from('docker_metadata')
          .select('id')
          .eq('type', 'image')
          .eq('local_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (imageMetadata) {
          await supabase
            .from('docker_metadata')
            .delete()
            .eq('id', imageMetadata.id);
        }
      }

      return data;
    } catch (error) {
      console.error('Error deleting Docker image:', error);
      throw error;
    }
  },

  /**
   * Get all Docker containers for the current user
   */
  async getDockerContainers(): Promise<DockerContainer[]> {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get all containers from Docker
      const response = await fetch(`${API_URL}/api/docker/containers`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Docker containers');
      }

      const data = await response.json();
      const allContainers = data.containers || [];
      
      // Get container metadata from Supabase to filter by user
      const { data: containerMetadata, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('type', 'container')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching container metadata from Supabase:', error);
      }
      
      // If we have Supabase metadata and it's not empty, filter containers by IDs associated with user
      if (containerMetadata && containerMetadata.length > 0) {
        const userContainerIds = containerMetadata.map(meta => meta.local_id);
        const userContainers = allContainers.filter((container: {id: string}) => 
          userContainerIds.includes(container.id)
        );
        
        return userContainers.map((container: {id: string, name: string, image: string, status: string, ports: string}) => ({
          id: container.id,
          name: container.name,
          image: container.image,
          status: container.status,
          ports: container.ports
        }));
      }
      
      // If no metadata yet, return all containers (MODIFIED - now showing all containers instead of empty array)
      // This allows users to see containers created outside the application
      return allContainers.map((container: {id: string, name: string, image: string, status: string, ports: string}) => ({
        id: container.id,
        name: container.name,
        image: container.image,
        status: container.status,
        ports: container.ports
      }));
    } catch (error) {
      console.error('Error fetching Docker containers:', error);
      throw error;
    }
  },

  /**
   * Stop a Docker container
   */
  async stopDockerContainer(containerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/docker/containers/${containerId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to stop Docker container');
      }
    } catch (error) {
      console.error(`Error stopping Docker container ${containerId}:`, error);
      throw error;
    }
  },

  /**
   * Run a Docker container
   */
  async runDockerContainer(image: string, options?: { name?: string, ports?: string }): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/api/docker/containers/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          name: options?.name,
          ports: options?.ports
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run Docker container');
      }

      const data = await response.json();
      return data.containerId;
    } catch (error) {
      console.error(`Error running Docker container for image ${image}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Dockerfile
   */
  async deleteDockerfile(path: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/dockerfile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete Dockerfile');
      }
    } catch (error) {
      console.error('Error deleting Dockerfile:', error);
      throw error;
    }
  },
  
  /**
   * Get Docker resources from Supabase by type
   */
  async getDockerMetadataFromSupabase(type: 'dockerfile' | 'image' | 'container'): Promise<DockerMetadata[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('docker_metadata')
        .select('*')
        .eq('type', type)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${type} metadata from Supabase:`, error);
      throw error;
    }
  },

  /**
   * Search for local Docker images by name/tag
   */
  async searchLocalImages(query: string): Promise<DockerImage[]> {
    try {
      // Get all images first - using direct function call instead of this.getDockerImages
      const allImages = await getDockerImages();
      
      // Filter images by query (case-insensitive)
      const lowerQuery = query.toLowerCase();
      return allImages.filter(image => {
        const repo = (image.repository || '').toLowerCase();
        const tag = (image.tag || '').toLowerCase();
        const fullName = `${repo}:${tag}`;
        return repo.includes(lowerQuery) || 
               tag.includes(lowerQuery) || 
               fullName.includes(lowerQuery) ||
               image.id.toLowerCase().includes(lowerQuery);
      });
    } catch (error) {
      console.error('Error searching local Docker images:', error);
      throw error;
    }
  },

  /**
   * Search for Docker images on Docker Hub
   */
  async searchDockerHub(query: string): Promise<any[]> {
    try {
      // Docker Hub API endpoint for searching images
      const response = await fetch(`${API_URL}/api/docker/search?query=${encodeURIComponent(query)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search Docker Hub');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching Docker Hub:', error);
      throw error;
    }
  },

  /**
   * Pull Docker image from Docker Hub with progress tracking
   * Note: This doesn't use the pullDockerImage function for streaming support
   * The streaming API is handled directly in the component to show real-time progress
   */
  async pullDockerImage(imageName: string): Promise<any> {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // The actual pull is handled through streaming in the component
      // This function is now just used to record in Supabase after a successful pull
      
      // First, get the image ID of the pulled image
      const imageIdResponse = await fetch(`${API_URL}/api/docker/images`, {
        method: 'GET'
      });
      
      if (!imageIdResponse.ok) {
        throw new Error('Failed to get Docker images after pull');
      }
      
      const imagesData = await imageIdResponse.json();
      const pulledImage = imagesData.images.find((img: any) => 
        `${img.repository}:${img.tag}` === imageName || 
        img.repository === imageName
      );
      
      const imageId = pulledImage ? pulledImage.id : '';
      
      // Store metadata in Supabase to track that this user pulled this image
      try {
        await supabase
          .from('docker_metadata')
          .insert({
            type: 'image',
            name: imageName,
            local_id: imageId,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Error storing image metadata in Supabase:', err);
      }
      
      return { success: true, imageId };
    } catch (error) {
      console.error(`Error pulling Docker image ${imageName}:`, error);
      throw error;
    }
  },
};

// Re-export the functions as named exports
export const createDockerfile = dockerService.createDockerfile;
export const getDockerfiles = dockerService.getDockerfiles;
export const buildDockerImage = dockerService.buildDockerImage;
export const getDockerImages = dockerService.getDockerImages;
export const deleteDockerImage = dockerService.deleteDockerImage;
export const getDockerContainers = dockerService.getDockerContainers;
export const stopDockerContainer = dockerService.stopDockerContainer;
export const runDockerContainer = dockerService.runDockerContainer;
export const deleteDockerfile = dockerService.deleteDockerfile;
export const getDockerMetadataFromSupabase = dockerService.getDockerMetadataFromSupabase;
export const searchLocalImages = dockerService.searchLocalImages;
export const searchDockerHub = dockerService.searchDockerHub;
export const pullDockerImage = dockerService.pullDockerImage;