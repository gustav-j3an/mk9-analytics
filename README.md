# MK9 Analytics

A comprehensive web application for operational management of Trade Marketing, designed to automate data collection, integration, and analysis from Excel spreadsheets, Google Drive, and other sources. The system centralizes control of monthly operations, promoters, stores, industries, routes, and visits, providing interactive dashboards for strategic decision-making. With future plans for AI-powered operational analysis and WhatsApp integration, MK9 Analytics aims to eliminate manual processes prone to errors and provide real-time visibility into field activities.

## Objectives

- Replace decentralized spreadsheets and manual processes with automated workflows
- Centralize operational data from multiple sources (Excel, Google Drive, etc.)
- Provide real-time visibility into promoter activities, store visits, and campaign performance
- Enable data-driven decision making through interactive dashboards and analytics
- Prepare for future integration with WhatsApp for automated communication
- Lay foundation for AI-powered operational insights and predictive analytics

## Problems Solved

- **Fragmented Data**: Information about visits, inventory, and promotional displays scattered across multiple spreadsheets and emails
- **Lack of Real-Time Visibility**: Managers unable to monitor promoter performance or store compliance as activities occur
- **Error-Prone Manual Processes**: Manual data entry leading to inconsistencies, duplicates, and data loss
- **Intuition-Based Decisions**: Lack of structured analytics for optimizing routes, resource allocation, and campaign evaluation
- **Complex External Integrations**: Difficulty synchronizing with Google Drive, WhatsApp, and other field team tools

## Target Audience

- **Trade Marketing Managers**: Need consolidated view of campaign performance and ROI
- **Field Supervisors**: Require tools to monitor and guide promoters in real-time
- **Sales Promoters**: Need simplified access to schedules and activity reporting capabilities
- **Operations Team**: Responsible for data loading, validation, and quality assurance
- **Commercial Leadership**: Seeks strategic indicators for budget allocation and market planning

## Future Vision

MK9 Analytics will evolve into an intelligent platform that not only records activities but anticipates needs:

- Machine learning to suggest optimized promoter routes based on historical sales and traffic patterns
- Prediction of which stores are most likely to adhere to promotions for proactive resource allocation
- Automated personalized communication via WhatsApp based on visit outcomes and store profiles
- IoT integration (beacons in stores) for automatic presence validation
- AI-generated executive reports reducing strategic meeting preparation from days to minutes

## Technologies

### Frontend

- **Next.js 16** - React framework with hybrid rendering (SSR, SSG, ISR) and API routes
- **React 19** - Declarative UI library with concurrent rendering capabilities
- **TypeScript** - Typed superset of JavaScript for compile-time safety and enhanced IDE support
- **Tailwind CSS v4** - Utility-first CSS framework for rapid, consistent UI development
- **Shadcn/UI** - Reusable, accessible component primitives built on Radix UI and Tailwind

### Backend & Infrastructure

- **Prisma 6** - TypeScript ORM for type-safe database access with migration system
- **PostgreSQL** - Robust, extensible open-source relational database
- **Docker** - Containerization platform for environment consistency
- **docker-compose** - Multi-container orchestration for development setup
- **n8n** - Open-source workflow automation tool for external service integrations

### Integrations

- **Google Drive API** - For synchronizing promotional materials and instruction spreadsheets
- **Google Sheets API** - Alternative data source and export destination for non-technical users
- **WhatsApp Cloud API** - Planned integration for automated field communication
- **Future AI Services** - Planned integration for operational analysis and predictive insights

## Architecture

MK9 Analytics follows a hybrid architecture combining Domain-Driven Design (DDD) principles with modern modular organization to ensure scalability, maintainability, and clear separation of concerns.

### Architectural Layers

1. **Presentation Layer**
   - Location: `src/app/` (Next.js pages), `src/components/` (reusable UI)
   - Responsibility: Rendering UI, handling user interactions, managing local component state
   - Technologies: React Server Components, Client Components, React Hooks, Tailwind CSS, Shadcn/UI

2. **Application Layer**
   - Location: `src/app/api/` (Next.js API routes), `src/modules/*/services/` (application services)
   - Responsibility: Orchestrating use cases, coordinating between domains, managing transactions, applying cross-entity business rules
   - Patterns: Application Services, implicit CQRS through RESTful endpoints

3. **Domain Layer**
   - Location: `prisma/schema.prisma` (domain models), `src/modules/*/types/` (rich domain types), `src/modules/*/schemas/` (domain validation with Zod)
   - Responsibility: Defining business entities, value objects, aggregates, invariants, and pure business logic
   - Technologies: Prisma ORM (as object-relational mapper), TypeScript Interfaces/Types, Zod for domain validation

4. **Infrastructure Layer**
   - Location: `src/lib/` (shared utilities), `src/modules/*/repositories/` (data access implementations), `prisma/` (migrations, seed)
   - Responsibility: Implementing technical details like database access, external service integrations, file processing
   - Technologies: Prisma Client, database drivers, parsing libraries (xlsx, papaparse), HTTP clients (axios)

### Architectural Patterns

