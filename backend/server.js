const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = 5000;

// Path to QEMU installation
const QEMU_PATH = 'C:\\Program Files\\qemu';

// Path to store VM data
const VM_DATA_PATH = path.join(__dirname, 'data');
const VM_DATA_FILE = path.join(VM_DATA_PATH, 'vms.json');
const DISK_INFO_FILE = path.join(VM_DATA_PATH, 'disk_info.json');

// Ensure data directory exists
if (!fs.existsSync(VM_DATA_PATH)) {
  fs.mkdirSync(VM_DATA_PATH, { recursive: true });
  console.log('Created data directory:', VM_DATA_PATH);
}

// Middleware
app.use(cors());
app.use(express.json());

// Ensure disks directory exists
const disksDir = path.join(__dirname, 'disks');
if (!fs.existsSync(disksDir)) {
  fs.mkdirSync(disksDir, { recursive: true });
  console.log('Created disks directory:', disksDir);
}

// Sanitize disk name to prevent command injection
function sanitizeDiskName(name) {
  // Only allow alphanumeric characters, hyphens, and underscores
  return name.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Validate disk format
function isValidFormat(format) {
  const validFormats = ['qcow2', 'raw', 'vdi', 'vmdk'];
  return validFormats.includes(format);
}

// Load VM data from file
function loadVMData() {
  if (fs.existsSync(VM_DATA_FILE)) {
    try {
      const data = fs.readFileSync(VM_DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to load VM data:', err);
    }
  }
  return [];
}

// Save VM data to file
function saveVMData() {
  try {
    fs.writeFileSync(VM_DATA_FILE, JSON.stringify(vms, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save VM data:', err);
  }
}

// Load disk info from file
function loadDiskInfo() {
  if (fs.existsSync(DISK_INFO_FILE)) {
    try {
      const data = fs.readFileSync(DISK_INFO_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to load disk info:', err);
    }
  }
  return {};
}

// Save disk info to file
function saveDiskInfo() {
  try {
    fs.writeFileSync(DISK_INFO_FILE, JSON.stringify(diskInfo, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save disk info:', err);
  }
}

// In-memory VM store (replace with DB for production)
let vms = loadVMData();
let vmIdCounter = vms.length > 0 ? Math.max(...vms.map(vm => parseInt(vm.id))) + 1 : 1;

// In-memory disk info store
let diskInfo = loadDiskInfo();

// Helper: Find VM by ID
function findVM(id) {
  return vms.find(vm => vm.id === id);
}

// API endpoint to create a disk
app.post('/api/create-disk', (req, res) => {
  try {
    const { diskName, size, format } = req.body;
    
    // Validate input
    if (!diskName || !size || !format) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: diskName, size, and format are required' 
      });
    }
    
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid disk format. Supported formats: qcow2, raw, vdi, vmdk' 
      });
    }
    
    // Sanitize disk name
    const sanitizedDiskName = sanitizeDiskName(diskName);
    if (sanitizedDiskName !== diskName) {
      console.warn(`Disk name was sanitized from "${diskName}" to "${sanitizedDiskName}"`);
    }
    
    // Create the disk path
    const diskPath = path.join(disksDir, `${sanitizedDiskName}.${format}`);
    
    // Check if disk already exists
    if (fs.existsSync(diskPath)) {
      return res.status(409).json({ 
        success: false, 
        message: 'A disk with this name already exists'
      });
    }
    
    // Build the QEMU command with explicit path to qemu-img
    const qemuImgPath = path.join(QEMU_PATH, 'qemu-img.exe');
    const command = `"${qemuImgPath}" create -f ${format} "${diskPath}" ${size}`;
    
    console.log(`Executing command: ${command}`);
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing qemu-img command: ${error.message}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create disk', 
          error: error.message 
        });
      }
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      
      console.log(`Disk created successfully: ${diskPath}`);
      console.log(`Command stdout: ${stdout}`);
      
      // Update disk info - ensure we consistently store the size with 'G' suffix
      const sizeWithUnit = size.toString().endsWith('G') ? size : `${size}G`;
      
      // Store disk info with explicit creation date
      diskInfo[sanitizedDiskName] = {
        name: sanitizedDiskName,
        format,
        path: diskPath,
        size: sizeWithUnit,
        createdAt: new Date().toISOString()
      };
      saveDiskInfo();
      
      // Return success response with the disk information
      res.status(201).json({
        success: true,
        message: 'Disk created successfully',
        disk: diskInfo[sanitizedDiskName]
      });
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred', 
      error: err.message 
    });
  }
});

