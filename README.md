# Paudyal Family Lineage | पौड्याल कुल वंशावली

A comprehensive, production-ready interactive family tree application with bilingual support (Nepali + English), analytics dashboards, graph algorithms, and admin editing capabilities.

## Features

### Core Visualization
- **Interactive Tree View** -- Hierarchical top-down tree with pan, zoom, expand/collapse
- **Bilingual Names** -- Nepali (primary) + English display on every node
- **Gender Color Coding** -- Blue for sons, pink for daughters
- **Spouse Display** -- Spouse names shown on each node card
- **Image Placeholders** -- Profile photo support for each member
- **Lineage Path Highlighting** -- Root-to-node path glow on search/select
- **Generation Layering** -- Horizontal layers from Gen 0 to Gen 6

### Analytics Dashboards
- **Family Overview** -- Total members, generations, avg children, gender ratio, missing data KPIs
- **Branch Analytics** -- Descendants per branch bar chart, detailed comparison table
- **Generation Analytics** -- Stacked gender distribution chart, avg children trend line
- **Missing Data Dashboard** -- Track incomplete records with click-to-edit navigation

### Graph Features
- **Path Finder** -- BFS algorithm finds connection path between any two members
- **Relationship Resolver** -- LCA-based algorithm computes family relationships (uncle, cousin, grandparent, etc.) in both English and Nepali
- **Subtree Isolation** -- View any person's descendants in a focused view

### Admin System
- **JWT Authentication** -- Secure login with access + refresh tokens
- **Edit Panel** -- Slide-in panel to edit names, spouse, relationship, notes
- **Add Child** -- Create new family members under any existing node
- **Image Upload** -- Profile photo upload (2MB limit, jpg/png/webp/gif)
- **Flexible Schema** -- Add arbitrary key-value fields per member

### Export
- **JSON Export** -- Download complete tree as structured JSON
- **PDF Export** -- Generate PDF of the tree visualization

### UI/UX
- **Dark/Light Theme** -- Full dark mode support with smooth transitions
- **Responsive Design** -- Mobile hamburger menu, desktop sidebar
- **Bilingual Navigation** -- All labels in both English and Nepali

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Tree Visualization | Custom D3.js (d3-hierarchy, d3-zoom) |
| Charts | Recharts |
| State Management | Zustand |
| Routing | React Router v7 |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3, WAL mode) |
| Authentication | JWT (jsonwebtoken, bcryptjs) |
| Validation | Zod |
| PDF Export | html2canvas + jsPDF |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd FamilyLineage

# Install backend dependencies
cd backend
npm install

# Seed the database (creates SQLite DB + admin user)
npm run seed

# Install frontend dependencies
cd ../frontend
npm install
```

### Running

```bash
# Terminal 1: Start backend (port 3001)
cd backend
npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Default Admin Credentials
- **Username:** admin
- **Password:** admin123

> Change these in `backend/.env` before deploying to production.

## Project Structure

```
FamilyLineage/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── config/db.js          # SQLite connection
│   │   ├── middleware/            # Auth, error handling
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   │   ├── tree.service.js   # Tree operations
│   │   │   ├── analytics.service.js
│   │   │   └── graph.service.js  # BFS, LCA algorithms
│   │   ├── models/schema.js      # DB schema
│   │   └── utils/                # ID generation, validation
│   ├── data/family.db            # SQLite database
│   └── uploads/                  # Profile images
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── tree/             # D3 tree visualization
│   │   │   ├── panels/           # Search, edit, detail panels
│   │   │   ├── analytics/        # Dashboard components
│   │   │   ├── graph/            # Path finder, relationship
│   │   │   ├── layout/           # App shell, sidebar, theme
│   │   │   └── auth/             # Login modal
│   │   ├── pages/                # Route pages
│   │   ├── store/                # Zustand stores
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/api.js       # Axios with interceptors
│   │   └── utils/                # Tree layout, colors, export
│   └── index.html
└── family_lineage.json           # Original source data
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login | No |
| POST | /api/auth/refresh | Refresh token | No |
| POST | /api/auth/logout | Logout | No |
| GET | /api/auth/me | Current user | Yes |
| GET | /api/tree | Full nested tree | No |
| GET | /api/tree/subtree/:id | Subtree from member | No |
| GET | /api/tree/export | JSON export | No |
| GET | /api/tree/ancestor-path/:id | Ancestor chain | No |
| GET | /api/members | List/search members | No |
| GET | /api/members/:id | Member details | No |
| POST | /api/members | Add member | Admin |
| PUT | /api/members/:id | Update member | Admin |
| POST | /api/members/:id/image | Upload photo | Admin |
| POST | /api/members/:id/extras | Add extra fields | Admin |
| GET | /api/analytics/overview | Family KPIs | No |
| GET | /api/analytics/branches | Branch stats | No |
| GET | /api/analytics/generations | Generation stats | No |
| GET | /api/analytics/missing | Missing data report | No |
| GET | /api/graph/path | Path between members | No |
| GET | /api/graph/relationship | Relationship resolver | No |

## Security

- Helmet HTTP security headers
- CORS restricted to frontend origin
- Rate limiting on auth routes (20 req/15min)
- bcrypt password hashing (12 salt rounds)
- JWT in httpOnly cookies (XSS protection)
- Parameterized SQL queries (injection prevention)
- Zod input validation on all endpoints
- File upload validation (type + 2MB size limit)

## Data Model

Each member has a unique `nanoid`-based ID (e.g., `m_Xk8pQ2vR`) ensuring no name conflicts. Derived fields are computed on seed:
- `generation_level` -- depth in the tree (0 = root)
- `gender` -- derived from relationship field
- `family_branch_root` -- which child-of-Chhabilal branch they belong to
- `parent_id` -- foreign key to parent member

The `member_extra` table provides flexible schema for arbitrary key-value data per member.

## Environment Variables

Create `backend/.env`:

```env
PORT=3001
JWT_SECRET=your-strong-random-secret
JWT_REFRESH_SECRET=your-refresh-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## License

Private -- Paudyal Family