- **Domain-Driven Design (DDD)**: Core modeled around central Trade Marketing concepts (Operation, Visit, Promoter, Store, Industry). Clear module boundaries correspond to bounded contexts (imports, dashboard, operations).
- **Feature-Based Modularity**: Code organized by business capabilities rather than technical layers. Each module contains everything related to a feature (imports, dashboard, analytics, etc.) with its own application, domain, and infrastructure layers.
- **Repository Pattern**: Each domain entity has an abstract repository defined in its domain layer, with concrete implementations in the infrastructure layer, decoupling business logic from persistence details.
- **Service Layer**: Application orchestrators containing use-case logic that doesn't belong to entities or repositories (e.g., ImportService coordinating upload → parsing → validation → persistence → logging).
- **Implicit Event-Driven Architecture**: Through n8n and webhooks, the system reacts to external events (new file in Google Drive) without tight coupling.

### Communication Between Layers

- **Presentation → Application**: Via REST API calls (using fetch/axios) or Server Actions (future implementations)
- **Application → Domain**: Through direct calls to application services that utilize domain models and repositories
- **Domain → Infrastructure**: Via repository interfaces (TypeScript) implemented using Prisma Client
- **Infrastructure → Presentation**: Through API responses consumed by React components to update UI

This architecture ensures:
- Database changes affect only infrastructure layer
- UI improvements don't require business logic modifications
- New data sources (e.g., additional Google Sheets) can be added via new infrastructure adapters
- Complex business rules can be tested in isolation without database or UI dependencies

## File Structure

```
mk9-analytics/
├── .env                          # Environment variables (not versioned)
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── README.md                     # This document
├── docker-compose.yml            # Docker service orchestration (PostgreSQL, n8n)
├── next.config.ts                # Next.js configuration
├ package.json                    # Dependencies and npm scripts
├── postcss.config.mjs            # PostCSS configuration (for Tailwind)
├── tailwind.config.mjs           # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
│
├── prisma/                       # Prisma ORM configuration
│   ├── schema.prisma             # Data model and migration definitions
│   └── seed.ts                   # Initial data population script
│
├── src/                          # Source code
│   ├── app/                      # Next.js App Router (routing and pages)
│   │   ├── api/                  # RESTful API endpoints
│   │   │   ├── promotores/       # Promoter management endpoints
│   │   │   │   └── route.ts      # Handler for /api/promotores
│   │   │   └── [id]/             # Dynamic route for individual resources
│   │   │       └── route.ts      # Handler for /api/[id]
│   │   ├── dashboard/            # Dashboard-specific pages and components
│   │   │   ├── imports/          # Spreadsheet import page
│   │   │   │   └── page.tsx
│   │   │   ├── promotores/       # Promoter management page
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx        # Dashboard layout (sidebar, topbar)
│   │   │   └── page.tsx          # Main dashboard page
│   │   ├── layout.tsx            # Root application layout
│   │   └── page.tsx              # Public landing page
│   │
│   ├── components/               # Reusable UI components
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   ├── pending-visits.tsx # Pending visits table
│   │   │   ├── stats-card.tsx    # Key metric display card
│   │   │   ├── supervisor-card.tsx # Supervisor performance card
│   │   │   └── visits-chart.tsx  # Visits trend chart
│   │   ├── layout/               # Global layout components
│   │   │   ├── sidebar.tsx       # Side navigation menu
│   │   │   └── topbar.tsx        # Top bar with global actions
│   │   └── ui/                   # Primitive UI components (Shadcn/UI base)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── dropzone.tsx      # File upload component
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── sheet.tsx         # Slide-over modal/drawer
│   │       ├── table.tsx
│   │       └── ...               # Additional UI primitives
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── prisma.ts             # Singleton PrismaClient instance
│   │   └── utils.ts              # General-purpose helper functions
│   │
│   └── modules/                  # Feature modules (Domain-Driven Design)
│       ├── dashboard/            # Dashboard and analytics module
│       │   ├── components/       # Dashboard-specific UI components
│       │   ├── hooks/            # Custom React hooks for dashboard logic
│       │   ├── pages/            # Dashboard-related Next.js pages
│       │   ├── services/         # Dashboard application logic
│       │   ├── types/            # Dashboard domain TypeScript types
│       │   ├── utils/            # Dashboard-specific utilities
│       │   └── ...               # Additional subdirectories as needed
│       │
│       ├── imports/              # Spreadsheet import module (in development)
│       │   ├── components/       # Import UI components (upload, preview)
│       │   ├── hooks/            # Import-related React hooks
│       │   ├── pages/            # Import-related Next.js pages
│       │   ├── repositories/     # Import and ImportFile repository implementations
│       │   ├── services/         # Import processing service
│       │   ├── schemas/          # Zod validation schemas for import data
│       │   ├── types/            # Import domain TypeScript types
│       │   └── utils/            # Excel/CSV parsing utilities
│       │
│       ├── shared/               # Cross-module shared code
│       │   ├── components/       # UI components used across multiple modules
│       │   ├── hooks/            # Shared React hooks (e.g., useAuth, useQuery)
│       │   ├── types/            # Global TypeScript types
│       │   ├── utils/            # Generic utility functions
│       │   └── ...               # Other shared resources
│       │
│       └── ...                   # Additional modules in planning (operations, analytics, etc.)
│
└── public/                       # Static assets (images, icons, etc.)
    └── ...                       # Static content served at domain root
```

## Database Design

