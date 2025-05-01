export interface VirtualDisk {
  id: string;
  name: string;
  format: 'qcow2' | 'raw' | 'vdi' | 'vmdk';
  size: number; // Size in GB
  path: string;
  createdAt: Date;
}

export interface ISO {
  id: string;
  name: string;
  path: string;
  size: number; // Size in MB
  uploadedAt: Date;
}

export interface QEMUConnection {
  host: string;
  port: number;
  enabled: boolean;
  secured: boolean; // Whether to use SSL/TLS
}

export interface VirtualMachine {
  id: string;
  name: string;
  cpuCores: number;
  memory: number; // Memory in MB
  disk: VirtualDisk;
  iso?: ISO;
  status: 'running' | 'stopped' | 'paused';
  createdAt: Date;
  lastStarted?: Date;
  networkType?: 'bridged' | 'nat' | 'host-only';
  qemuConnection?: QEMUConnection;
}

export interface Command {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export interface VMUpdateParams {
  name?: string;
  cpuCores?: number;
  memory?: number;
  diskSize?: number;
  networkType?: 'bridged' | 'nat' | 'host-only';
  qemuConnection?: QEMUConnection;
}