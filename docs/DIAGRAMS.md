# Laboratory Items Issue Management System - Updated Diagrams

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        REACT[React Frontend<br/>Tailwind CSS]
    end
    
    subgraph "Application Layer"
        EXPRESS[Express.js Server<br/>REST API]
        AUTH[JWT Authentication<br/>Role-Based Access Control]
    end
    
    subgraph "Business Logic Layer"
        SA[Super Admin Routes]
        AD[Admin Routes]
        LA[Lab Admin Routes]
        UR[User Routes]
        AUTH_R[Auth Routes]
        EMAIL_SVC[Email Service<br/>Nodemailer]
        OVERDUE_SVC[Overdue Checker Service<br/>Cron Job]
    end
    
    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        MONGO[(MongoDB Database)]
        MONGOOSE[Mongoose<br/>Direct Operations]
    end
    
    subgraph "Database Collections"
        USERS[(Users)]
        LABS[(Labs)]
        ITEMS[(Items)]
        RECORDS[(Issue Records<br/>with estimated_return_time<br/>and notification_sent)]
    end
    
    subgraph "External Services"
        SMTP[SMTP Server<br/>Gmail/Email Provider]
    end
    
    WEB --> REACT
    REACT --> EXPRESS
    EXPRESS --> AUTH
    AUTH --> SA
    AUTH --> AD
    AUTH --> LA
    AUTH --> UR
    AUTH --> AUTH_R
    
    SA --> PRISMA
    AD --> PRISMA
    LA --> PRISMA
    UR --> PRISMA
    AUTH_R --> PRISMA
    
    SA --> MONGOOSE
    AD --> MONGOOSE
    LA --> MONGOOSE
    
    OVERDUE_SVC --> PRISMA
    OVERDUE_SVC --> MONGOOSE
    OVERDUE_SVC --> EMAIL_SVC
    EMAIL_SVC --> SMTP
    
    PRISMA --> MONGO
    MONGOOSE --> MONGO
    
    MONGO --> USERS
    MONGO --> LABS
    MONGO --> ITEMS
    MONGO --> RECORDS
```

## 2. User Flow Diagrams

### 2.1 Super Admin Flow

```mermaid
flowchart TD
    START([Super Admin Login]) --> DASH[Super Admin Dashboard]
    DASH --> CREATE_ADMIN[Create Admin]
    DASH --> CREATE_LAB[Create Lab]
    DASH --> ASSIGN[Assign Admin to Lab]
    DASH --> VIEW_ADMINS[View All Admins]
    DASH --> VIEW_LABS[View All Labs]
    DASH --> REPORTS[System Reports]
    
    CREATE_ADMIN --> FORM1[Fill Admin Details]
    FORM1 --> SUBMIT1[Submit]
    SUBMIT1 --> SUCCESS1[Admin Created]
    SUCCESS1 --> DASH
    
    CREATE_LAB --> FORM2[Fill Lab Details<br/>Select Admin]
    FORM2 --> SUBMIT2[Submit]
    SUBMIT2 --> SUCCESS2[Lab Created]
    SUCCESS2 --> DASH
    
    ASSIGN --> SELECT_LAB[Select Lab]
    SELECT_LAB --> SELECT_ADMIN[Select Admin]
    SELECT_ADMIN --> SUBMIT3[Submit]
    SUBMIT3 --> SUCCESS3[Admin Assigned]
    SUCCESS3 --> DASH
    
    VIEW_ADMINS --> EDIT_ADMIN[Edit Admin]
    VIEW_ADMINS --> DELETE_ADMIN[Delete Admin]
    EDIT_ADMIN --> FORM_EDIT_ADMIN[Update Admin Details<br/>Name, Email, Password]
    FORM_EDIT_ADMIN --> SUBMIT_EDIT_ADMIN[Submit]
    SUBMIT_EDIT_ADMIN --> SUCCESS_EDIT_ADMIN[Admin Updated]
    SUCCESS_EDIT_ADMIN --> DASH
    
    DELETE_ADMIN --> CONFIRM_DELETE_ADMIN[Confirm Deletion]
    CONFIRM_DELETE_ADMIN --> CHECK_ADMIN_LABS{Admin Assigned<br/>to Labs?}
    CHECK_ADMIN_LABS -->|Yes| ERROR_ADMIN[Error: Cannot Delete<br/>Reassign Labs First]
    CHECK_ADMIN_LABS -->|No| SUCCESS_DELETE_ADMIN[Admin Deleted]
    ERROR_ADMIN --> DASH
    SUCCESS_DELETE_ADMIN --> DASH
    
    VIEW_LABS --> EDIT_LAB[Edit Lab]
    VIEW_LABS --> DELETE_LAB[Delete Lab]
    EDIT_LAB --> FORM_EDIT_LAB[Update Lab Details<br/>Name, Department, Admin]
    FORM_EDIT_LAB --> SUBMIT_EDIT_LAB[Submit]
    SUBMIT_EDIT_LAB --> SUCCESS_EDIT_LAB[Lab Updated]
    SUCCESS_EDIT_LAB --> DASH
    
    DELETE_LAB --> CONFIRM_DELETE_LAB[Confirm Deletion]
    CONFIRM_DELETE_LAB --> CHECK_LAB_DATA{Lab Has Items<br/>Users, or Records?}
    CHECK_LAB_DATA -->|Yes| ERROR_LAB[Error: Cannot Delete<br/>Remove Related Data First]
    CHECK_LAB_DATA -->|No| SUCCESS_DELETE_LAB[Lab Deleted]
    ERROR_LAB --> DASH
    SUCCESS_DELETE_LAB --> DASH
    
    DASH --> CREATE_USER[Create User]
    CREATE_USER --> SELECT_LAB_USER[Select Lab]
    SELECT_LAB_USER --> FORM_USER[Fill User Details]
    FORM_USER --> SUBMIT_USER[Submit]
    SUBMIT_USER --> SUCCESS_USER[User Created]
    SUCCESS_USER --> DASH
    
    DASH --> VIEW_USERS[View All Users]
    VIEW_USERS --> USER_LIST[Display All Users<br/>with Lab & Admin Info]
    USER_LIST --> DASH
    
    DASH --> VIEW_ITEMS[View All Items]
    VIEW_ITEMS --> ITEM_LIST[Display All Items<br/>with Lab, Status,<br/>Filter by Status/Lab]
    ITEM_LIST --> DASH
    
    REPORTS --> SELECT_REPORT_TYPE{Select Report Type}
    SELECT_REPORT_TYPE -->|Overview| OVERVIEW_REPORT[System Overview<br/>All Admins, Labs, Users,<br/>Lab Admins, Items with States, Issues]
    SELECT_REPORT_TYPE -->|Admin| SELECT_ADMIN_REPORT[Select Admin]
    SELECT_REPORT_TYPE -->|Lab| SELECT_LAB_REPORT[Select Lab]
    
    SELECT_ADMIN_REPORT --> ADMIN_REPORT[Admin Report<br/>All Labs, Items, Users,<br/>Issue Records]
    SELECT_LAB_REPORT --> LAB_REPORT[Lab Report<br/>Items, Users, Lab Admins,<br/>Issue Records]
    
    OVERVIEW_REPORT --> DASH
    ADMIN_REPORT --> DASH
    LAB_REPORT --> DASH