The database schema captures the essential elements of Trade Marketing operations, focusing on core entities and their relationships. Implemented using Prisma ORM with PostgreSQL.

### Enums (Enums)

#### `UserRole`
Defines system access levels:
- `ADMIN`: Full system access including user and permission management
- `SUPERVISOR`: Can manage assigned supervisors and view team reports

#### `VisitStatus`
Represents the state of a scheduled or completed visit:
- `PLANEJADA`: Visit scheduled for future occurrence
- `REALIZADA`: Visit successfully completed
- `CANCELADA`: Scheduled visit that did not occur

#### `OperationStatus`
Defines the state of a monthly operation (campaign):
- `OPEN`: Active operation accepting new visits and updates
- `CLOSED`: Operation closed, no further changes allowed (data remains viewable)
- `ARCHIVED`: Operation moved to historical archive (planned for future implementation)

### Tables (Models)

#### `User`
System users with access to the administrative interface:
- `id`: Unique identifier (ULID via `cuid()`)
- `name`: User's full name
- `email`: Unique email address (used for login)
- `password`: Hashed password (never stored as plain text in production)
- `role`: Access level (`ADMIN` or `SUPERVISOR`)
- `createdAt`/`updatedAt`: Creation and last update timestamps
- **Relationships**: None direct (Supervisor and Promoter are separate entities for flexibility)

#### `Supervisor`
Manages a team of promoters:
- `id`: Unique identifier
- `name`: Supervisor's full name
- `email`: Optional email for notifications and potential future login
- **Relationships**:
  - `promoters`: One-to-many with Promoter (one supervisor manages many promoters)
  - `createdAt`/`updatedAt`: Audit timestamps

#### `Promoter`
Field agent responsible for visiting stores and executing promotional activities:
- `id`: Unique identifier
- `name`: Promoter's full name
- `city`/`state`: Optional geographic location (for filtering and regional reports)
- `supervisorId`: Foreign key linking to responsible supervisor
- **Relationships**:
  - `supervisor`: The supervisor managing this promoter
  - `visits`: One-to-many with Visit (visits conducted by this promoter)
  - `createdAt`/`updatedAt`: Audit timestamps

#### `Industry`
Client brand or industry for which promotional activities are conducted:
- `id`: Unique identifier
- `code`: Unique industry code (e.g., `BEB001` for beverages)
- `name`: Descriptive industry name (e.g., "Beverage Industry X")
- **Relationships**:
  - `visits`: One-to-many with Visit (visits conducted for this industry)
  - `createdAt`/`updatedAt`: Audit timestamps

#### `Store`
Retail location where promotional activities occur:
- `id`: Unique identifier
- `code`: Unique store code (e.g., `SMC001`)
- `name`: Store's commercial name
- `chain`: Optional retail chain name
- `city`/`state`: Optional geographic location
- **Relationships**:
  - `visits`: One-to-many with Visit (visits conducted at this store)
  - `createdAt`/`updatedAt`: Audit timestamps

#### `Visit`
Instance of a promotional visit to a store by a promoter:
- `id`: Unique identifier
- `operationId`: Foreign key linking to the parent monthly operation
- `operation`: The operation to which this visit belongs
- `promoterId`: Foreign key linking to the conducting promoter
- `promoter`: The promoter who conducted this visit
- `storeId`: Foreign key linking to the visited store
- `store`: The store that was visited
- `industryId`: Foreign key linking to the client industry
- `industry`: The industry/client for whom the visit was conducted
- `status`: Current visit status (`PLANEJADA`, `REALIZADA`, `CANCELADA`)
- `scheduledDate`: Date and time the visit was scheduled to occur
- `completedDate`: Date and time the visit was actually completed (null if not performed or still in progress)
- `createdAt`/`updatedAt`: Audit timestamps
- **Relationships**:
  - Each visit belongs to exactly one operation, one promoter, one store, and one industry
  - An operation can have many visits
  - A promoter can conduct many visits
  - A store can receive many visits
  - An industry can have many visits across its stores

#### `Operation`
Monthly promotional campaign:
- `id`: Unique identifier
- `name`: Descriptive operation name (auto-generated based on month/year)
- `month`: Month of operation (1-12)
- `year`: Year of operation (e.g., 2026)
- `status`: Current operation status (`OPEN`, `CLOSED`, `ARCHIVED`)
- `startsAt`: Official operation start date/time (typically first day of month at 00:00)
- `endsAt`: Official operation end date/time (typically last day of month at 23:59:59)
- `createdAt`/`updatedAt`: Audit timestamps
- **Constraint**: Unique index on `(month, year)` ensuring only one operation per month/year
- **Relationships**:
  - One-to-many with Visit (an operation contains many visits)

#### `Import`
Tracking of spreadsheet import operations:
- `id`: Unique identifier
- `status`: Import status (e.g., `PENDING`, `SUCCESS`, `FAILED`)
- `createdAt`/`updatedAt`: Audit timestamps
- **Relationships**:
  - One-to-many with ImportFile (an import contains many files)

#### `ImportFile`
Individual file within an import operation:
- `id`: Unique identifier
- `fileName`: Original file name
- `fileHash`: Unique hash of file content (for duplicate detection)
- `rowCount`: Optional number of rows processed
- `importId`: Foreign key linking to parent import
- `import`: The import process this file belongs to
- `createdAt`/`updatedAt`: Audit timestamps

