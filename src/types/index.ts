// VM Manager Types

// VM types
export interface VirtualMachine {
  id: string;
  name: string;
  cpuCores: number;
  memory: number; // in GB
  status: 'running' | 'stopped';
  disk?: VirtualDisk;
  iso?: ISO;
  createdAt: Date;
  lastStarted?: Date;
  user_id?: string; // Added for Supabase integration
}

export interface VMUpdateParams {
  name?: string;
  cpuCores?: number;
  memory?: number;
}

// Disk types
export interface VirtualDisk {
  id: string;
  name: string;
  format: string;
  size: number; // in GB
  path: string;
  createdAt: Date | string;
}

// ISO types
export interface ISO {
  id: string;
  name: string;
  path: string;
  size: number; // in MB
  uploadedAt: Date | string;
}

// Command types
export interface Command {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
}

// Docker types
export interface Dockerfile {
  name: string;
  path: string;
  content: string;
  createdAt: Date | string;
  size?: number;
}

export interface DockerImage {
  repository: string;
  tag: string;
  id: string;
  size: string;
  created: string;
}

export interface DockerContainer {
  id: string;
  image: string;
  command?: string;
  status: string;
  ports?: string;
  name: string;
}

// Supabase types
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  created_at: string;
}

export interface VMMetadata {
  id: string;
  name: string;
  cpu_cores: number;
  memory: number;
  status: string;
  disk_path?: string;
  iso_path?: string;
  local_vm_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DiskMetadata {
  id: string;
  name: string;
  format: string;
  size: number;
  path: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DockerMetadata {
  id: string;
  type: 'dockerfile' | 'image' | 'container';
  name: string;
  local_id?: string;
  path?: string;
  status?: string;
  content?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}