```

### 2.2 Admin Flow

```mermaid
flowchart TD
    START([Admin Login]) --> DASH[Admin Dashboard]
    DASH --> VIEW_LABS[View My Labs]
    DASH --> CREATE_LA[Create Lab Admin]
    DASH --> VIEW_LA[View Lab Admins]
    DASH --> REPORTS[View Lab Reports]
    
    VIEW_LABS --> LAB_LIST[Display Labs<br/>with Stats]
    
    CREATE_LA --> SELECT_LAB[Select Lab]
    SELECT_LAB --> FORM[Fill Lab Admin Details]
    FORM --> SUBMIT[Submit]
    SUBMIT --> SUCCESS[Lab Admin Created]
    SUCCESS --> DASH
    
    DASH --> CREATE_USER[Create User]
    CREATE_USER --> SELECT_LAB_USER[Select Lab]
    SELECT_LAB_USER --> FORM_USER[Fill User Details]
    FORM_USER --> SUBMIT_USER[Submit]
    SUBMIT_USER --> SUCCESS_USER[User Created]
    SUCCESS_USER --> DASH
    
    VIEW_LA --> LA_LIST[Display All Lab Admins<br/>Created by Admin<br/>with Lab Information]
    LA_LIST --> EDIT_LA[Edit Lab Admin]
    LA_LIST --> DELETE_LA[Delete Lab Admin]
    EDIT_LA --> FORM_EDIT_LA[Update Lab Admin Details<br/>Name, Email, Lab, Password]
    FORM_EDIT_LA --> SUBMIT_EDIT_LA[Submit]
    SUBMIT_EDIT_LA --> SUCCESS_EDIT_LA[Lab Admin Updated]
    SUCCESS_EDIT_LA --> DASH
    DELETE_LA --> CONFIRM_DELETE_LA[Confirm Deletion]
    CONFIRM_DELETE_LA --> SUCCESS_DELETE_LA[Lab Admin Deleted]
    SUCCESS_DELETE_LA --> DASH
    
    DASH --> VIEW_USERS[View Users]
    VIEW_USERS --> USER_LIST[Display All Users<br/>Created by Admin<br/>with Lab Information]
    USER_LIST --> EDIT_USER[Edit User]
    USER_LIST --> DELETE_USER[Delete User]
    EDIT_USER --> FORM_EDIT_USER[Update User Details<br/>Name, Email, Lab, Password]
    FORM_EDIT_USER --> SUBMIT_EDIT_USER[Submit]
    SUBMIT_EDIT_USER --> SUCCESS_EDIT_USER[User Updated]
    SUCCESS_EDIT_USER --> DASH
    DELETE_USER --> CONFIRM_DELETE_USER[Confirm Deletion]
    CONFIRM_DELETE_USER --> CHECK_ACTIVE_ISSUES{User Has<br/>Active Issues?}
    CHECK_ACTIVE_ISSUES -->|Yes| ERROR_USER[Error: Cannot Delete<br/>Return Items First]
    CHECK_ACTIVE_ISSUES -->|No| SUCCESS_DELETE_USER[User Deleted]
    ERROR_USER --> DASH
    SUCCESS_DELETE_USER --> DASH
    
    REPORTS --> SELECT_LAB2[Select Lab]
    SELECT_LAB2 --> REPORT_DATA[View Statistics<br/>Items, Users, Issues]
