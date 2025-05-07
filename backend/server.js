const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os'); // Added for Docker functionality

// Initialize express app
const app = express();
const PORT = 5002; // Changed from 5001 to 5002 to avoid conflicts

// Path to QEMU installation - Updated to the correct path
const QEMU_PATH = 'C:\\msys64\\ucrt64\\bin';
// Path to store VM data
const VM_DATA_PATH = path.join(__dirname, 'data');
const VM_DATA_FILE = path.join(VM_DATA_PATH, 'vms.json');
const DISK_INFO_FILE = path.join(VM_DATA_PATH, 'disk_info.json');
// Path to store ISO files
const isosDir = path.join(__dirname, 'isos');
// Path to store Dockerfiles
const dockerfilesDir = path.join(__dirname, 'dockerfiles');

// Ensure data directory exists
if (!fs.existsSync(VM_DATA_PATH)) {
  fs.mkdirSync(VM_DATA_PATH, { recursive: true });
  console.log('Created data directory:', VM_DATA_PATH);
}

// Ensure ISOs directory exists
if (!fs.existsSync(isosDir)) {
  fs.mkdirSync(isosDir, { recursive: true });
  console.log('Created ISOs directory:', isosDir);
}

// Ensure Dockerfiles directory exists
if (!fs.existsSync(dockerfilesDir)) {
  fs.mkdirSync(dockerfilesDir, { recursive: true });
  console.log('Created dockerfiles directory:', dockerfilesDir);
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

// In-memory ISO info store
let isoInfo = {};

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
    const sizeInMB = parseInt(sizeWithUnit) * 1024;
    const currentSizeInMB = parseInt(diskInfo[sanitizedName]?.size) * 1024;

    // Update the error message to provide more clarity when the new size is less than the current size
    if (sizeInMB < currentSizeInMB) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot resize disk to ${sizeInMB}MB because it is less than the current size of ${currentSizeInMB}MB. Disk size can only be increased.` 
      });
    }
    
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
      
      // Create the updated disk object
      const updatedDisk = {
        name: sanitizedName,
        format,
        path: diskPath,
        size: sizeWithUnit,
        createdAt: diskInfo[sanitizedName]?.createdAt || stats.birthtime
      };
      
      // Update the disk information in all VMs that use this disk
      let vmsUpdated = 0;
      vms.forEach(vm => {
        if (vm.disk && vm.disk.name === sanitizedName && vm.disk.format === format) {
          // Update the disk info in this VM
          vm.disk = { ...updatedDisk, id: `disk_${sanitizedName}_${format}` };
          vmsUpdated++;
        }
      });
      
      // Save VM data if any VMs were updated
      if (vmsUpdated > 0) {
        console.log(`Updated disk information in ${vmsUpdated} VMs`);
        saveVMData();
      }
      
      // Return success response with the disk information
      res.status(200).json({
        success: true,
        message: `Disk resized successfully. Updated in ${vmsUpdated} VMs.`,
        disk: updatedDisk,
        vmsUpdated
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

// API endpoint to get all ISOs
app.get('/api/isos', (req, res) => {
  try {
    // Read the ISOs directory
    fs.readdir(isosDir, (err, files) => {
      if (err) {
        console.error(`Error reading ISOs directory: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to read ISOs directory',
          error: err.message
        });
      }
      
      // Filter for ISO files
      const isoFiles = files.filter(file => file.toLowerCase().endsWith('.iso'));
      
      console.log('Found ISO files in directory:', isoFiles);
      
      // Create array of ISOs with details
      const isos = isoFiles.map(file => {
        const name = file;
        const filePath = path.join(isosDir, file);
        const stats = fs.statSync(filePath);
        
        // Calculate size in MB
        const sizeInMB = Math.round(stats.size / (1024 * 1024));
        
        return {
          id: `iso_${name.replace(/\s+/g, '_').toLowerCase()}`,
          name,
          path: filePath,
          size: sizeInMB,
          uploadedAt: stats.birthtime || new Date()
        };
      });
      
      // If the ubuntu ISO is seen in the directory but not properly indexed
      const ubuntuIsoFile = files.find(file => 
        file.toLowerCase().includes('ubuntu') && 
        file.toLowerCase().endsWith('.iso')
      );
      
      const hasUbuntuIso = isos.some(iso => 
        iso.name.toLowerCase().includes('ubuntu') && 
        iso.name.toLowerCase().endsWith('.iso')
      );
      
      if (ubuntuIsoFile && !hasUbuntuIso) {
        const filePath = path.join(isosDir, ubuntuIsoFile);
        const stats = fs.statSync(filePath);
        const sizeInMB = Math.round(stats.size / (1024 * 1024));
        
        isos.push({
          id: 'default_ubuntu',
          name: ubuntuIsoFile,
          path: filePath,
          size: sizeInMB || 3000, // Fallback size if can't determine
          uploadedAt: stats.birthtime || new Date()
        });
        
        console.log('Added Ubuntu ISO with path:', filePath);
      }
      
      // Add default Ubuntu ISO if no ISOs were found at all
      if (isos.length === 0) {
        const defaultIsoPath = path.join(isosDir, 'ubuntu-24.04.2-desktop-amd64.iso');
        
        // Check if the file exists
        if (fs.existsSync(defaultIsoPath)) {
          console.log('Found default Ubuntu ISO at:', defaultIsoPath);
          const stats = fs.statSync(defaultIsoPath);
          const sizeInMB = Math.round(stats.size / (1024 * 1024));
          
          isos.push({
            id: 'default_ubuntu',
            name: 'ubuntu-24.04.2-desktop-amd64.iso',
            path: defaultIsoPath,
            size: sizeInMB || 3000, // Fallback size if can't determine
            uploadedAt: stats.birthtime || new Date()
          });
        } else {
          console.log('Default Ubuntu ISO not found at:', defaultIsoPath);
        }
      }
      
      console.log('Returning ISOs:', isos);
      
      res.status(200).json({
        success: true,
        isos
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

// API endpoint to register a custom ISO path
app.post('/api/register-iso', (req, res) => {
  try {
    const { isoPath, name } = req.body;
    
    if (!isoPath) {
      return res.status(400).json({
        success: false,
        message: 'ISO path is required'
      });
    }
    
    // Check if the file exists
    if (!fs.existsSync(isoPath)) {
      return res.status(400).json({
        success: false,
        message: `ISO file not found at path: ${isoPath}`
      });
    }
    
    // Get file stats
    const stats = fs.statSync(isoPath);
    
    // Verify it's a file
    if (!stats.isFile()) {
      return res.status(400).json({
        success: false,
        message: `The path does not point to a file: ${isoPath}`
      });
    }
    
    // Create ISO entry
    const isoName = name || path.basename(isoPath);
    const isoId = `custom_${Date.now()}`;
    const sizeInMB = Math.round(stats.size / (1024 * 1024));
    
    // Return ISO info
    res.status(200).json({
      success: true,
      iso: {
        id: isoId,
        name: isoName,
        path: isoPath,
        size: sizeInMB,
        uploadedAt: stats.birthtime || new Date()
      }
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
  
  if (!name || !cpuCores || !memory) {
    return res.status(400).json({ success: false, message: 'Parameters (name, cpuCores, memory) are required' });
  }

  // Validate disk
  if (!disk || !disk.path) {
    return res.status(400).json({ 
      success: false, 
      message: 'Selected disk not found or invalid. Please select a valid disk.' 
    });
  }

  // Check if disk exists
  if (!fs.existsSync(disk.path)) {
    console.error(`Disk file not found: ${disk.path}`);
    return res.status(400).json({ 
      success: false, 
      message: `Disk file not found: ${disk.path}. Please verify the disk exists in the backend directory.` 
    });
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
      message: `ISO file not found: ${iso.path}. Please verify that the ISO file exists at this location.` 
    });
  }

  const id = (vmIdCounter++).toString();
  const newVM = {
    id, name, cpuCores, memory, disk, iso,
    status: 'stopped', createdAt: new Date(), lastStarted: null
  };
  vms.push(newVM);
  saveVMData();

  // Return the newly created VM without starting it
  res.status(201).json({ success: true, vm: newVM });
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

// Start VM 
app.post('/api/vms/:id/start', (req, res) => {
  const vm = vms.find(vm => vm.id === req.params.id);
  if (!vm) return res.status(404).json({ success: false, message: 'VM not found' });
  if (vm.status === 'running') {
    // Reset status to stopped first to allow restarting
    vm.status = 'stopped';
    saveVMData();
  }

  // Check if the virtual disk exists
  if (!vm.disk || !vm.disk.path) {
    return res.status(400).json({ 
      success: false, 
      message: 'No virtual disk associated with this VM' 
    });
  }

  // Check if the disk file exists
  if (!fs.existsSync(vm.disk.path)) {
    console.error(`Disk file not found: ${vm.disk.path}`);
    return res.status(400).json({ 
      success: false, 
      message: `Virtual disk not found: ${vm.disk.name}. The disk file may have been deleted or moved.` 
    });
  }

  // Check if ISO exists and has a valid path
  if (!vm.iso || !vm.iso.path) {
    return res.status(400).json({ 
      success: false, 
      message: 'No ISO file associated with this VM' 
    });
  }

  // Check if the ISO file exists on disk
  if (!fs.existsSync(vm.iso.path)) {
    console.error(`ISO file not found: ${vm.iso.path}`);
    return res.status(400).json({ 
      success: false, 
      message: `ISO file not found: ${vm.iso.name}. Please verify that the ISO file exists at this location.` 
    });
  }

  const qemuSystemPath = path.join(QEMU_PATH, 'qemu-system-x86_64.exe');
  
  // Create a batch file to execute QEMU with proper parameters
  const batchFilePath = path.join(__dirname, `start_vm_${vm.id}.bat`);
  const qemuCommand = [
    `@echo off`,
    `echo Starting QEMU VM: ${vm.name}`,
    `echo.`,
    `"${qemuSystemPath}" ^`,
    `-m ${vm.memory} ^`,
    `-smp ${vm.cpuCores} ^`,
    `-hda "${vm.disk.path}" ^`,
    `-cdrom "${vm.iso && vm.iso.path ? vm.iso.path : ''}" ^`,
    `-boot menu=on ^`,
    `-display sdl ^`,
    `-no-reboot ^`,
    `-no-shutdown`,
    `set VM_EXIT_CODE=%ERRORLEVEL%`,
    `echo VM closed with exit code %VM_EXIT_CODE%`,
    `if %VM_EXIT_CODE% EQU 0 (`,
    `  echo VM shutdown normally - closing command window in 3 seconds...`,
    `  timeout /t 3 >nul`,
    `  exit`,
    `) else (`,
    `  echo VM terminated with error - press any key to close this window`,
    `  pause >nul`,
    `)`
  ].join('\r\n');

  console.log('Creating batch file for QEMU launch:', batchFilePath);
  fs.writeFileSync(batchFilePath, qemuCommand, 'utf8');

  try {
    // Run the batch file using cmd.exe
    const child = spawn('cmd.exe', ['/c', 'start', '', batchFilePath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    
    child.unref();
    vm.status = 'running';
    vm.lastStarted = new Date();
    saveVMData();
    res.json({ success: true, message: 'VM started successfully', vm });
  } catch (err) {
    console.error('QEMU spawn exception:', err);
    fs.appendFileSync('qemu_error.log', `QEMU exception: ${err.message}\n`);
    res.status(500).json({ success: false, message: 'Failed to start QEMU: ' + err.message });
  }
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

// Docker functionality

// API endpoint to create Dockerfile
app.post('/api/dockerfile', (req, res) => {
  try {
    const { name, content, directory } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name and content are required for Dockerfile creation'
      });
    }
    
    // Determine directory to save in (use provided directory or default)
    let saveDir = dockerfilesDir;
    if (directory) {
      // Validate the directory path to prevent path traversal
      const normalizedPath = path.normalize(directory);
      if (normalizedPath.includes('..')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid directory path'
        });
      }
      
      saveDir = normalizedPath;
      // Create directory if it doesn't exist
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
    }
    
    // Sanitize name to prevent command injection and add 'Dockerfile' prefix if needed
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_.]/g, '');
    const fileName = sanitizedName.toLowerCase().endsWith('dockerfile') 
      ? sanitizedName 
      : `Dockerfile.${sanitizedName}`;
    
    const filePath = path.join(saveDir, fileName);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return res.status(409).json({
        success: false,
        message: 'A Dockerfile with this name already exists'
      });
    }
    
    // Write the Dockerfile content
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Dockerfile created successfully: ${filePath}`);
    
    res.status(201).json({
      success: true,
      message: 'Dockerfile created successfully',
      dockerfile: {
        name: fileName,
        path: filePath,
        content: content,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error creating Dockerfile:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create Dockerfile',
      error: err.message
    });
  }
});

// API endpoint to list all Dockerfiles
app.get('/api/dockerfiles', (req, res) => {
  try {
    // Read the dockerfiles directory
    fs.readdir(dockerfilesDir, (err, files) => {
      if (err) {
        console.error(`Error reading dockerfiles directory: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to read dockerfiles directory',
          error: err.message
        });
      }
      
      // Filter for Dockerfile files
      const dockerfiles = files.filter(file => 
        file === 'Dockerfile' || file.startsWith('Dockerfile.') || file.endsWith('.dockerfile')
      );
      
      // Create array of Dockerfiles with details
      const dockerfilesList = dockerfiles.map(file => {
        const filePath = path.join(dockerfilesDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        return {
          name: file,
          path: filePath,
          content: content,
          createdAt: stats.birthtime || stats.ctime,
          size: stats.size
        };
      });
      
      res.status(200).json({
        success: true,
        dockerfiles: dockerfilesList
      });
    });
  } catch (err) {
    console.error('Error listing Dockerfiles:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list Dockerfiles',
      error: err.message
    });
  }
});