#### `SyncLog`
Log of automated synchronization and maintenance operations:
- `id`: Unique identifier
- `action`: Type of action performed (e.g., `COMPARE_MONTHS`, `DUPLICATE_DETECTION`, `DATABASE_REBUILD`)
- `status`: Outcome status (e.g., `INFO`, `WARNING`, `ERROR`)
- `message`: Human-readable log message
- `details`: Optional JSON metadata for additional context
- `createdAt`: Timestamp of when the log entry was created

### Entity Relationships

```mermaid
erDiagram
    USER ||..|> SUPERVISOR : "manages"
    SUPERVISOR ||..o{ PROMOTER : "supervises"
    PROMOTOR ||..o{ VISIT : "conducts"
    OPERATION ||..o{ VISIT : "contains"
    STORE ||..o{ VISIT : "receives"
    INDUSTRY ||..o{ VISIT : "serves"
    IMPORT ||..o{ IMPORT-FILE : "contains"
```

### Data Flow

1. **Operations** are created monthly (unique per month/year combination)
2. **Visits** are scheduled within operations, linking promoters, stores, and industries
3. **Imports** process spreadsheet files to create or update visit records
4. **SyncLogs** track automated operations like data comparisons and duplicate detection
5. **Users** (admins/supervisors) manage the system and view dashboards
6. **All entities** maintain audit trails through `createdAt` and `updatedAt` timestamps

## Module Overview

MK9 Analytics is organized into feature-based modules following Domain-Driven Design principles. Each module encapsulates everything related to a specific business capability.

### Core Modules

#### `dashboard`
Handles data visualization and operational monitoring:
- **Components**: Statistics cards, charts, tables for visits and promoter performance
- **Hooks**: Custom React hooks for data fetching and state management
- **Pages**: Main dashboard views and analytical screens
- **Services**: Business logic for aggregating and preparing dashboard data
- **Types**: TypeScript interfaces for dashboard-specific data shapes
- **Utilities**: Helper functions for data formatting and chart preparation

#### `imports`
Manages the end-to-end process of spreadsheet ingestion:
- **Components**: File upload interface, data preview, validation results display
- **Hooks**: React hooks for upload state, parsing progress, and validation handling
- **Pages**: Import workflow interface (upload → preview → validation → confirmation)
- **Services**: Core import orchestration (file handling → parsing → validation → persistence)
- **Schemas**: Zod schemas defining expected import file structures and validation rules
- **Types**: Domain types representing import processes and file metadata
- **Utilities**: Parsing logic for Excel (.xlsx, .xls) and CSV files using `xlsx` and `papaparse`

#### `shared`
Contains code used across multiple modules:
- **Components**: Reusable UI elements (avatars, badges, loading spinners, etc.)
- **Hooks**: Cross-cutting concerns (authentication, data fetching, form handling)
- **Types**: Global TypeScript interfaces and utility types
- **Utilities**: Helper functions (date formatting, string manipulation, object operations)
- **Constants**: Application-wide constants and configuration values

#### Planned Modules
- `operations`: CRUD operations for promotional campaigns
- `analytics`: Advanced data analysis and reporting features
- `promoters`: Promoter profile management and performance tracking
- `stores`: Store directory and performance analytics
- `industries`: Client/industry management and campaign association
- `visits`: Visit scheduling, execution tracking, and historical analysis
- `checklists`: Dynamic checklists for promotional activities per visit
- `reports`: Custom report generation and export functionality
- `google-drive`: Direct Google Drive integration (complementing n8n workflows)
- `whatsapp`: WhatsApp Business API integration for automated communication

## Dashboard Features

The dashboard provides operational visibility through multiple interconnected views:

### Main Dashboard (`/dashboard`)
- **Key Metrics Cards**:
  - Total scheduled visits
  - Completed visits (with percentage)
  - Canceled visits (with percentage)
  - Compliance rate (completed vs. scheduled)
- **Visits Trend Chart**:
  - Line chart showing daily visit completion rates over the current operation period
  - Toggle between linear and logarithmic scales
  - Hover tooltips showing exact values
- **Recent Activity Feed**:
  - Chronological list of recent visit updates (status changes, completions)
  - Color-coded by status (green for completed, yellow for planned, red for canceled)
- **Quick Actions**:
  - Button to initiate new import
  - Link to promoter management
  - Link to operation calendar

### Promoters View (`/dashboard/promotores`)
- **Promoter Table**:
  - Columns: Name, Supervisor, Assigned Visits, Completed Visits, Compliance Rate, Last Activity
  - Sortable columns
  - Inline editing for basic info (name, contact)
  - Status indicators (active/inactive)
- **Performance Charts**:
  - Bar chart comparing completion rates across promoters
  - Pie chart showing distribution of visit statuses per selected promoter
- **Filters**:
  - Supervisor dropdown
  - Date range picker
  - Status filter (all/planned/completed/canceled)
  - Search box for promoter name

### Pending Visits (`/dashboard/pending-visits`)
- **Visits Table**:
  - Columns: Promoter, Store, Industry, Scheduled Date, Status, Actions
  - Row highlighting for overdue visits (scheduled > 2 hours ago)
  - Action buttons: Mark as Completed, Mark as Canceled, Add Notes
  - Inline editing for scheduled date/time
