# Hashive – File Optimization System

## Project Title

**Hashive – Secure File Optimization and Deduplication System**



# Brief Description

Hashive is a secure file optimization and storage management system designed to reduce redundant storage usage using SHA-256 hash-based deduplication and file compression techniques.

The system allows users to upload, manage, compress, download, and analyze files efficiently while maintaining file integrity. Duplicate files are detected using cryptographic hashing, preventing unnecessary storage consumption.

The platform also provides storage analytics and visualization dashboards for monitoring optimization efficiency and file distribution.



# Technology Stack and Tools Used

## Frontend

* React.js
* Tailwind CSS
* Recharts
* Axios
* Lucide React Icons
* Vite

## Backend

* FastAPI (Python)
* SQLite Database
* JWT Authentication
* GZip Compression

## Tools & Libraries

* SHA-256 Hashing
* Passlib (Password Hashing)
* JWT Token Authentication
* Python Dotenv



# Features and Functionalities Implemented

## User Authentication

* User Registration
* Secure Login System
* JWT-based Authentication
* Protected API Routes

## File Management

* File Upload
* File Download
* File Deletion
* Secure File Storage

## File Optimization

* GZip File Compression
* SHA-256 Hash Generation
* Duplicate File Detection
* Storage Deduplication

## Analytics Dashboard

* Total Files Tracking
* File Composition
* Space Saved Analytics
* File Type Distribution Charts
* Storage Comparison Visualization

## Security Features

* Password Hashing
* Token-Based Authentication
* User-Specific File Access
* File Integrity Verification



# Installation / Execution Steps

## 1. Clone the Repository

```bash
git clone <repository_link>
```

## 2. Backend Setup

### Navigate to backend folder

```bash
cd backend
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run backend server

```bash
uvicorn main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

## 3. Frontend Setup

### Navigate to frontend folder

```bash
cd frontend
cd hashive-ui
```


### Install dependencies

```bash
npm install
```

### Run frontend

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

# Project Structure

```txt
Hashive/
│
├── backend/
│   ├── storage/
│   ├── main.py
│   ├── hashive.db
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   └── hashive-ui/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── pages/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       │
│       ├── package.json
│       ├── vite.config.js
│       └── .env


# Future Enhancements

* Cloud Storage Integration
* Multi-user Collaboration
* Advanced File Search
* Real-time Notifications
* AI-based File Categorization

---

# Conclusion

Hashive demonstrates an efficient approach to secure file storage optimization using compression and deduplication techniques. The system reduces redundant storage usage while maintaining file integrity and providing a clean analytics-driven user experience.