// API endpoint to build Docker image
app.post('/api/docker/build', (req, res) => {
  try {
    const { dockerfile, tag } = req.body;
    
    if (!dockerfile || !tag) {
      return res.status(400).json({
        success: false,
        message: 'Dockerfile path and image tag are required'
      });
    }
    
    // Validate the dockerfile path
    if (!fs.existsSync(dockerfile)) {
      return res.status(404).json({
        success: false,
        message: 'Dockerfile not found at the specified path'
      });
    }
    
    // Get directory of Dockerfile
    const dockerfileDir = path.dirname(dockerfile);
    
    // Build the Docker command
    const command = `docker build -t ${tag} -f "${dockerfile}" "${dockerfileDir}"`;
    
    console.log(`Executing Docker build command: ${command}`);
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error building Docker image: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to build Docker image',
          error: error.message,
          details: stderr
        });
      }
      
      console.log(`Docker image built successfully: ${tag}`);
      console.log(`Command stdout: ${stdout}`);
      
      res.status(200).json({
        success: true,
        message: 'Docker image built successfully',
        tag: tag,
        output: stdout,
        warnings: stderr
      });
    });
  } catch (err) {
    console.error('Error building Docker image:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to build Docker image',
      error: err.message
    });
  }
});

// API endpoint to list Docker images
app.get('/api/docker/images', (req, res) => {
  try {
    // Execute Docker command to list images
    exec('docker image ls --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}} {{.CreatedSince}}"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error listing Docker images: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to list Docker images',
          error: error.message
        });
      }
      
      const images = stdout.trim().split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [tag, id, size, created] = line.split(' ');
          const [repository, imageTag] = tag.split(':');
          
          return {
            repository: repository || '<none>',
            tag: imageTag || '<none>',
            id: id,
            size: size,
            created: created
          };
        });
      
      res.status(200).json({
        success: true,
        images: images
      });
    });
  } catch (err) {
    console.error('Error listing Docker images:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list Docker images',
      error: err.message
    });
  }
});