```

### 2.3 Lab Admin Flow

```mermaid
flowchart TD
    START([Lab Admin Login]) --> DASH[Lab Admin Dashboard]
    DASH --> MANAGE_ITEMS[Manage Items]
    DASH --> VIEW_USERS[View Users<br/>Read-Only]
    DASH --> ISSUE[Issue Items]
    DASH --> HISTORY[Issue History]
    
    MANAGE_ITEMS --> ADD_ITEM[Add Item]
    MANAGE_ITEMS --> EDIT_ITEM[Edit Item]
    MANAGE_ITEMS --> DELETE_ITEM[Delete Item]
    
    VIEW_USERS --> USER_LIST[Display All Users<br/>in Lab<br/>View Only - No Edit/Delete]
    USER_LIST --> DASH
    
    ISSUE --> SELECT_ITEM[Select Item]
    SELECT_ITEM --> SELECT_USER[Select User from Dropdown]
    SELECT_USER --> SET_EST_RETURN[Set Estimated Return Time]
    SET_EST_RETURN --> SUBMIT_ISSUE[Issue Item]
    SUBMIT_ISSUE --> SUCCESS_ISSUE[Item Issued<br/>Record Created with<br/>estimated_return_time]
    SUCCESS_ISSUE --> DASH
    
    HISTORY --> VIEW_RECORDS[View All Records<br/>with Overdue Indicators]
    VIEW_RECORDS --> RETURN[Mark as Returned]
    RETURN --> UPDATE_STATUS[Update Item Status]
```

### 2.4 User Flow

```mermaid
flowchart TD
    START([User Login]) --> DASH[User Dashboard]
    DASH --> VIEW_ITEMS[View Available Items]
    DASH --> MY_ISSUED[My Issued Items]
    
    VIEW_ITEMS --> REQUEST[Request Item Issue]
    REQUEST --> NOTIFY[Notify Lab Admin]
    
    MY_ISSUED --> ACTIVE[Active Issues<br/>Shows Estimated Return Time<br/>Highlights Overdue Items]
    MY_ISSUED --> RETURNED[Returned Items]
    
    ACTIVE --> CHECK_OVERDUE{Item Overdue?}
    CHECK_OVERDUE -->|Yes| SHOW_OVERDUE[Display Overdue Warning<br/>Red Highlight]
    CHECK_OVERDUE -->|No| SHOW_NORMAL[Display Normal Status]
    
    SHOW_OVERDUE --> RETURN_ITEM[Return Item]
    SHOW_NORMAL --> RETURN_ITEM
    RETURN_ITEM --> CONFIRM[Confirm Return]
    CONFIRM --> UPDATE[Update Status]
    UPDATE --> SUCCESS[Item Returned]
    SUCCESS --> DASH
