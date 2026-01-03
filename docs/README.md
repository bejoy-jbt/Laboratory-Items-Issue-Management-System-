# Laboratory Items Issue Management System - Documentation

## Quick Links

- [System Diagrams](./DIAGRAMS.md) - Complete system, user flow, and ER diagrams
- [API Documentation](./API.md) - Detailed API endpoint documentation
- [Setup Guide](../README.md) - Installation and setup instructions

## Diagram Files

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