- **Bulk Actions**:
  - Select multiple visits for batch status updates
  - Export selected visits to CSV
- **Filters**:
  - Date range (today, tomorrow, this week, custom)
  - Promoter selector
  - Store/industry filters
  - Status filter (defaults to showing only planned visits)

### Analytics Views (Planned)
- **Performance Trends**:
  - Month-over-month comparison of key metrics
  - Seasonal pattern identification
  - Correlation between visit timing and promotional effectiveness
- **Geographic Analysis**:
  - Heatmap of visit density by region
  - Performance comparison across cities/states
  - Territory optimization suggestions
- **Promoter Effectiveness**:
  - Skill gap analysis based on visit outcomes
  - Training recommendation engine
  - Incentive performance correlation
- **Store Insights**:
  - Visit frequency analysis
  - Conversion rate correlation (where sales data available)
  - Optimal visit timing recommendations

## Import Process

The import module handles the complete lifecycle of spreadsheet data ingestion:

### 1. Upload (`/dashboard/imports`)
- **Interface**: Drag-and-drop area with file type validation (.xlsx, .xls, .csv)
- **File Validation**:
  - Extension check
  - MIME type verification
  - Size limit enforcement (default 10MB)
  - Virus scanning placeholder (for future integration)
- **Metadata Capture**:
  - Automatic timestamping
  - User association (current user)
  - Initial `PENDING` status

### 2. Parsing
- **Format Detection**:
  - Excel files processed with `xlsx` library
  - CSV files processed with `papaparse`
  - Automatic delimiter detection for CSV (comma, semicolon, tab)
- **Sheet/Tab Selection**:
  - For multi-sheet Excel files, user selects which sheet to import
  - Preview of first 10 rows for validation
- **Header Mapping**:
  - Automatic header detection
  - Manual column mapping interface for non-standard formats
  - Data type inference (date, number, text)
- **Preview Grid**:
  - Interactive table showing parsed data
  - Column sorting and filtering
  - Invalid data highlighting (red background for validation errors)

### 3. Validation
- **Schema Validation**:
  - Zod-defined schemas for expected import formats (IN PROGRESS)
  - Field-level validation (required fields, data types, format constraints)
  - Cross-field validation (e.g., date ranges, logical consistency)
- **Business Rule Validation**:
  - Duplicate detection (based on file hash and content hashes)
  - Referential integrity (valid promoter/store/industry IDs)
  - Date validity (scheduled dates within operation window)
  - Status value validation (only allowing defined VisitStatus values)
- **Error Reporting**:
  - Inline error messages per cell
  - Row-level error summaries
  - Exportable error report (CSV)
  - Statistics: valid rows, invalid rows, duplicates

### 4. Persistence
- **Transaction Processing**:
  - All-or-nothing approach per import file (success or rollback)
  - Batch processing for large files (configurable batch size)
  - Progress tracking during database operations
- **Record Operations**:
  - **Create**: New visits that don't match existing records
  - **Update**: Existing visits with matching composite keys (promoter+store+date)
  - **Skip**: Duplicate records (based on configurable similarity threshold)
- **Post-Processing**:
  - Automatic `completedDate` setting for visits with status `REALIZADA`
  - Operation assignment based on scheduled date month/year
  - SyncLog entries for audit trail
  - Notification triggering (future: email/WhatsApp for failed imports)

### 5. Dashboard Integration
- **Real-Time Updates**:
  - Successful imports trigger dashboard refresh via React Query invalidation
  - Partial updates for large imports (progressive enhancement)
- **Status Tracking**:
  - Import history table showing all import attempts
  - Success/failure indicators with tooltips for error details
  - Re-import capability for failed imports
  - Storage statistics (total imports, successful rows, etc.)
- **User Feedback**:
  - Toast notifications for process milestones
  - Modal dialogs for confirmation and error details
  - Progress bars for long-running operations
  - Empty state guidance for first-time users

## API Endpoints

### Promoter Management
- **GET** `/api/promotores`
  - Description: Retrieve paginated list of promoters with filtering and sorting
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `search`: Name filter
    - `supervisorId`: Filter by supervisor
    - `city`: Filter by city
    - `state`: Filter by state
    - `sortBy`: Sort field (name, city, state)
    - `sortOrder`: asc/desc (default: asc)
  - Response:
    ```json
    {
      "items": [
        {
          "id": "string",
          "name": "string",
          "city": "string | null",
          "state": "string | null",
          "supervisorId": "string",
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)"
        }
      ],
      "pagination": {
        "page": number,
        "limit": number,
        "total": number,
        "pages": number
      }
    }
    ```
- **POST** `/api/promotores`
  - Description: Create a new promoter
  - Request Body:
    ```json
    {
      "name": "string",
      "city": "string | null",
      "state": "string | null",
      "supervisorId": "string"
    }
    ```
  - Response: Created promoter object
- **GET** `/api/promotores/[id]`
  - Description: Retrieve a specific promoter by ID
  - Response: Promoter object or 404 if not found
- **PUT** `/api/promotores/[id]`
  - Description: Update an existing promoter
  - Request Body: Partial promoter object
  - Response: Updated promoter object
