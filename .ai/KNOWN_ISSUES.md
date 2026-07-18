# Known Issues - MK9 Analytics

## Overview
This document lists known issues in the MK9 Analytics project that are tracked but not yet resolved.

## Current Known Issues

### 1. Authentication System Not Implemented
- **Description**: The application currently lacks an authentication system, meaning all routes are accessible without login.
- **Impact**: Security risk; anyone can access and modify data.
- **Workaround**: None; authentication must be implemented.
- **Status**: Planned for Sprint 2.
- **Related Files**: 
  - `src/app/api/` (routes need protection)
  - `src/modules/shared/` (auth context/hooks needed)

### 2. Import Processing Backend Not Implemented
- **Description**: The import module has a UI for file upload but lacks backend processing (parsing, validation, persistence).
- **Impact**: Users cannot actually import data; the feature is incomplete.
- **Workaround**: None; backend implementation required.
- **Status**: Planned for Sprint 2.
- **Related Files**: 
  - `src/modules/imports/` (services, repositories, schemas)

### 3. Incomplete API Routes
- **Description**: Only promoter and generic ID API routes are implemented; other entities (operations, stores, industries, visits) lack endpoints.
- **Impact**: Frontend cannot perform CRUD operations on core entities.
- **Workaround**: None; missing API routes must be created.
- **Status**: Planned for Sprint 2.
- **Related Files**: 
  - `src/app/api/` (missing route files)

### 4. No Automated Test Suite
- **Description**: The project lacks unit, integration, and end-to-end tests.
- **Impact**: Risk of regressions; no automated verification of functionality.
- **Workaround**: Manual testing only.
- **Status**: Planned for Sprint 2.
- **Related Files**: 
  - Test files to be created in `__tests__` or alongside source files.

### 5. Database Seed Data Limited
- **Description**: The seed script exists but may not contain comprehensive test data for development and testing.
- **Impact**: Development and testing may lack realistic data scenarios.
- **Workaround**: Manually insert data or enhance seed script.
- **Status**: Ongoing improvement.
- **Related Files**: 
  - `prisma/seed.ts`

### 6. Placeholder Dashboard Data
- **Description**: The dashboard currently uses placeholder/mock data instead of real data from the database.
- **Impact**: Dashboard does not reflect actual system state.
- **Workaround**: Implement data fetching services and connect to real data.
- **Status**: Partially implemented; needs completion.
- **Related Files**: 
  - `src/modules/dashboard/services/`
  - `src/modules/dashboard/hooks/`

### 7. Responsive Design Issues
- **Description**: Some UI components may not be fully responsive or may break on certain screen sizes.
- **Impact**: Poor user experience on mobile or tablet devices.
- **Workaround**: Test and adjust responsive styles.
- **Status**: Ongoing.
- **Related Files**: 
  - Component CSS/Tailwind classes

### 8. Accessibility Gaps
- **Description**: Some UI components may not fully comply with accessibility standards (WCAG).
- **Impact**: Inaccessible to users with disabilities.
- **Workaround**: Audit and fix accessibility issues.
- **Status**: To be addressed.
- **Related Files**: 
  - All UI components

### 9. Error Handling Inconsistencies
- **Description**: Error handling varies across the application; some errors are not properly caught or displayed.
- **Impact**: Poor user experience; difficulty debugging.
- **Workaround**: Standardize error handling patterns.
- **Status**: Ongoing improvement.
- **Related Files**: 
  - Services, API routes, components

### 10. Performance Optimization Needed
- **Description**: Some database queries and UI renders may not be optimized for performance.
- **Impact**: Slow response times as data grows.
- **Workaround**: Profile and optimize queries and components.
- **Status**: To be addressed in later sprints.
- **Related Files**: 
  - Service methods, database queries, component rendering

## Resolved Issues
None documented yet (this is the initial release).

## How to Report New Issues
Please report new issues through the project's issue tracking system (e.g., GitHub Issues) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or logs if applicable
- Any relevant context (browser, device, etc.)

CSV source row tracking:
Linhas vazias intermediárias são removidas antes da normalização, podendo deslocar a numeração física dos registros posteriores.
Impacto: somente mensagens de erro em CSVs com linhas vazias.
Prioridade: baixa.

-- 
*Last updated: July 18, 2026*