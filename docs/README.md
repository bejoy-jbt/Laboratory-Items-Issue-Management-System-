# Laboratory Items Issue Management System - Documentation

## Quick Links

- [Project Source Documentation](./PROJECT_SOURCE_DOCUMENTATION.md) - Complete project documentation (Abstract, Goals, Requirements, ER Diagram)
- [BPMN Diagrams](./BPMN_DIAGRAMS.md) - Standard BPMN 2.0 business process diagrams
- [System Diagrams](./DIAGRAMS.md) - Complete system, user flow, and ER diagrams
- [API Documentation](./API.md) - Detailed API endpoint documentation
- [Setup Guide](../README.md) - Installation and setup instructions

## Documentation Files

### Project Source Documentation (`PROJECT_SOURCE_DOCUMENTATION.md`)
Complete project documentation including:
- Project Title and Abstract
- Project Goals and Success Criteria
- Project Flow Analysis
- ER Diagram with detailed schema
- Functional Requirements (10 modules)
- Non-Functional Requirements
- Existing System Analysis

### BPMN Diagrams
- **[BPMN_DIAGRAMS.md](./BPMN_DIAGRAMS.md)** - Standard BPMN 2.0 business process diagrams including:
  - Item Issuance Process (Lab Admin)
  - Item Issuance Process (User Self-Service)
  - Item Return Process
  - Overdue Item Notification Process
  - User Registration Process
  - Complete Item Lifecycle Process
  - Face Verification Sub-Process
  - Pool and Lane Diagrams
  - Error Handling Processes

- **[BPMN_COMPLETE_PROCESS.md](./BPMN_COMPLETE_PROCESS.md)** - Comprehensive BPMN diagram with Pools and Lanes (professional format):
  - Main Business Process with 3 Pools (User, Lab Admin, System)
  - Detailed Process Flow with all system services
  - Complete Item Lifecycle Process
  - Message flows between participants
  - Data stores and timer events
  - All lanes for system services

### System Diagrams (`DIAGRAMS.md`)
The `DIAGRAMS.md` file contains:

1. **System Architecture Diagram** - Overall system structure
2. **User Flow Diagrams** - For each role (Super Admin, Admin, Lab Admin, User)
3. **Entity Relationship Diagram (ERD)** - Database schema relationships
4. **Database Schema Details** - Detailed entity descriptions
5. **Role-Based Access Control Matrix** - Permissions table
6. **API Endpoints Flow** - All available endpoints
7. **Data Flow Diagram** - Request/response flow
8. **System Components Overview** - Component relationships
9. **Authentication & Authorization Flow** - Security flow
10. **Issue/Return Workflow** - State diagram for items

## Viewing Diagrams

### Option 1: GitHub
- Push to GitHub and view the markdown files
- GitHub automatically renders Mermaid diagrams

### Option 2: VS Code
- Install "Markdown Preview Mermaid Support" extension
- Open the markdown file and use preview

### Option 3: Online Editor
- Copy Mermaid code to https://mermaid.live
- View rendered diagrams

### Option 4: Documentation Tools
- Use tools like MkDocs, Docusaurus, or GitBook
- They support Mermaid rendering

## Key System Features

- **Multi-tenant Architecture** - Each lab has its own data
- **Role-Based Access** - 4 distinct roles with different permissions
- **JWT Authentication** - Secure token-based auth
- **MongoDB Database** - NoSQL database with Prisma ORM
- **RESTful API** - Clean API design
- **Responsive UI** - Modern React + Tailwind CSS interface