// API endpoint to list Docker containers
app.get('/api/docker/containers', (req, res) => {
  try {
    // Execute Docker command to list containers
    exec('docker ps --format "{{.ID}}|{{.Image}}|{{.Command}}|{{.Status}}|{{.Ports}}|{{.Names}}"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error listing Docker containers: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to list Docker containers',
          error: error.message
        });
      }
      
      const containers = stdout.trim().split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [id, image, command, status, ports, name] = line.split('|');
          
          return {
            id,
            image,
            command,
            status,
            ports,
            name
          };
        });
      
      res.status(200).json({
        success: true,
        containers: containers
      });
    });
  } catch (err) {
    console.error('Error listing Docker containers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list Docker containers',
      error: err.message
    });
  }
});

// API endpoint to stop a Docker container
app.post('/api/docker/containers/:id/stop', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Container ID is required'
      });
    }
    
    // Execute Docker command to stop container
    exec(`docker stop ${id}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error stopping Docker container: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to stop Docker container',
          error: error.message
        });
      }
      
      console.log(`Docker container stopped successfully: ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'Docker container stopped successfully',
        containerId: id
      });
    });
  } catch (err) {
    console.error('Error stopping Docker container:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to stop Docker container',
      error: err.message
    });
  }
});

// API endpoint to run a Docker container
app.post('/api/docker/containers/run', (req, res) => {
  try {
    const { image, name, ports } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image name is required'
      });
    }
    
    // Build the Docker command
    let command = `docker run -d`;
    
    // Add name parameter if provided
    if (name) {
      command += ` --name ${name}`;
    }
    
    // Add port mapping if provided
    if (ports) {
      command += ` -p ${ports}`;
    }
    
    // Add the image name
    command += ` ${image}`;
    
    console.log(`Executing Docker run command: ${command}`);
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running Docker container: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to run Docker container',
          error: error.message,
          details: stderr
        });
      }
      
      const containerId = stdout.trim();
      console.log(`Docker container started with ID: ${containerId}`);
      
      res.status(200).json({
        success: true,
        message: 'Docker container started successfully',
        containerId: containerId
      });
    });
  } catch (err) {
    console.error('Error running Docker container:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to run Docker container',
      error: err.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`QEMU Disk Management Server running on port ${PORT}`);
  console.log(`QEMU Path: ${QEMU_PATH}`);
  console.log(`Disks will be stored in: ${disksDir}`);
});