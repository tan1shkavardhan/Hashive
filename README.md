# Hashive

> A full-stack file storage system that reduces storage usage through SHA-256 content-based deduplication and gzip compression.

## Overview

**Hashive** is a full-stack file storage application built with **FastAPI** and **React**.

It allows users to register, authenticate, upload, download, and manage their files through a web interface.

When a file is uploaded, Hashive calculates its **SHA-256 hash** to identify the file based on its content. If the same content has already been stored, Hashive detects the duplicate and reuses the existing physical storage instead of creating another copy.

New files are compressed using **gzip** before being persisted. The system maintains file metadata in SQLite and provides storage analytics to measure compression and deduplication savings.

## Core Features

* JWT-based user authentication
* File upload and download
* SHA-256 content hashing
* Content-based duplicate detection
* Gzip compression
* Shared physical storage for duplicate content
* Safe deletion of shared file content
* User-specific file management
* File metadata persistence
* Storage savings calculation
* File type analytics
* Storage analytics dashboard

## System Architecture

```text
                         +-------------------+
                         |       User        |
                         +---------+---------+
                                   |
                                   v
                         +-------------------+
                         |  React Frontend   |
                         +---------+---------+
                                   |
                          REST API Requests
                                   |
                                   v
                         +-------------------+
                         |    FastAPI API    |
                         +---------+---------+
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
             +-------------+              +---------------+
             |   SQLite    |              | File Storage  |
             |  Metadata   |              |  <hash>.gz   |
             +-------------+              +---------------+
                    ^                             ^
                    |                             |
                    +-------------+---------------+
                                  |
                           File Processing
                                  |
                         +--------+--------+
                         |                 |
                         v                 v
                    SHA-256 Hash       gzip Compression
```

## How It Works

### 1. Upload

The user uploads a file through the React frontend.

The request is sent to the FastAPI backend for processing.

### 2. Content Hashing

Hashive calculates a SHA-256 hash from the file contents.

```text
File
 │
 ▼
SHA-256
 │
 ▼
Content Hash
```

The hash acts as the content identifier for the physical file.

### 3. Duplicate Detection

The generated hash is checked against existing stored content.

```text
                 SHA-256 Hash
                      │
              Check Existing Hash
                 /          \
                /            \
          New Content     Existing Content
              │                 │
              ▼                 ▼
         Compress File      Reuse Storage
              │                 │
              └────────┬────────┘
                       ▼
                 Save Metadata
```

If the hash already exists, Hashive creates a new metadata record for the user's upload while referencing the existing physical file.

This allows multiple users or file records to reference the same stored content.

### 4. Compression

New physical files are compressed using gzip before being stored.

```text
Original File
      │
      ▼
 gzip compression
      │
      ▼
Compressed File
```

For example:

```text
Original File
     │
     │ 100 MB
     ▼
 gzip
     │
     │ 70 MB
     ▼
Stored File

Compression Savings = 30 MB
```

Actual compression savings depend on the file type and its contents.

### 5. Physical Storage

Files are stored using their SHA-256 hash as the storage identifier.

```text
storage/
├── <sha256-hash-1>.gz
├── <sha256-hash-2>.gz
└── <sha256-hash-3>.gz
```

The filename therefore represents the content rather than the user's original filename.

### 6. Metadata Storage

SQLite stores metadata associated with each uploaded file.

The metadata includes:

| Field             | Description                                |
| ----------------- | ------------------------------------------ |
| Original filename | Filename supplied during upload            |
| File hash         | SHA-256 content hash                       |
| Original size     | Size before compression                    |
| Compressed size   | Size after gzip compression                |
| Duplicate status  | Whether the upload reused existing content |
| Upload time       | Time the file was uploaded                 |
| User reference    | User associated with the file record       |

## Deduplication

Hashive uses **content-based deduplication** rather than relying on filenames.

For example, when User A uploads `report.pdf`:

```text
User A
  │
  ▼
report.pdf
  │
  ▼
SHA-256
  │
  ▼
abc123...
  │
  ▼
abc123....gz
```

If User B uploads an identical file:

```text
User B
  │
  ▼
report.pdf
  │
  ▼
SHA-256
  │
  ▼
abc123...
  │
  ▼
Existing physical file
```

Instead of storing another copy:

```text
                    +------------------+
User A ────────────>|                  |
                    |   abc123....gz   |
User B ────────────>|                  |
                    +------------------+
```

The database maintains separate logical file records for each upload, while identical content can share the same physical compressed file.

This reduces redundant storage when identical content is uploaded multiple times.

## Compression

Hashive tracks both the original and compressed file sizes.

```text
Original Size
      │
      ▼
gzip Compression
      │
      ▼
Compressed Size
```

These values are used to calculate compression savings:

```text
Compression Savings
= Original Size - Compressed Size
```

and:

```text
Compression Savings %
= (Savings / Original Size) × 100
```

The system can therefore distinguish storage savings produced by **compression** from savings produced by **deduplication**.

## Storage Analytics

Hashive exposes an analytics endpoint and frontend visualizations for understanding storage usage.

Analytics include:

* Total files
* Unique files
* Duplicate files
* Total original size
* Total compressed size
* Compression savings
* Compression savings percentage
* Deduplication savings
* Total storage savings
* File type statistics

```text
Storage Analytics
│
├── File Statistics
│   ├── Total Files
│   ├── Unique Files
│   └── Duplicate Files
│
├── Storage Usage
│   ├── Original Size
│   └── Compressed Size
│
├── Storage Savings
│   ├── Compression Savings
│   ├── Deduplication Savings
│   └── Total Savings
│
└── File Type Breakdown
```

## Authentication

Hashive uses **JWT-based authentication** to protect user-specific operations.

```text
Register
   │
   ▼
User Account
   │
   ▼
Login
   │
   ▼
JWT Access Token
   │
   ▼
Authenticated API Requests
```

Protected operations include:

* Viewing user information
* Uploading files
* Listing files
* Downloading files
* Deleting files
* Viewing storage analytics

## API Reference

The backend is implemented using FastAPI and exposes REST endpoints.

### Authentication

| Method | Endpoint         | Purpose                                  |
| ------ | ---------------- | ---------------------------------------- |
| `POST` | `/auth/register` | Create a user account                    |
| `POST` | `/auth/login`    | Authenticate and receive an access token |
| `GET`  | `/auth/me`       | Retrieve the current user's information  |

### Files

| Method   | Endpoint                    | Purpose                   |
| -------- | --------------------------- | ------------------------- |
| `POST`   | `/files/upload`             | Upload and process a file |
| `GET`    | `/files`                    | List the user's files     |
| `GET`    | `/files/{file_id}/download` | Download a file           |
| `DELETE` | `/files/{file_id}`          | Delete a file             |

### Analytics

| Method | Endpoint     | Purpose                              |
| ------ | ------------ | ------------------------------------ |
| `GET`  | `/analytics` | Retrieve storage and file statistics |

## Technology Stack

### Backend

* **Python**
* **FastAPI**
* **SQLite**
* **PyJWT**
* **Passlib**
* **bcrypt**
* **python-multipart**

### File Processing

* **SHA-256**
* **gzip**

### Frontend

* **React**
* **React Router**
* **Axios**
* **Recharts**
* **Tailwind CSS**
* **Vite**

## Project Structure

```text
Hashive/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── storage/
│
├── frontend/
│   └── hashive-ui/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       └── ...
│
├── .gitignore
└── package-lock.json
```

## Getting Started

### Prerequisites

Make sure the following are installed:

* Python 3.10+
* Node.js and npm

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python main.py
```

The API will be available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### Frontend Setup

Navigate to the frontend application:

```bash
cd frontend/hashive-ui
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## End-to-End Workflow

```text
                         User
                          │
                          ▼
                   React Frontend
                          │
                          ▼
                     FastAPI API
                          │
                    File Upload
                          │
                          ▼
                    SHA-256 Hash
                          │
                 ┌────────┴────────┐
                 │                 │
          Hash Exists?          New Hash
                 │                 │
                YES               NO
                 │                 │
                 ▼                 ▼
          Reuse Existing      gzip Compress
             Storage               │
                 │                 ▼
                 │            Store <hash>.gz
                 │                 │
                 └────────┬────────┘
                          ▼
                    Save Metadata
                          │
                          ▼
                    SQLite Database
                          │
                          ▼
                  Storage Analytics
```

## Example Upload Flow

```text
report.pdf
     │
     ▼
Calculate SHA-256
     │
     ▼
Check Existing Hash
     │
     ├── Exists ──────────► Reuse Existing Storage
     │
     └── Does Not Exist
              │
              ▼
        gzip Compression
              │
              ▼
        Store <hash>.gz
              │
              ▼
        Save File Metadata
              │
              ▼
        Update Storage Analytics
```

## What I Learned

Building Hashive provided hands-on experience with:

* Designing FastAPI REST APIs
* Implementing JWT authentication
* Handling multipart file uploads
* Serving file downloads
* SHA-256 content hashing
* Content-based file deduplication
* gzip compression
* SQLite database operations
* File metadata management
* Storage optimization calculations
* React API integration
* Data visualization with Recharts
* Managing shared physical file storage

## Project Status

**Completed**

Hashive was built as a full-stack project to explore **content-addressable storage, file deduplication, compression, authentication, metadata management, and storage analytics**.
