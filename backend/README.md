# QEMU VM Manager Backend

This is the backend server for the QEMU VM Manager application, which allows users to create and manage virtual disks using QEMU.

## Prerequisites

- Node.js 14+ installed
- QEMU installed and available in your system PATH
- Required NPM packages: express, cors

## Installation

1. Clone the repository (if you haven't already)
2. Navigate to the backend directory:
   ```
   cd Cloud_project/backend
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Running the Server

Start the server in development mode with auto-restart on file changes:
```
npm run dev
```

Or start the server in production mode:
```
npm start
```

The server will run on port 5000 by default. You can change this in the server.js file if needed.

## API Endpoints

### Create a Virtual Disk
- **URL**: `/api/create-disk`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "diskName": "ubuntu-disk",
    "size": "10G",
    "format": "qcow2"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Disk created successfully",
    "disk": {
      "name": "ubuntu-disk",
      "format": "qcow2",
      "path": "/path/to/disk",
      "size": "10G"
    }
  }
  ```

### Get All Disks
- **URL**: `/api/disks`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "disks": [
      {
        "name": "ubuntu-disk",
        "format": "qcow2",
        "path": "/path/to/disk",
        "size": "10G",
        "createdAt": "2023-05-01T12:00:00.000Z"
      }
    ]
  }
  ```

### Delete a Disk
- **URL**: `/api/disks/:name/:format`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Disk deleted successfully"
  }
  ```

## Folder Structure

- `server.js` - Main server file
- `disks/` - Directory where created virtual disks are stored (auto-created if it doesn't exist)

## Security Considerations

- Disk names are sanitized to prevent command injection
- Input validation is performed on all parameters
- Error handling is implemented for all operations