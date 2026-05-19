# UETDocs

A full-stack document sharing platform for UET students - browse, upload, rate, and organize academic documents by course.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Backend](#backend)
  - [Frontend](#frontend)
---

## Overview

**UETDocs** is a community-driven document repository built for students of the University of Engineering and Technology (UET). It allows users to upload, discover, bookmark academic materials organized by course and subject.

---

## Features

- **Authentication** - JWT-based login/register with Google OAuth support
- **Document Management** - Upload, view, download, and delete documents
- **Voting** - Like/Dislike documents to surface quality content
- **Bookmarks** - Save documents for later access
- **Courses** - Create own courses and add documents to them
- **Reporting** - Flag inappropriate content for review
- **Admin Dashboard** - Manage users, documents, and reported content

---

## Tech Stack

### Backend
| Technology | Role |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | REST API framework |
| [SQLAlchemy (async)](https://docs.sqlalchemy.org/) | ORM & database layer |
| [PostgreSQL](https://www.postgresql.org/) | Primary database |
| [Alembic](https://alembic.sqlalchemy.org/) | Database migrations |
| [Cloudflare R2] | Object storage for documents |
| [Pydantic v2](https://docs.pydantic.dev/) | Data validation & settings |
| [python-jose](https://python-jose.readthedocs.io/) | JWT authentication |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |

### Frontend
| Technology | Role |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client |
| [react-pdf](https://react-pdf.org/) | PDF rendering |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |

---

## Project Structure

```
UETDocs/
├── back-end/
│   ├── app/
│   │   ├── api/            # Route handlers (v1)
│   │   │   └── v1/         # bookmark, course, document, user APIs
│   │   ├── auth/           # Authentication logic
│   │   ├── core/           # Config, database, dependencies
│   │   ├── crud/           # Database CRUD operations
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic layer
│   │   └── worker/         # Background workers
│   ├── alembic/            # Database migration scripts
│   ├── tests/              # Pytest test suite
│   ├── .env.example
│   ├── requirements.txt
│   └── main.py
│
└── front-end/
    ├── src/
    │   ├── api/            # Axios API clients
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React context providers
    │   ├── hooks/          # Custom React hooks
    │   ├── pages/          # Page-level components
    │   │   ├── admin/      # Admin dashboard pages
    │   │   └── ...         # Public & user pages
    │   ├── styles/         # CSS stylesheets
    │   └── utils/          # Utility functions
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- **Python** >= 3.11
- **Node.js** >= 20
- **PostgreSQL** >= 15
- **Redis** >= 7
- A **MinIO** instance or **Cloudflare R2** bucket

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd back-end

# 2. Create and activate a virtual environment
python -m venv .venv

.venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and configure environment variables
cp .env.example .env
# Edit .env with your database, storage, and JWT settings

# 5. Run database migrations
alembic upgrade head

# 6. Start the development server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs (Swagger UI) are at `http://localhost:8000/docs`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd front-end

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env with your API URL and Google OAuth client ID

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend

Create a `.env` file in `back-end/` based on `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost/uetdocs` |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID | `abc123` |
| `R2_ENDPOINT` | R2 endpoint URL | `https://<id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | R2 access key | — |
| `R2_SECRET_KEY` | R2 secret key | — |
| `R2_BUCKET_NAME` | Storage bucket name | `uetdocs` |
| `R2_REGION` | Storage region | `auto` |
| `JWT_SECRET_KEY` | Secret key for signing JWTs | `your-strong-secret` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (minutes) | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (days) | `7` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `ENVIRONMENT` | Runtime environment | `development` or `production` |
| `PORT` | Server port | `8000` |
| `LOG_LEVEL` | Log verbosity | `INFO` |

*Note: if you use R2 instead of MINIO, you may need to add CORS policy to your R2 bucket settings in order to get the preview of the document correctly
- example: 
  [
    {
      "AllowedOrigins": [
        "http://localhost:5173"
      ],
      "AllowedMethods": [
        "GET",
        "HEAD"
      ],
      "AllowedHeaders": [
        "Range"
      ],
      "ExposeHeaders": [
        "Accept-Ranges",
        "Content-Length",
        "Content-Range",
        "Content-Type",
        "ETag"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
  
### Frontend

Create a `.env` file in `front-end/` based on `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | `xxxx.apps.googleusercontent.com` |
| `VITE_ENV` | App environment | `development` |
| `VITE_USE_MOCK_AUTH` | Use mock auth for local dev | `false` |

---