```

## 3. Entity Relationship Diagram (ERD) - Updated

```mermaid
erDiagram
    USER ||--o{ LAB : "manages_as_admin"
    USER ||--o{ LAB : "belongs_to"
    USER ||--o{ ISSUE_RECORD : "has"
    
    LAB ||--o{ USER : "has_users"
    LAB ||--o{ ITEM : "contains"
    LAB ||--o{ ISSUE_RECORD : "tracks"
    
    ITEM ||--o{ ISSUE_RECORD : "issued_in"
    ITEM }o--|| LAB : "belongs_to"
    
    ISSUE_RECORD }o--|| USER : "issued_to"
    ISSUE_RECORD }o--|| ITEM : "for_item"
    ISSUE_RECORD }o--|| LAB : "in_lab"
    
    USER {
        string id PK
        string name
        string email UK
        string password
        enum role "SUPER_ADMIN, ADMIN, LAB_ADMIN, USER"
        string lab_id FK "nullable"
        datetime created_at
        datetime updated_at
    }
    
    LAB {
        string id PK
        string name
        string department
        string emp_id FK "Admin user ID"
        datetime created_at
        datetime updated_at
    }
    
    ITEM {
        string id PK
        string name
        string category
        enum status "AVAILABLE, ISSUED, MAINTENANCE"
        string lab_id FK
        string description "nullable"
        datetime created_at
        datetime updated_at
    }
    
    ISSUE_RECORD {
        string id PK
        string user_id FK
        string item_id FK
        string lab_id FK
        datetime issue_time
        datetime estimated_return_time "nullable - NEW"
        datetime return_time "nullable"
        boolean notification_sent "default false - NEW"
        datetime created_at
        datetime updated_at
    }
```

## 4. Database Schema Details - Updated

### User Entity
- **id**: Primary Key (ObjectId)
- **name**: String
- **email**: String (Unique)
- **password**: String (Hashed with bcrypt)
- **role**: Enum (SUPER_ADMIN, ADMIN, LAB_ADMIN, USER)
- **lab_id**: Foreign Key to Lab (Optional - for LAB_ADMIN and USER)
- **created_at**: DateTime
- **updated_at**: DateTime

### Lab Entity
- **id**: Primary Key (ObjectId)
- **name**: String
- **department**: String
- **emp_id**: Foreign Key to User (Admin who manages this lab)
- **created_at**: DateTime
- **updated_at**: DateTime

### Item Entity
- **id**: Primary Key (ObjectId)
- **name**: String
- **category**: String
- **status**: Enum (AVAILABLE, ISSUED, MAINTENANCE)
- **lab_id**: Foreign Key to Lab
- **description**: String (Optional)
- **created_at**: DateTime
- **updated_at**: DateTime

### IssueRecord Entity - Updated
- **id**: Primary Key (ObjectId)
- **user_id**: Foreign Key to User
- **item_id**: Foreign Key to Item
- **lab_id**: Foreign Key to Lab
- **issue_time**: DateTime
- **estimated_return_time**: DateTime (Optional) - **NEW FIELD**
- **return_time**: DateTime (Optional)
- **notification_sent**: Boolean (Default: false) - **NEW FIELD**
- **created_at**: DateTime
- **updated_at**: DateTime

## 5. Role-Based Access Control Matrix - Updated

| Feature | Super Admin | Admin | Lab Admin | User |
|---------|------------|-------|-----------|------|
| Create Admin | ✅ | ❌ | ❌ | ❌ |
| Edit Admin | ✅ | ❌ | ❌ | ❌ |
| Delete Admin | ✅ | ❌ | ❌ | ❌ |
| Create Lab | ✅ | ❌ | ❌ | ❌ |
| Edit Lab | ✅ | ❌ | ❌ | ❌ |
| Delete Lab | ✅ | ❌ | ❌ | ❌ |
| Create User | ✅ | ✅ | ❌ | ❌ |
| Assign Admin to Lab | ✅ | ❌ | ❌ | ❌ |
| View All Admins | ✅ | ❌ | ❌ | ❌ |
| View All Labs | ✅ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ✅ | ❌ |
| View All Items | ✅ | ❌ | ❌ | ❌ |
| System Reports | ✅ | ❌ | ❌ | ❌ |
| View My Labs | ❌ | ✅ | ❌ | ❌ |
| Create Lab Admin | ❌ | ✅ | ❌ | ❌ |
| Edit Lab Admin | ❌ | ✅ | ❌ | ❌ |
| Delete Lab Admin | ❌ | ✅ | ❌ | ❌ |
| View Lab Admins | ❌ | ✅ | ❌ | ❌ |
| Create User | ❌ | ✅ | ❌ | ❌ |
| Edit User | ❌ | ✅ | ❌ | ❌ |
| Delete User | ❌ | ✅ | ❌ | ❌ |
| View Users | ❌ | ✅ | ✅ | ❌ |
| View Lab Reports | ❌ | ✅ | ❌ | ❌ |
| Manage Items | ❌ | ❌ | ✅ | ❌ |
| Issue Items (with Estimated Return Time) | ❌ | ❌ | ✅ | ❌ |
| View Issue History | ❌ | ❌ | ✅ | ❌ |
| View Available Items | ❌ | ❌ | ❌ | ✅ |
| Request Item Issue | ❌ | ❌ | ❌ | ✅ |
| View My Issued Items (with Overdue Status) | ❌ | ❌ | ❌ | ✅ |
| Return Item | ❌ | ❌ | ✅ | ✅ |
| Receive Overdue Email Notifications | ❌ | ❌ | ❌ | ✅ |
| Receive Overdue Alert Emails | ❌ | ❌ | ✅ | ❌ |

## 6. API Endpoints Flow - Updated

```mermaid
graph LR
    subgraph "Authentication"
        LOGIN[POST /api/auth/login]
        ME[GET /api/auth/me]
    end
    
    subgraph "Super Admin"
        SA1[POST /api/super-admin/create-admin]
        SA2[POST /api/super-admin/create-lab]
        SA3[PUT /api/super-admin/assign-admin/:labId]
        SA4[GET /api/super-admin/admins]
        SA5[GET /api/super-admin/labs]
        SA6[PUT /api/super-admin/edit-admin/:adminId]
        SA7[DELETE /api/super-admin/delete-admin/:adminId]
        SA8[PUT /api/super-admin/edit-lab/:labId]
        SA9[DELETE /api/super-admin/delete-lab/:labId]
        SA10[GET /api/super-admin/users]
        SA11[POST /api/super-admin/create-user]
        SA12[GET /api/super-admin/items]
        SA13[GET /api/super-admin/reports<br/>?adminId=xxx or ?labId=xxx]
    end
    
    subgraph "Admin"
        AD1[GET /api/admin/labs]
        AD2[POST /api/admin/create-lab-admin]
        AD3[POST /api/admin/create-user]
        AD4[GET /api/admin/users]
        AD5[PUT /api/admin/edit-user/:userId]
        AD6[DELETE /api/admin/delete-user/:userId]
        AD7[GET /api/admin/lab-admins]
        AD8[GET /api/admin/lab-admins/:labId]
        AD9[PUT /api/admin/edit-lab-admin/:labAdminId]
        AD10[DELETE /api/admin/delete-lab-admin/:labAdminId]
        AD11[GET /api/admin/reports/:labId]
    end
    
    subgraph "Lab Admin"
        LA1[GET /api/lab-admin/items]
        LA2[POST /api/lab-admin/items]
        LA3[PUT /api/lab-admin/items/:itemId]
        LA4[DELETE /api/lab-admin/items/:itemId]
        LA5[GET /api/lab-admin/users]
        LA6[POST /api/lab-admin/issue<br/>with estimatedReturnTime]
        LA7[POST /api/lab-admin/return/:issueRecordId]
        LA8[GET /api/lab-admin/issue-history]
        LA9[GET /api/lab-admin/stats]
    end
    
    subgraph "User"
        U1[GET /api/user/items]
        U2[POST /api/user/request-issue/:itemId]
        U3[GET /api/user/issued-items]
        U4[POST /api/user/return/:issueRecordId]
        U5[GET /api/user/stats]
    end
    
    subgraph "System Services"
        OVERDUE_CHECK[POST /api/admin/check-overdue<br/>Manual Trigger]
        TEST_EMAIL[POST /api/admin/test-email<br/>Test Email Service]
    end
```

## 7. Email Notification System Flow

```mermaid
sequenceDiagram
    participant CRON as Cron Job<br/>(Every Hour)
    participant OC as Overdue Checker Service
    participant DB as MongoDB Database
    participant ES as Email Service
    participant SMTP as SMTP Server
    participant USER as User Email
    participant ADMIN as Lab Admin Email
    
    CRON->>OC: Trigger Check (Hourly)
    OC->>DB: Query Overdue Items<br/>(estimated_return_time < now<br/>AND return_time = null<br/>AND notification_sent = false)
    DB-->>OC: Return Overdue Records
    
    loop For Each Overdue Record
        OC->>DB: Fetch User Details
        OC->>DB: Fetch Lab Admin Details
        OC->>ES: Send Notification Request
        
        ES->>SMTP: Send Email to User
        SMTP-->>USER: Overdue Item Notification
        
        ES->>SMTP: Send Email to Lab Admin
        SMTP-->>ADMIN: Overdue Item Alert
        
        ES-->>OC: Email Sent Successfully
        OC->>DB: Update notification_sent = true
    end
```

## 8. Overdue Item Detection & Notification Workflow

```mermaid
flowchart TD
    START([System Startup / Hourly Cron]) --> CHECK[Check Overdue Items]
    CHECK --> QUERY[Query Database:<br/>- returnTime = null<br/>- estimatedReturnTime < now<br/>- notificationSent = false]
    
    QUERY --> FOUND{Found<br/>Overdue Items?}
    FOUND -->|No| END([No Action Needed])
    FOUND -->|Yes| LOOP[For Each Overdue Item]
    
    LOOP --> GET_USER[Get User Details<br/>from Database]
    GET_USER --> GET_ADMIN[Get Lab Admin Details<br/>from Database]
    GET_ADMIN --> VALIDATE{User & Admin<br/>Emails Valid?}
    
    VALIDATE -->|No| SKIP[Skip Item<br/>Log Warning]
    VALIDATE -->|Yes| SEND_USER[Send Email to User]
    
    SEND_USER --> SEND_ADMIN[Send Email to Lab Admin]
    SEND_ADMIN --> SUCCESS{Emails<br/>Sent Successfully?}
    
    SUCCESS -->|Yes| UPDATE[Update Database:<br/>notification_sent = true]
    SUCCESS -->|No| LOG_ERROR[Log Error<br/>Keep notification_sent = false]
    
    UPDATE --> NEXT{More Items?}
    LOG_ERROR --> NEXT
    SKIP --> NEXT
    NEXT -->|Yes| LOOP
    NEXT -->|No| END
```

## 9. Issue Item Flow with Estimated Return Time

```mermaid
sequenceDiagram
    participant LA as Lab Admin
    participant FE as Frontend
    participant API as API Server
    participant DB as Database
    participant OC as Overdue Checker
    
    LA->>FE: Select Item & User<br/>Set Estimated Return Time
    FE->>API: POST /api/lab-admin/issue<br/>{itemId, userId, estimatedReturnTime}
    API->>DB: Create Issue Record<br/>(with estimated_return_time)
    API->>DB: Update Item Status = ISSUED
    DB-->>API: Success
    API-->>FE: Item Issued Successfully
    FE-->>LA: Confirmation
    
    Note over OC: Cron Job Runs Every Hour
    OC->>DB: Check for Overdue Items
    DB-->>OC: Found Overdue Item
    OC->>OC: Send Email Notifications
    OC->>DB: Mark notification_sent = true
```

## 10. Data Flow Diagram - Updated

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant M as Middleware
    participant D as Database
    participant E as Email Service
    participant C as Cron Job
    
    U->>F: Login Request
    F->>A: POST /api/auth/login
    A->>D: Verify Credentials
    D-->>A: User Data
    A->>A: Generate JWT Token
    A-->>F: Token + User Data
    F-->>U: Redirect to Dashboard
    
    U->>F: Issue Item with Estimated Return Time
    F->>A: API Request + Token<br/>{itemId, userId, estimatedReturnTime}
    A->>M: Authenticate Token
    M->>M: Verify Role (LAB_ADMIN)
    M-->>A: Authorized
    A->>D: Create Issue Record<br/>(with estimated_return_time)
    A->>D: Update Item Status
    D-->>A: Success
    A-->>F: Response
    F-->>U: Item Issued
    
    Note over C: Every Hour
    C->>D: Query Overdue Items
    D-->>C: Overdue Records
    C->>E: Send Email Notifications
    E->>E: Send to User & Lab Admin
    E-->>C: Success
    C->>D: Update notification_sent
```

## 11. System Components Overview - Updated

```mermaid
graph TB
    subgraph "Frontend Components"
        LOGIN_PAGE[Login Page]
        DASHBOARDS[Dashboards<br/>Role-Based]
        FORMS[Forms<br/>Create/Edit<br/>with DateTime Picker]
        TABLES[Tables<br/>Data Display<br/>with Overdue Indicators]
        SIDEBAR[Sidebar Navigation]
    end
    
    subgraph "Backend Services"
        AUTH_SERVICE[Authentication Service]
        RBAC_SERVICE[Role-Based Access Control]
        USER_SERVICE[User Management]
        LAB_SERVICE[Lab Management]
        ITEM_SERVICE[Item Management]
        ISSUE_SERVICE[Issue Management]
        EMAIL_SERVICE[Email Service<br/>Nodemailer]
        OVERDUE_SERVICE[Overdue Checker Service<br/>Cron Job]
    end
    
    subgraph "Middleware"
        AUTH_MW[Authentication Middleware]
        AUTHORIZE_MW[Authorization Middleware]
        ERROR_MW[Error Handling]
    end
    
    subgraph "Database"
        MONGO[(MongoDB)]
        PRISMA_CLIENT[Prisma Client]
        MONGOOSE[Direct MongoDB Access]
    end
    
    subgraph "External"
        SMTP_SERVER[SMTP Server<br/>Gmail/Email Provider]
    end
    
    LOGIN_PAGE --> AUTH_SERVICE
    DASHBOARDS --> USER_SERVICE
    DASHBOARDS --> LAB_SERVICE
    DASHBOARDS --> ITEM_SERVICE
    DASHBOARDS --> ISSUE_SERVICE
    FORMS --> USER_SERVICE
    FORMS --> LAB_SERVICE
    FORMS --> ITEM_SERVICE
    FORMS --> ISSUE_SERVICE
    
    AUTH_SERVICE --> AUTH_MW
    USER_SERVICE --> AUTHORIZE_MW
    LAB_SERVICE --> AUTHORIZE_MW
    ITEM_SERVICE --> AUTHORIZE_MW
    ISSUE_SERVICE --> AUTHORIZE_MW
    
    AUTH_MW --> RBAC_SERVICE
    AUTHORIZE_MW --> RBAC_SERVICE
    
    USER_SERVICE --> PRISMA_CLIENT
    LAB_SERVICE --> PRISMA_CLIENT
    ITEM_SERVICE --> PRISMA_CLIENT
    ISSUE_SERVICE --> PRISMA_CLIENT
    OVERDUE_SERVICE --> PRISMA_CLIENT
    
    USER_SERVICE --> MONGOOSE
    LAB_SERVICE --> MONGOOSE
    ITEM_SERVICE --> MONGOOSE
    ISSUE_SERVICE --> MONGOOSE
    OVERDUE_SERVICE --> MONGOOSE
    
    OVERDUE_SERVICE --> EMAIL_SERVICE
    EMAIL_SERVICE --> SMTP_SERVER
    
    PRISMA_CLIENT --> MONGO
    MONGOOSE --> MONGO
```

## 12. Authentication & Authorization Flow

```mermaid
flowchart TD
    START([User Request]) --> CHECK_TOKEN{Token Present?}
    CHECK_TOKEN -->|No| REJECT[401 Unauthorized]
    CHECK_TOKEN -->|Yes| VERIFY[Verify JWT Token]
    VERIFY --> VALID{Token Valid?}
    VALID -->|No| REJECT
    VALID -->|Yes| FETCH_USER[Fetch User from DB]
    FETCH_USER --> CHECK_ROLE{Check User Role}
    CHECK_ROLE --> SUPER_ADMIN{Super Admin?}
    CHECK_ROLE --> ADMIN{Admin?}
    CHECK_ROLE --> LAB_ADMIN{Lab Admin?}
    CHECK_ROLE --> USER{User?}
    
    SUPER_ADMIN -->|Yes| ALLOW_SA[Allow Super Admin Routes]
    ADMIN -->|Yes| ALLOW_AD[Allow Admin Routes]
    LAB_ADMIN -->|Yes| ALLOW_LA[Allow Lab Admin Routes]
    USER -->|Yes| ALLOW_U[Allow User Routes]
    
    SUPER_ADMIN -->|No| CHECK_NEXT1{Next Role?}
    ADMIN -->|No| CHECK_NEXT2{Next Role?}
    LAB_ADMIN -->|No| CHECK_NEXT3{Next Role?}
    USER -->|No| FORBIDDEN[403 Forbidden]
    
    ALLOW_SA --> PROCESS[Process Request]
    ALLOW_AD --> PROCESS
    ALLOW_LA --> PROCESS
    ALLOW_U --> PROCESS
```

## 13. Issue/Return Workflow with Overdue Tracking

```mermaid
stateDiagram-v2
    [*] --> Available: Item Created
    
    Available --> Issued: Lab Admin Issues Item<br/>Sets estimated_return_time
    Issued --> Overdue: estimated_return_time Passed<br/>notification_sent = false
    Overdue --> Overdue: Email Sent<br/>notification_sent = true
    Overdue --> Available: User/Lab Admin Returns Item
    Issued --> Available: User/Lab Admin Returns Item<br/>(Before Due Date)
    Available --> Maintenance: Lab Admin Sets Maintenance
    Maintenance --> Available: Lab Admin Sets Available
    
    note right of Available
        Item can be issued
        to users
    end note
    
    note right of Issued
        Item is with user
        estimated_return_time set
        System monitors for overdue
    end note
    
    note right of Overdue
        Item exceeded
        estimated return time
        Email notifications sent
        to user and lab admin
    end note
    
    note right of Maintenance
        Item is being
        repaired/maintained
    end note
```

## 14. Complete System Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React Frontend<br/>- Login<br/>- Dashboards<br/>- Forms<br/>- Tables<br/>- Overdue Indicators]
    end
    
    subgraph "API Layer"
        REST[Express REST API<br/>- Authentication<br/>- Role-Based Routes<br/>- CRUD Operations]
    end
    
    subgraph "Business Logic Layer"
        BL1[User Management]
        BL2[Lab Management]
        BL3[Item Management]
        BL4[Issue Management]
        BL5[Email Notification]
        BL6[Overdue Monitoring]
    end
    
    subgraph "Data Persistence Layer"
        DB[(MongoDB<br/>- Users<br/>- Labs<br/>- Items<br/>- Issue Records)]
    end
    
    subgraph "Background Services"
        CRON[Cron Job<br/>Runs Every Hour]
        EMAIL[Email Service<br/>Nodemailer]
    end
    
    subgraph "External Services"
        SMTP[SMTP Server<br/>Email Delivery]
    end
    
    UI --> REST
    REST --> BL1
    REST --> BL2
    REST --> BL3
    REST --> BL4
    
    BL1 --> DB
    BL2 --> DB
    BL3 --> DB
    BL4 --> DB
    
    CRON --> BL6
    BL6 --> DB
    BL6 --> BL5
    BL5 --> EMAIL
    EMAIL --> SMTP
    
    BL4 --> BL5
```

## 15. Project Flow Diagram

```mermaid
flowchart TD
    START([Project Start]) --> INIT[System Initialization]
    
    INIT --> SETUP_DB[Setup MongoDB Database]
    SETUP_DB --> SETUP_PRISMA[Configure Prisma Schema]
    SETUP_PRISMA --> SEED[Seed Initial Data<br/>Super Admin Account]
    
    SEED --> DEPLOY[Deploy Application]
    DEPLOY --> READY[System Ready]
    
    READY --> LOGIN_PAGE[Login Page]
    LOGIN_PAGE --> AUTH_CHECK{Authentication<br/>Success?}
    
    AUTH_CHECK -->|No| LOGIN_PAGE
    AUTH_CHECK -->|Yes| ROLE_CHECK{User Role?}
    
    ROLE_CHECK -->|SUPER_ADMIN| SA_FLOW[Super Admin Flow]
    ROLE_CHECK -->|ADMIN| AD_FLOW[Admin Flow]
    ROLE_CHECK -->|LAB_ADMIN| LA_FLOW[Lab Admin Flow]
    ROLE_CHECK -->|USER| U_FLOW[User Flow]
    
    subgraph "Super Admin Flow"
        SA_FLOW --> SA_DASH[Super Admin Dashboard]
        SA_DASH --> SA_CREATE_ADMIN[Create Admin Account]
        SA_DASH --> SA_CREATE_LAB[Create Laboratory]
        SA_DASH --> SA_ASSIGN[Assign Admin to Lab]
        SA_DASH --> SA_VIEW[View Admins & Labs]
        
        SA_CREATE_ADMIN --> SA_DASH
        SA_CREATE_LAB --> SA_DASH
        SA_ASSIGN --> SA_DASH
        
        SA_VIEW --> SA_EDIT_ADMIN[Edit Admin]
        SA_VIEW --> SA_DELETE_ADMIN[Delete Admin]
        SA_VIEW --> SA_EDIT_LAB[Edit Lab]
        SA_VIEW --> SA_DELETE_LAB[Delete Lab]
        
        SA_EDIT_ADMIN --> SA_DASH
        SA_DELETE_ADMIN --> SA_DASH
        SA_EDIT_LAB --> SA_DASH
        SA_DELETE_LAB --> SA_DASH
        
        SA_DASH --> SA_CREATE_USER[Create User]
        SA_DASH --> SA_VIEW_USERS[View All Users]
        SA_DASH --> SA_VIEW_ITEMS[View All Items<br/>with Status & Lab Info]
        SA_DASH --> SA_REPORTS[System Reports]
        
        SA_CREATE_USER --> SA_DASH
        SA_VIEW_USERS --> SA_DASH
        SA_VIEW_ITEMS --> SA_DASH
        
        SA_REPORTS --> SA_OVERVIEW[System Overview<br/>All Admins, Labs, Users,<br/>Lab Admins, Items with States, Issues]
        SA_REPORTS --> SA_ADMIN_REPORT[Admin Report]
        SA_REPORTS --> SA_LAB_REPORT[Lab Report]
        SA_OVERVIEW --> SA_DASH
        SA_ADMIN_REPORT --> SA_DASH
        SA_LAB_REPORT --> SA_DASH
    end
    
    subgraph "Admin Flow"
        AD_FLOW --> AD_DASH[Admin Dashboard]
        AD_DASH --> AD_VIEW_LABS[View My Labs]
        AD_DASH --> AD_CREATE_LA[Create Lab Admin]
        AD_DASH --> AD_CREATE_USER[Create User]
        AD_DASH --> AD_VIEW_USERS[View Users]
        AD_DASH --> AD_VIEW_LA[View Lab Admins]
        AD_DASH --> AD_REPORTS[View Lab Reports]
        
        AD_VIEW_LABS --> AD_DASH
        AD_CREATE_LA --> AD_DASH
        AD_CREATE_USER --> AD_DASH
        
        AD_VIEW_USERS --> AD_EDIT_USER[Edit User]
        AD_VIEW_USERS --> AD_DELETE_USER[Delete User]
        AD_EDIT_USER --> AD_DASH
        AD_DELETE_USER --> AD_DASH
        
        AD_VIEW_LA --> AD_EDIT_LA[Edit Lab Admin]
        AD_VIEW_LA --> AD_DELETE_LA[Delete Lab Admin]
        AD_EDIT_LA --> AD_DASH
        AD_DELETE_LA --> AD_DASH
        
        AD_REPORTS --> AD_DASH
    end
    
    subgraph "Lab Admin Flow"
        LA_FLOW --> LA_DASH[Lab Admin Dashboard]
        LA_DASH --> LA_MANAGE_ITEMS[Manage Items<br/>Add/Edit/Delete]
        LA_DASH --> LA_VIEW_USERS[View Users<br/>Read-Only]
        LA_DASH --> LA_ISSUE[Issue Items to Users<br/>Set Estimated Return Time]
        LA_DASH --> LA_HISTORY[View Issue History<br/>Mark Returns]
        
        LA_MANAGE_ITEMS --> LA_DASH
        LA_VIEW_USERS --> LA_DASH
        
        LA_ISSUE --> LA_DASH
        LA_HISTORY --> LA_DASH
    end
    
    subgraph "User Flow"
        U_FLOW --> U_DASH[User Dashboard]
        U_DASH --> U_VIEW_ITEMS[View Available Items]
        U_DASH --> U_MY_ITEMS[My Issued Items<br/>Check Overdue Status]
        
        U_VIEW_ITEMS --> U_REQUEST[Request Item Issue]
        U_REQUEST --> U_DASH
        
        U_MY_ITEMS --> U_CHECK_OVERDUE{Item Overdue?}
        U_CHECK_OVERDUE -->|Yes| U_OVERDUE_WARNING[Display Overdue Warning]
        U_CHECK_OVERDUE -->|No| U_NORMAL[Display Normal Status]
        
        U_OVERDUE_WARNING --> U_RETURN[Return Item]
        U_NORMAL --> U_RETURN
        U_RETURN --> U_DASH
    end
    
    subgraph "Background Processes"
        CRON_START([System Startup]) --> CRON_INIT[Initialize Cron Job]
        CRON_INIT --> CRON_SCHEDULE[Schedule Hourly Check]
        CRON_SCHEDULE --> CRON_LOOP[Every Hour]
        
        CRON_LOOP --> CHECK_OVERDUE[Check Overdue Items]
        CHECK_OVERDUE --> QUERY_DB[Query Database<br/>for Overdue Records]
        QUERY_DB --> FOUND_OVERDUE{Found<br/>Overdue Items?}
        
        FOUND_OVERDUE -->|No| CRON_LOOP
        FOUND_OVERDUE -->|Yes| SEND_EMAILS[Send Email Notifications<br/>to User & Lab Admin]
        SEND_EMAILS --> UPDATE_FLAG[Update notification_sent = true]
        UPDATE_FLAG --> CRON_LOOP
    end
    
    LA_ISSUE --> CREATE_RECORD[Create Issue Record<br/>with estimated_return_time]
    CREATE_RECORD --> UPDATE_ITEM_STATUS[Update Item Status = ISSUED]
    UPDATE_ITEM_STATUS --> MONITOR[System Monitors for Overdue]
    
    MONITOR --> CHECK_OVERDUE
    
    U_RETURN --> RETURN_PROCESS[Return Process]
    LA_HISTORY --> RETURN_PROCESS
    RETURN_PROCESS --> UPDATE_RETURN_TIME[Update return_time in Record]
    UPDATE_RETURN_TIME --> UPDATE_ITEM_AVAILABLE[Update Item Status = AVAILABLE]
    UPDATE_ITEM_AVAILABLE --> U_DASH
    UPDATE_ITEM_AVAILABLE --> LA_DASH
    
    style START fill:#e1f5ff
    style READY fill:#c8e6c9
    style SA_FLOW fill:#fff9c4
    style AD_FLOW fill:#e1bee7
    style LA_FLOW fill:#b3e5fc
    style U_FLOW fill:#c5e1a5
    style CRON_START fill:#ffccbc
    style MONITOR fill:#f8bbd0
```

---

## Notes

- All diagrams use Mermaid syntax and can be rendered in:
  - GitHub Markdown
  - VS Code with Mermaid extension
  - Online Mermaid editors (mermaid.live)
  - Documentation tools that support Mermaid

### Key Updates in This Version:

1. **Email Notification System**: Added email service and SMTP integration
2. **Overdue Checker Service**: Added cron job for automatic overdue detection
3. **Estimated Return Time**: New field in IssueRecord for tracking expected return dates
4. **Notification Tracking**: `notification_sent` field to prevent duplicate emails
5. **Updated User Flows**: Include estimated return time setting and overdue indicators
6. **Updated ERD**: Includes new fields (`estimated_return_time`, `notification_sent`)
7. **New API Endpoints**: Manual trigger for overdue check and test email endpoint

### System Features:

- **MongoDB** with Prisma ORM for most operations
- **Direct MongoDB operations** (via Mongoose) for create/update to avoid transaction requirements
- **JWT tokens** for authentication with 7-day expiration
- **Role-based access control** enforced at middleware level
- **Automatic overdue detection** via cron job (runs every hour)
- **Email notifications** sent to both users and lab admins for overdue items
- **Data consistency checks** and automatic fixes in overdue checker