// API endpoint to get all disks
app.get('/api/disks', (req, res) => {
  try {
    // Read the disks directory
    fs.readdir(disksDir, (err, files) => {
      if (err) {
        console.error(`Error reading disks directory: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to read disks directory',
          error: err.message
        });
      }
      
      // Filter for valid disk formats
      const diskFiles = files.filter(file => {
        const ext = path.extname(file).slice(1);
        return isValidFormat(ext);
      });
      
      // Create array of disks with stored info
      const disks = diskFiles.map(file => {
        const ext = path.extname(file).slice(1);
        const name = path.basename(file, `.${ext}`);
        const filePath = path.join(disksDir, file);
        const stats = fs.statSync(filePath);
        
        // Use stored info if available, otherwise create default
        if (diskInfo[name]) {
          return {
            name,
            format: ext,
            path: filePath,
            size: diskInfo[name].size,
            createdAt: diskInfo[name].createdAt || stats.birthtime
          };
        } else {
          // For disks without stored info, create default and store it
          const newDiskInfo = {
            name,
            format: ext,
            path: filePath,
            size: '1G', // Default size
            createdAt: stats.birthtime
          };
          
          // Store this disk info for future use
          diskInfo[name] = newDiskInfo;
          
          return newDiskInfo;
        }
      });
      
      // Save updated disk info
      saveDiskInfo();
      
      res.status(200).json({
        success: true,
        disks
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred', 
      error: err.message 
    });
  }
});

// API endpoint to resize a disk
app.put('/api/disks/:name/:format/resize', (req, res) => {
  try {
    const { name, format } = req.params;
    const { size } = req.body;
    
    console.log('Resize request received:', { name, format, size });
    
    if (!name || !format) {
      return res.status(400).json({ 
        success: false, 
        message: 'Disk name and format are required' 
      });
    }
    
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid disk format' 
      });
    }
    
    if (!size) {
      return res.status(400).json({ 
        success: false, 
        message: 'New size is required' 
      });
    }
    
    const sanitizedName = sanitizeDiskName(name);
    const diskPath = path.join(disksDir, `${sanitizedName}.${format}`);
    
    // Check if disk exists
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Disk not found' 
      });
    }
    
    // Ensure size has the 'G' suffix
    const sizeWithUnit = size.toString().endsWith('G') ? size : `${size}G`;
    
    // Build the QEMU command with explicit path to qemu-img
    const qemuImgPath = path.join(QEMU_PATH, 'qemu-img.exe');
    const command = `"${qemuImgPath}" resize "${diskPath}" ${sizeWithUnit}`;
    
    console.log(`Executing resize command: ${command}`);
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing qemu-img resize command: ${error.message}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to resize disk', 
          error: error.message 
        });
      }
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      
      console.log(`Disk resized successfully: ${diskPath}`);
      console.log(`Command stdout: ${stdout}`);
      
      // Update disk info
      if (diskInfo[sanitizedName]) {
        diskInfo[sanitizedName].size = sizeWithUnit;
        saveDiskInfo();
      }
      
      // Get updated disk info
      const stats = fs.statSync(diskPath);
      
      // Return success response with the disk information
      res.status(200).json({
        success: true,
        message: 'Disk resized successfully',
        disk: {
          name: sanitizedName,
          format,
          path: diskPath,
          size: sizeWithUnit,
          createdAt: stats.birthtime
        }
      });
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred', 
      error: err.message 
    });
  }
});

// API endpoint to delete a disk
app.delete('/api/disks/:name/:format', (req, res) => {
  try {
    const { name, format } = req.params;
    
    if (!name || !format) {
      return res.status(400).json({ 
        success: false, 
        message: 'Disk name and format are required' 
      });
    }
    
    if (!isValidFormat(format)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid disk format' 
      });
    }
    
    const sanitizedName = sanitizeDiskName(name);
    const diskPath = path.join(disksDir, `${sanitizedName}.${format}`);
    
    // Check if disk exists
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Disk not found' 
      });
    }
    
    // Delete the disk
    fs.unlinkSync(diskPath);
    
    // Remove disk info
    delete diskInfo[sanitizedName];
    saveDiskInfo();
    
    res.status(200).json({
      success: true,
      message: 'Disk deleted successfully'
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred', 
      error: err.message 
    });
  }
});

// Create VM
app.post('/api/create-vm', (req, res) => {
  const { name, cpuCores, memory, disk, iso } = req.body;
  
  // Debug logging
  console.log('Create VM request received:');
  console.log('- Name:', name);
  console.log('- CPU:', cpuCores);
  console.log('- Memory:', memory);
  console.log('- Disk:', disk ? `${disk.name}.${disk.format} (${disk.path})` : 'No disk');
  console.log('- ISO:', iso ? `${iso.name} (${iso.path})` : 'No ISO');
  
  if (!name || !cpuCores || !memory || !disk) {
    return res.status(400).json({ success: false, message: 'All VM parameters (including ISO) are required' });
  }

  // Check if ISO exists and has a valid path
  if (!iso || !iso.path) {
    return res.status(400).json({ 
      success: false, 
      message: 'ISO file is required for VM creation' 
    });
  }

  // Check if the ISO file exists on disk
  if (!fs.existsSync(iso.path)) {
    console.error(`ISO file not found: ${iso.path}`);
    return res.status(400).json({ 
      success: false, 
      message: `ISO file not found: ${iso.path}. Please provide a valid ISO path.` 
    });
  }

  const id = (vmIdCounter++).toString();
  const newVM = {
    id, name, cpuCores, memory, disk, iso,
    status: 'stopped', createdAt: new Date(), lastStarted: null
  };
  vms.push(newVM);
  saveVMData();

  // Immediately start the VM after creation
  const qemuSystemPath = path.join(QEMU_PATH, 'qemu-system-x86_64.exe');
  
  // Build command string with proper quotes
  let command = [
    `"${qemuSystemPath}"`,
    '-m', memory,
    '-cpu', 'max',
    '-smp', cpuCores,
    '-hda', `"${disk.path}"`,
    '-cdrom', `"${iso.path}"`,
    '-boot', 'menu=on',
    '-display', 'sdl'
  ].join(' ');

  console.log('QEMU Command:', command);

  try {
    // Start the VM process
    const child = spawn(command, { shell: true, detached: true, stdio: 'ignore' });
    
    child.on('error', (err) => {
      console.error('QEMU process error:', err);
    });
    
    child.unref();
    
    console.log('VM process started with PID:', child.pid);
    
    newVM.status = 'running';
    newVM.lastStarted = new Date();
    saveVMData();

    res.status(201).json({ success: true, vm: newVM });
  } catch (err) {
    console.error('Failed to start VM:', err);
    res.status(500).json({ 
      success: true, 
      message: 'VM created but failed to start. Error: ' + err.message,
      vm: newVM
    });
  }
});

// List VMs
app.get('/api/vms', (req, res) => {
  res.json({ success: true, vms });
});

// Get single VM
app.get('/api/vms/:id', (req, res) => {
  const vm = findVM(req.params.id);
  if (!vm) return res.status(404).json({ success: false, message: 'VM not found' });
  res.json({ success: true, vm });
});

// Start VM (for demo, just change status)
app.post('/api/vms/:id/start', (req, res) => {
  const vm = vms.find(vm => vm.id === req.params.id);
  if (!vm) return res.status(404).json({ success: false, message: 'VM not found' });
  if (vm.status === 'running') return res.json({ success: true, message: 'VM already running' });

  const qemuSystemPath = '"C:\\Program Files\\qemu\\qemu-system-x86_64.exe"';
  let command = [
    qemuSystemPath,
    '-m', vm.memory,
    '-cpu', 'max',
    '-smp', vm.cpuCores,
    '-hda', `"${vm.disk.path}"`,
    '-cdrom', `"${vm.iso.path}"`,
    '-boot', 'menu=on',
    '-display', 'sdl'
  ].join(' ');

  // Start QEMU process (detached)
  const child = spawn(command, { shell: true, detached: true, stdio: 'ignore' });
  child.unref();

  vm.status = 'running';
  vm.lastStarted = new Date();
  saveVMData();
  res.json({ success: true, message: 'VM started', vm });
});

// Stop VM (actually terminate the QEMU process)
app.post('/api/vms/:id/stop', (req, res) => {
  const vm = findVM(req.params.id);
  if (!vm) return res.status(404).json({ success: false, message: 'VM not found' });
  if (vm.status !== 'running') return res.json({ success: true, message: 'VM already stopped' });
  
  // On Windows, we need to find and kill the qemu-system process
  // Get a list of processes that match our VM
  const findCommand = 'powershell "Get-Process | Where-Object {$_.ProcessName -like \'qemu-system*\'} | Format-List Id,ProcessName,CommandLine"';
  
  console.log('Finding QEMU processes...');
  exec(findCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Error finding QEMU processes:', error);
      return res.status(500).json({ success: false, message: 'Failed to stop VM: ' + error.message });
    }
    
    console.log('QEMU processes found:');
    console.log(stdout);
    
    // Simple approach - kill all QEMU system processes
    // In a production environment, you would want to track PIDs or use more specific targeting
    const killCommand = 'powershell "Get-Process | Where-Object {$_.ProcessName -like \'qemu-system*\'} | Stop-Process -Force"';
    
    exec(killCommand, (killError, killStdout, killStderr) => {
      if (killError) {
        console.error('Error stopping QEMU processes:', killError);
        return res.status(500).json({ success: false, message: 'Failed to stop VM: ' + killError.message });
      }
      
      console.log('QEMU processes stopped successfully');
      vm.status = 'stopped';
      saveVMData();
      res.json({ success: true, message: 'VM stopped', vm });
    });
  });
});

// Edit VM
app.put('/api/vms/:id', (req, res) => {
  const vm = findVM(req.params.id);
  if (!vm) return res.status(404).json({ success: false, message: 'VM not found' });
  const { name, cpuCores, memory } = req.body;
  if (name) vm.name = name;
  if (cpuCores) vm.cpuCores = cpuCores;
  if (memory) vm.memory = memory;
  saveVMData();
  res.json({ success: true, vm });
});

// Delete VM
app.delete('/api/vms/:id', (req, res) => {
  const idx = vms.findIndex(vm => vm.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'VM not found' });
  vms.splice(idx, 1);
  saveVMData();
  res.json({ success: true, message: 'VM deleted' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`QEMU Disk Management Server running on port ${PORT}`);
  console.log(`QEMU Path: ${QEMU_PATH}`);
  console.log(`Disks will be stored in: ${disksDir}`);
});