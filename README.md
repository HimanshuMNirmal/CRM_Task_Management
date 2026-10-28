# Role-Based Task Manager (CRM)

A production-ready CRM-style task management system where **managers assign work to their team**, **employees update progress**, and **admins manage everything**. Permissions and workflow rules are strictly enforced on the backend.

Everything is written in **strict TypeScript** (`"strict": true`, zero `any`).

| Part     | Tech Stack | Cloud / Hosting |
| -------- | ---------- | --------------- |
| Frontend | React 19, Vite, React Router 7, Tailwind CSS | **Vercel** (Edge/SPA) |
| Backend  | Node.js 20+, Express 5, Mongoose, Zod, JWT, Multer | **AWS** (App Runner / ECR - Ultra Low Usage Architecture) |
| Database | MongoDB 7 | **MongoDB Atlas** (Managed Cloud Database) |
| CI/CD    | GitHub Actions | Branch: `staging` |

---

## 1. Automated Quick Start (OS-Aware)

This repository includes a cross-platform OS runner script that **automatically detects your operating system** (Windows or Linux/macOS) and executes the appropriate setup script (`.bat` or `.sh`).

### Prerequisites
- **Node.js 20+** and **npm 10+**
- A **MongoDB Atlas** database connection string (or local MongoDB)

### One-Command Setup
From the repository root:

```bash
# Automatically detects Windows (.bat) or Linux/macOS (.sh):
npm run setup
```

What `npm run setup` does automatically:
1. Detects OS architecture (`win32` vs `linux`/`darwin`).
2. Checks for Node.js and npm installations.
3. Automatically creates `backend/.env` from `backend/.env.example` (if not present).
4. Automatically creates `frontend/.env` from `frontend/.env.example` (if not present).
5. Installs all dependencies for both backend and frontend (`npm install`).
6. Runs TypeScript type checks on both projects.

### Start Development Servers
From the root directory:

```bash
# Automatically launches backend (port 5000) and frontend (port 5173):
npm run dev
```

### Manual Scripts (Platform Specific)
If you prefer running platform-specific commands directly:

| OS | Setup Command | Dev Start Command |
|---|---|---|
| **Auto-detect (Recommended)** | `npm run setup` | `npm run dev` |
| **Windows** | `npm run setup:win` *(or `scripts\setup.bat`)* | `npm run dev:win` *(or `scripts\dev.bat`)* |
| **Linux / macOS** | `npm run setup:linux` *(or `bash scripts/setup.sh`)* | `npm run dev:linux` *(or `bash scripts/dev.sh`)* |

### Seed Demo Data (Optional)
To populate demo users, teams, projects, and tasks:
```bash
cd backend
npm run seed
```

#### Seed Credentials
All accounts use the password: **`Password@123`**

| Role     | Email                    | Team       |
| -------- | ------------------------ | ---------- |
| Admin    | `admin@example.com`      | -          |
| Manager  | `manager1@example.com`   | Team Alpha |
| Manager  | `manager2@example.com`   | Team Beta  |
| Employee | `employee1@example.com`  | Team Alpha |
| Employee | `employee2@example.com`  | Team Alpha |
| Employee | `employee3@example.com`  | Team Beta  |

---

## 2. Cloud Architecture (Cost-Optimized / Ultra-Low Usage)

### Frontend: Vercel
- Hosted on Vercel's global CDN edge network.
- `frontend/vercel.json` contains SPA routing rewrites (`/(.*) -> /index.html`) so client-side routes never 404.
- Free tier eligible (zero ongoing costs for low/moderate usage).

### Backend: AWS Ultra-Low Usage Architecture
For very low usage workloads, traditional AWS architectures (ECS Fargate + Application Load Balancer) cost **\$25-\$40/month minimum**, with the ALB alone costing ~\$18/month even when handling zero requests.

**Selected Architecture: AWS App Runner + Amazon ECR**
1. **Zero ALB overhead (\$0)**: App Runner includes an automated, managed public HTTPS endpoint with free TLS certificates.
2. **Scale compute to idle**: Pauses active vCPU compute when there is no traffic, only charging for provisioned memory (~$0.007/GB-hour), bringing idle monthly cost to **~$4 to $5/month**.
3. **Containerized**: Runs the production multi-stage Docker image built from `backend/Dockerfile`.
4. **Alternative option (AWS Lightsail Containers)**: Nano tier provides 0.25 vCPU, 512MB RAM with built-in HTTPS for a predictable **\$7/month flat**.

### Database: MongoDB Atlas
- Hosted managed cluster on MongoDB Atlas (`M0 Free Tier` or `M2/M5 Serverless Shared Tier`).
- Connected via secure `MONGODB_URI` connection string.

---

## 3. CI/CD Pipelines (Branch: `staging`)

The repository includes automated GitHub Actions pipelines targeting the **`staging`** branch:

### Frontend Pipeline: `.github/workflows/frontend-deploy.yml`
- **Triggers**: On push to branch `staging` (path `frontend/**`) or manual trigger.
- **Actions**:
  1. Installs Node.js & dependencies.
  2. Runs type checks.
  3. Injects `VITE_API_URL` (AWS Backend URL).
  4. Deploys prebuilt static bundle to Vercel via Vercel CLI.

### Backend Pipeline: `.github/workflows/backend-deploy.yml`
- **Triggers**: On push to branch `staging` (path `backend/**`) or manual trigger.
- **Actions**:
  1. Runs Vitest unit tests (`npm test`).
  2. Validates TypeScript build.
  3. Builds multi-stage production Docker image (`backend/Dockerfile`) for `linux/amd64`.
  4. Pushes tagged image (`${{ github.sha }}`, `staging`, `latest`) to Amazon ECR.
  5. Automatically triggers live deployment on AWS App Runner.

---

## 4. GitHub Secrets Configuration Guide

To enable automated CI/CD for both Vercel and AWS, configure the following secrets in your GitHub repository:

> Navigate to: **GitHub Repo > Settings > Secrets and variables > Actions > New repository secret**

### A. Vercel Deployment Secrets (Frontend)

| Secret Name | Description | Where to Find It |
|---|---|---|
| `VERCEL_TOKEN` | Personal Access Token for Vercel CLI | Vercel Dashboard > Account Settings > **Tokens** > Create Token |
| `VERCEL_ORG_ID` | Vercel Account / Team ID | Run `vercel link` locally, or check `.vercel/project.json` (`orgId`), or Team Settings |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Vercel Dashboard > Project > **Settings > General** > Project ID |
| `VITE_API_URL` | Production URL of your AWS backend | E.g. `https://<service-id>.<region>.awsapprunner.com` (no trailing slash) |

### B. AWS Deployment Secrets (Backend)

| Secret Name | Description | Where to Find It |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | IAM User Access Key | AWS IAM > Users > Your Deployment User > **Security credentials** |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Access Key | Generated alongside `AWS_ACCESS_KEY_ID` |
| `AWS_REGION` | AWS Region hosting ECR & App Runner | E.g. `us-east-1` or `ap-south-1` |
| `ECR_REPOSITORY` | Name of your Amazon ECR repository | AWS ECR > Repositories (e.g. `crm-task-backend`) |
| `APP_RUNNER_SERVICE_ARN` | ARN of your AWS App Runner service | AWS App Runner > Services > Select Service > Service ARN |

> **IAM Permissions Needed for AWS Deployment**:
> Your IAM deployment user needs permissions for Amazon ECR (`ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`) and AWS App Runner (`apprunner:StartDeployment`, `apprunner:DescribeService`).

### C. Backend Application Environment Variables
*(Configure these directly in the **AWS App Runner Configuration > Environment variables** or AWS Parameter Store)*

| Variable Name | Required Value / Description | Example |
|---|---|---|
| `PORT` | Container listen port | `5000` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster0.e0ouwuu.mongodb.net/task_manager?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secure random string (minimum 16 chars) | E.g. generate via `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token expiration duration | `8h` |
| `CLIENT_ORIGIN` | Allowed CORS origins (Vercel URL) | `https://your-crm-frontend.vercel.app` (supports comma-separated list) |
| `UPLOAD_DIR` | Directory for file attachments | `uploads` |

---

## 5. Docker Usage

### Local Multi-Container Run
To run the full stack (backend + MongoDB) using Docker locally:

```bash
docker compose up -d
```
- Backend will be available at `http://localhost:5000`
- MongoDB will be available at `mongodb://localhost:27017`

### Building Backend Docker Image Manually
```bash
docker build -t task-manager-backend:latest backend/
```

---

## 6. Access Control & Workflow Matrix

Enforced strictly on the backend:

| Action                | Admin | Manager                         | Employee                           |
| --------------------- | ----- | ------------------------------- | ---------------------------------- |
| Manage users & teams  | Yes   | No                              | No                                 |
| Create project        | Yes   | Yes (own team)                  | No                                 |
| Create task           | Yes   | Own team only                   | No                                 |
| View tasks            | All   | Own team's                      | Only tasks assigned to them        |
| Edit task details     | Yes   | Own team only                   | No                                 |
| Change status         | Any   | Any, own team only              | Own tasks, To Do -> In Progress -> In Review |
| Mark task Done        | Yes   | Own team only                   | No                                 |
| Comment               | Yes   | Own team's tasks                | Only on own assigned tasks         |
| Dashboard             | All   | Own team's data                 | Own data                           |

Status workflow:
```
To Do -> In Progress -> In Review -> Done
```

---

## 7. Running Tests

```bash
# Run backend test suite (21 unit tests covering task policy & workflows)
npm test

# Run frontend build check
npm run build:frontend
```