- **DELETE** `/api/promotores/[id]`
  - Description: Delete a promoter (only if no associated visits)
  - Response: Success confirmation

### Visits (Dynamic ID Route)
- **GET** `/api/[id]`
  - Description: Retrieve a specific visit by ID
  - Response: Visit object with populated relations or 404
- **PUT** `/api/[id]`
  - Description: Update a visit (typically status changes)
  - Request Body: Partial visit object (status, completedDate, etc.)
  - Response: Updated visit object
- **DELETE** `/api/[id]`
  - Description: Delete a visit (only if in PLANEJADA status)
  - Response: Success confirmation

### Import (In Progress)
- **POST** `/api/imports/upload`
  - Description: Upload and initiate processing of import file
  - Request: Multipart/form-data with file
  - Response: Import preview or error
- **POST** `/api/imports/preview`
  - Description: Generate preview of import file without persistence
  - Request: File metadata and configuration
  - Response: Preview data with validation results
- **POST** `/api/imports/confirm`
  - Description: Confirm and persist import data
  - Request: Import configuration and validated data
  - Response: Import confirmation
- **GET** `/api/imports/history`
  - Description: Retrieve import history with filtering and pagination
  - Response: List of import operations

*(Additional API routes for operations, stores, industries, etc. are planned for future implementation)*

## Environment Variables

Required configuration variables for different environments:

### Core Application
- `DATABASE_URL`: PostgreSQL connection string (required)
  - Format: `postgresql://USER:***@HOST:PORT/DATABASE?schema=public`
- `NEXTAUTH_SECRET`: Secret for encrypting NextAuth tokens (required in production)
- `NEXTAUTH_URL`: Base URL of the application (required for authentication)
- `NODE_ENV`: Environment mode (`development`, `production`, `test`)

### Optional Features
- `GOOGLE_DRIVE_CREDENTIALS`: JSON credentials JSON for Google Drive API (base64 encoded)
- `GOOGLE_SHEETS_CREDENTIALS`: JSON credentials for Google Sheets API (base64 encoded)
- `WHATSAPP_TOKEN`: WhatsApp Cloud API access token (for future implementation)
- `WHATSAPP_PHONE_NUMBER_ID`: Phone number ID for WhatsApp Business Account
- `N8N_BASE_URL`: URL of the self-hosted n8n instance (default: `http://n8n:5678`)
- `N8N_API_KEY`: API key for n8n instance (if authentication enabled)
- `REVALIDATION_TIME`: Seconds for ISR revalidation (default: 60)
- `MAX_UPLOAD_SIZE`: Maximum file upload size in MB (default: 10)
- `IMPORT_BATCH_SIZE`: Number of records to process per database transaction (default: 100)

### Development Only
- `DATABASE_URL_PREVIEW`: Preview database URL for Vercel Preview Deployments
- `PGUSER`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGDATABASE`: Individual PostgreSQL connection parameters (alternative to DATABASE_URL)

## Docker Setup

### Prerequisites
- Docker Engine (version 20.10+)
- Docker Compose (version 2.0+)
- Git
- Node.js (version 18+ for local development without Docker)

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mk9-analytics.git
   cd mk9-analytics
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your configuration:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Configure other optional services as needed

4. Build and start services:
   ```bash
   docker-compose up --build
   ```

5. Initialize the database:
   ```bash
   # In another terminal, execute:
   docker exec -it mk9-analytics-db-1 npx prisma migrate deploy
   docker exec -it mk9-analytics-db-1 npx prisma db seed
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - n8n Dashboard: http://localhost:5678 (default credentials: admin/admin)

### Production Considerations
- Use a proper PostgreSQL managed service (AWS RDS, Google Cloud SQL, etc.)
- Configure HTTPS termination at the load balancer or reverse proxy
- Set strong values for `NEXTAUTH_SECRET` and database credentials
- Consider using a separate Redis instance for production caching
- Implement proper logging and monitoring (ELK stack, Prometheus/Grafana)
- Set up regular backups for the PostgreSQL database
- Use Docker secrets or Kubernetes secrets for sensitive configuration

### Management Commands
```bash
# View running services
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v

# Rebuild images
docker-compose build

# Execute commands in containers
docker-compose exec app <command>
docker-compose exec db <command>
docker-compose exec n8n <command>
```

## Prisma ORM Usage

### Development Workflow
1. **Generate Client**: After schema changes
   ```bash
   npx prisma generate
   ```

2. **Create Migration**: After modifying `schema.prisma`
   ```bash
   npx prisma migrate dev --name <migration-name>
   ```

3. **Apply Migrations**: To update database schema
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed Database**: Populate with initial data
   ```bash
   npx prisma db seed
   ```

5. **Studio GUI**: Visual database management
   ```bash
   npx prisma studio
   ```

### Important Files
- `prisma/schema.prisma`: Defines database models, relationships, and constraints
- `prisma/migrations/`: Contains migration history files
- `prisma/seed.ts`: Seed data initialization script
- `src/lib/prisma.ts`: Singleton PrismaClient instance for the application

### Common Commands
```bash
# Reset development database (WARNING: loses all data)
npx prisma migrate reset

# Push schema changes without migration history (development only)
npx prisma db push

# Validate schema against current database
npx prisma validate

# Format schema.prisma file
npx prisma format
```

