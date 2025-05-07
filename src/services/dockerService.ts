import axios from 'axios';
import { DockerImage, Dockerfile, DockerContainer } from '../types';

const API_URL = 'http://localhost:5002/api';

// Create a Dockerfile
export const createDockerfile = async (name: string, content: string, directory?: string): Promise<Dockerfile> => {
  try {
    const response = await axios.post(`${API_URL}/dockerfile`, {
      name,
      content,
      directory
    });
    
    return response.data.dockerfile;
  } catch (error) {
    console.error('Error creating Dockerfile:', error);
    throw new Error(error.response?.data?.message || 'Failed to create Dockerfile');
  }
};

// Get all available Dockerfiles
export const getDockerfiles = async (): Promise<Dockerfile[]> => {
  try {
    const response = await axios.get(`${API_URL}/dockerfiles`);
    return response.data.dockerfiles;
  } catch (error) {
    console.error('Error getting Dockerfiles:', error);
    throw new Error(error.response?.data?.message || 'Failed to get Dockerfiles');
  }
};

// Delete a Dockerfile
export const deleteDockerfile = async (path: string): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/dockerfile`, {
      data: { path }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting Dockerfile:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete Dockerfile');
  }
};

// Build a Docker image from a Dockerfile
export const buildDockerImage = async (dockerfilePath: string, tag: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/docker/build`, {
      dockerfile: dockerfilePath,
      tag
    });
    
    return response.data;
  } catch (error) {
    console.error('Error building Docker image:', error);
    throw new Error(error.response?.data?.message || 'Failed to build Docker image');
  }
};

// Get all Docker images
export const getDockerImages = async (): Promise<DockerImage[]> => {
  try {
    const response = await axios.get(`${API_URL}/docker/images`);
    return response.data.images;
  } catch (error) {
    console.error('Error getting Docker images:', error);
    throw new Error(error.response?.data?.message || 'Failed to get Docker images');
  }
};

// Delete a Docker image
export const deleteDockerImage = async (imageId: string): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/docker/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting Docker image:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete Docker image');
  }
};

// Get all Docker containers
export const getDockerContainers = async (): Promise<DockerContainer[]> => {
  try {
    const response = await axios.get(`${API_URL}/docker/containers`);
    return response.data.containers;
  } catch (error) {
    console.error('Error getting Docker containers:', error);
    throw new Error(error.response?.data?.message || 'Failed to get Docker containers');
  }
};

// Stop a Docker container
export const stopDockerContainer = async (containerId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/docker/containers/${containerId}/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping Docker container:', error);
    throw new Error(error.response?.data?.message || 'Failed to stop Docker container');
  }
};

// Run a Docker container from an image
export const runDockerContainer = async (image: string, name?: string, ports?: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/docker/containers/run`, {
      image,
      name,
      ports
    });
    return response.data;
  } catch (error) {
    console.error('Error running Docker container:', error);
    throw new Error(error.response?.data?.message || 'Failed to run Docker container');
  }
};