### Production Deployment
- Migrations are applied automatically during deployment via `prisma migrate deploy`
- Seed data should only be run in controlled environments (staging, not production)
- Connection pooling configured automatically by Prisma based on DATABASE_URL
- Consider using connection pooler like PgBouncer for high-traffic applications

## Available Scripts

Defined in `package.json`:

### Development
- `npm run dev`: Start development server with hot reloading at http://localhost:3000
- `npm run dev:experimental`: Enable experimental Turbopack bundler (Next.js 13+ feature)

### Building
- `npm run build`: Create optimized production build
- `npm run start`: Start production server (requires prior build)

### Code Quality
- `npm run lint`: Run ESLint for code quality checks
- `npm run format`: Format code with Prettier (via eslint-plugin-prettier)

### Database
- `npm run db:migrate`: Run pending migrations
- `npm run db:generate`: Generate Prisma client from schema
- `npm run db:studio`: Launch Prisma Studio GUI
- `npm run db:seed`: Populate database with initial seed data

### Utilities
- `npm run type-check`: Run TypeScript compiler in watch mode
- `npm run audit`: Check for known vulnerabilities in dependencies

## Installation and Setup

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- Git
- Docker and Docker Compose (for containerized setup)

### Option 1: Local Development (Without Docker)

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/mk9-analytics.git
   cd mk9-analytics
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Setup Database**
   ```bash
   # Ensure PostgreSQL is running and accessible
   npx prisma migrate dev --init
   npx prisma db seed
   ```

5. **Start Application**
   ```bash
   npm run dev
   ```
   Application available at http://localhost:3000

### Option 2: Dockerized Development (Recommended)

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/mk9-analytics.git
   cd mk9-analytics
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (DATABASE_URL will be overridden by docker-compose)
   ```

3. **Start All Services**
   ```bash
   docker-compose up --build
   ```
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - n8n: http://localhost:5678

4. **Initialize Database** (first time only)
   ```bash
   docker-compose exec db npx prisma migrate deploy
   docker-compose exec db npx prisma db seed
   ```

### Verification
- Register first user at http://localhost:3000 (auto-promoted to admin)
- Login with created credentials
- Navigate to dashboard to see sample data from seed
- Test import functionality with sample Excel/CSV files

## Development Guidelines

### Code Style
- Follow ESLint and Prettier configurations in repository
- Use TypeScript strict mode (`tsconfig.json` has `"strict": true`)
- Functional components with React hooks
- Export components as named exports (default export only for pages)
- Use absolute imports with `@/` prefix (configured in `tsconfig.json`)

### Naming Conventions
- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`formatDate.ts`)
- **Functions**: camelCase (`calculateTotal`, `handleSubmit`)
- **Variables**: camelCase (`userCount`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`, `API_ENDPOINT`)
- **Types/Interfaces**: PascalCase (`UserProps`, `VisitFormData`)
- **Enums**: PascalCase with singular names (`UserRole`, `VisitStatus`)
- **Database Tables**: PascalCase matching Prisma model names (`User`, `Visit`)
- **API Routes**: kebab-case in URL paths (`/api/promotores`)

### State Management
- Use React Query (`@tanstack/react-query`) for server state
- Use React Context or Zustand for global client state when necessary
- Prefer server state over client state where possible
- Avoid prop drilling by combining context with custom hooks

### Data Fetching
- Use `getServerSideProps` or `getStaticProps` only when necessary
- Prefer React Query's `useQuery` and `useMutation` for data fetching
- Implement proper error boundaries and loading states
- Optimize queries with selective field retrieval (`select` in Prisma queries)

### Error Handling
- Use try/catch for asynchronous operations
- Implement error boundaries in React components
- Return appropriate HTTP status codes in API routes
- Log errors to console in development, to external service in production
- Provide user-friendly error messages without exposing system details

### Testing (Future Implementation)
- Unit tests: Jest with React Testing Library
- End-to-end tests: Playwright or Cypress
- Test coverage goal: 80%+ for critical paths*
- Mock external dependencies (APIs, database) in unit tests

## Roadmap

### Sprint 1: Foundation (Completed ✅)
- Project setup with Next.js 16, TypeScript, Tailwind, Shadcn/UI
- Prisma ORM configuration with PostgreSQL
- Core data models (User, Supervisor, Promoter, Store, Industry, Visit, Operation)
- Basic authentication system
- Initial UI components and layout
- Docker Compose configuration for development
- Seed data for initial testing
- Basic API routes for promoters and visits

### Sprint 2: Import Module (Completed ✅)
- File upload interface with drag-and-drop
- Excel and CSV parsing using `xlsx` and `papaparse`
- Data preview with interactive grid
- Zod-based schema validation (in progress)
- Duplicate detection using file hashes
- Error reporting and correction interface
- Database transaction processing
- Import history and status tracking
- Integration with dashboard for real-time updates

### Sprint 3: Operations Management (Planned 🔵)
- CRUD operations for promotional campaigns (Operations)
- Operation scheduling with start/end dates
- Monthly operation automation (auto-create next month)
- Operation status management (Open/Closed/Archived)
- Assignment of operations to promoters/stores/industries
- Reporting on operation performance
- Calendar view for operations and visits

### Sprint 4: Dashboard Enhancements (Planned 🔵)
- Advanced statistics cards with comparative metrics
- Interactive charts with filtering and drill-down
- Real-time updates using WebSocket or polling optimization
- Customizable dashboard layouts
- Export dashboard data to CSV/PDF
- Role-based views (Supervisor vs. Analyst vs. Executive)
- Mobile-responsive dashboard adjustments

### Sprint 5: Analytics Engine (Planned 🔵)
- Trend analysis and forecasting
- Geographic heatmaps of activity
- Promoter performance leaderboards
- Store compliance scoring
- Campaign ROI calculation (when sales data integrated)
- Anomaly detection for unusual patterns
- Exportable analytical reports

### Sprint 6: Integrations (Planned 🔵)
- Google Drive synchronization via n8n workflows
- Google Sheets bidirectional sync
- WhatsApp Business API for automated communications
- Email notifications for important events
- Webhook endpoints for external system integration
- Single Sign-On (SSO) options (Google, Azure AD)

### Sprint 7: Mobile Experience (Planned 🔵)
- Progressive Web App (PWA) enhancements
- Offline capability for field workers
- Native camera integration for proof-of-visit photos
- Barcode/QR code scanning for product verification
- Location-based check-in for visit validation
- Push notifications for schedule reminders
- Simplified mobile-first interface for promoters

### Sprint 8: AI Enhancements (Planned 🔵)
- Visit outcome prediction based on historical patterns
- Automated route optimization for promoters
- Anomaly detection in visit data
- Natural language query interface for analytics
- Automated report generation with insights
- Image verification of promotional displays
- Sentiment analysis of visit notes

## Project Status

### Overall Completion: 30%

### Component Status

| Component | Status | Completion | Notes |
|-----------|--------|------------|-------|
| Infrastructure | ✅ Complete | 100% | Docker-compose, PostgreSQL, n8n configured |
| Database Schema | ✅ Complete | 100% | Core models defined and migrated |
| Authentication System | 🟡 Partial | 60% | Basic session setup, needs role-based protection |
| Import Module | 🟡 In Progress | 60% | Upload and parsing implemented, validation/persistence in progress |
| Dashboard Core | 🟡 Partial | 50% | Basic layout and components, data integration needed |
| API Endpoints | 🟡 Partial | 40% | Promoters, visits, and import routes implemented |
| UI Components | ✅ Complete | 80% | Reusable component library established |
| Testing | ❌ Not Started | 0% | No test suite implemented |
| Documentation | 🟡 In Progress | 40% | This document and technical specs underway |
| Performance Optimization | ❌ Not Started | 0% | No optimization efforts yet |
| Security Hardening | ❌ Not Started | 0% | Beyond basic setup, needs review |

### Known Issues
1. **Authentication Protection**: API routes and dashboard pages lack middleware authentication
2. **Form Validation**: Import validation uses basic checks, needs full Zod schema implementation
3. **Error Boundaries**: React error boundaries not implemented in UI components
4. **Loading States**: Async operations lack consistent loading UI feedback
5. **Accessibility**: ARIA labels and keyboard navigation need audit
6. **Mobile Responsiveness**: Some components not fully optimized for mobile
7. **SEO**: Metadata and open graph tags missing for public pages
8. **Error Logging**: Client-side errors not captured and reported
9. **State Management**: Overuse of prop drilling in some components
10. **Bundle Analysis**: No bundle size optimization or code splitting implemented
11. **Import Persistence**: Import service does not yet persist data to database (stubbed)
12. **Validation Schemas**: Zod schemas for import formats are incomplete
13. **Duplicate Detection**: Import service lacks robust duplicate detection beyond file hash
14. **History Logging**: ImportService does not fully populate ImportFile and SyncLog records

### Dependencies Status
- **Core Dependencies**: ✅ All installed and compatible
- **Dev Dependencies**: ⚠️ Some outdated (eslint-config packages)
- **Peer Dependencies**: ✅ All satisfied
- **Optional Dependencies**: ⚠️ Some peer dependency warnings during install

## Next Steps

### Immediate Priorities (Current Sprint - Sprint 2)
1. Complete Zod validation schemas for import formats
2. Implement error handling and user feedback in import flow
3. Add import history tracking and retry mechanism
4. Connect import service to dashboard for real-time updates
5. Implement actual persistence layer for import data
6. Complete duplicate detection and history logging

### Short-Term Goals (Next 2 Sprints)
1. Implement role-based access control for API routes and pages
2. Complete CRUD operations for operations, stores, and industries
3. Enhance dashboard with real-time data updates and filtering
4. Add comprehensive test suite for critical paths
5. Implement proper error boundaries and loading states
6. Conduct accessibility audit and fix issues
7. Optimize bundle size and implement code splitting
8. Begin integration with external services (starting with n8n workflows)

### Long-Term Vision
1. Deploy to staging environment with production-like configuration
2. Implement monitoring and alerting systems
3. Add multi-tenancy support for different clients/brands
4. Develop mobile companion app for field workers
5. Integrate with major ERP and CRM systems
6. Implement machine learning models for predictive analytics
7. Achieve SOC 2 Type II compliance for enterprise adoption

---
*Last updated: July 17, 2026*