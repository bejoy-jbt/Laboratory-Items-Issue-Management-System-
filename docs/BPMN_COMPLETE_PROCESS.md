# Complete BPMN Process Diagram
## Laboratory Items Issue Management System - Main Business Process

This document contains a comprehensive BPMN 2.0 diagram showing the complete business process for the Laboratory Items Issue Management System, using pools and lanes similar to professional BPMN modeling tools.

---

## Main Business Process: Item Issuance and Management

This diagram shows the complete workflow with three main participants (pools) and their internal processes (lanes).

```mermaid
flowchart TB
    subgraph Pool1["Pool: User"]
        direction TB
        U_Start([Start Event:<br/>📧 Item Issue Request]) --> U_ViewItems[Task:<br/>View Available Items]
        U_ViewItems --> U_SelectItem[Task:<br/>Select Item]
        U_SelectItem --> U_SetReturnTime[Task:<br/>Set Estimated Return Time]
        U_SetReturnTime --> U_InitFaceScan[Task:<br/>Initiate Face Verification]
        U_InitFaceScan --> U_PositionFace[Task:<br/>Position Face in Camera]
        U_PositionFace --> U_WaitResult{Intermediate Event:<br/>⏳ Waiting for Verification}
        U_WaitResult --> U_ReceiveResult{Exclusive Gateway:<br/>Verification Result?}
        U_ReceiveResult -->|Success| U_ReceiveConfirmation[Task:<br/>Receive Confirmation]
        U_ReceiveResult -->|Failure| U_ReceiveError[Task:<br/>Receive Error Message]
        U_ReceiveConfirmation --> U_EndSuccess([End Event:<br/>✅ Item Issued])
        U_ReceiveError --> U_EndError([End Event:<br/>❌ Issue Failed])
        
        U_ReturnStart([Start Event:<br/>📦 Return Request]) --> U_ViewIssued[Task:<br/>View My Issued Items]
        U_ViewIssued --> U_SelectReturn[Task:<br/>Select Item to Return]
        U_SelectReturn --> U_ConfirmReturn[Task:<br/>Confirm Return]
        U_ConfirmReturn --> U_ReturnEnd([End Event:<br/>✅ Item Returned])
    end
    
    subgraph Pool2["Pool: Lab Admin"]
        direction TB
        LA_Start([Start Event:<br/>📋 Issue Item Request]) --> LA_SelectUser[Task:<br/>Select User]
        LA_SelectUser --> LA_SelectItem[Task:<br/>Select Item]
        LA_SelectItem --> LA_SetReturnTime[Task:<br/>Set Estimated Return Time]
        LA_SetReturnTime --> LA_InitFaceScan[Task:<br/>Initiate Face Scan]
        LA_InitFaceScan --> LA_Monitor[Task:<br/>Monitor Verification Process]
        LA_Monitor --> LA_ReceiveResult{Exclusive Gateway:<br/>Verification Result?}
        LA_ReceiveResult -->|Success| LA_CreateRecord[Task:<br/>Create Issue Record]
        LA_ReceiveResult -->|Failure| LA_LogFailure[Task:<br/>Log Verification Failure]
        LA_CreateRecord --> LA_NotifyUser[Task:<br/>Notify User]
        LA_NotifyUser --> LA_EndSuccess([End Event:<br/>✅ Item Issued])
        LA_LogFailure --> LA_EndError([End Event:<br/>❌ Issue Cancelled])
        
        LA_ReturnStart([Start Event:<br/>📥 Return Processing]) --> LA_ViewHistory[Task:<br/>View Issue History]
        LA_ViewHistory --> LA_SelectReturn[Task:<br/>Select Record to Return]
        LA_SelectReturn --> LA_ProcessReturn[Task:<br/>Process Return]
        LA_ProcessReturn --> LA_UpdateStatus[Task:<br/>Update Item Status]
        LA_UpdateStatus --> LA_ReturnEnd([End Event:<br/>✅ Return Processed])
    end
    
    subgraph Pool3["Pool: System"]
        direction TB
        subgraph Lane1["Lane: Authentication Service"]
            AUTH_Validate[Task:<br/>Validate User Credentials] --> AUTH_GenerateToken[Task:<br/>Generate JWT Token]
        end
        
        subgraph Lane2["Lane: Face Recognition Service"]
            FACE_Receive[Task:<br/>Receive Face Image] --> FACE_Detect[Task:<br/>Detect Face in Image]
            FACE_Detect --> FACE_Extract[Task:<br/>Extract Face Encoding]
            FACE_Extract --> FACE_Compare[Task:<br/>Compare with Stored Face]
            FACE_Compare --> FACE_Calculate[Task:<br/>Calculate Distance]
            FACE_Calculate --> FACE_Result{Exclusive Gateway:<br/>Distance < Threshold?}
            FACE_Result -->|Yes| FACE_Match[Task:<br/>Return Match Result]
            FACE_Result -->|No| FACE_Mismatch[Task:<br/>Return Mismatch Result]
        end
        
        subgraph Lane3["Lane: Database Service"]
            DB_CheckItem[Task:<br/>Check Item Availability] --> DB_Validate[Task:<br/>Validate Item Status]
            DB_CreateRecord[Task:<br/>Create Issue Record] --> DB_UpdateItem[Task:<br/>Update Item Status]
            DB_UpdateItem --> DB_Store[Task:<br/>Store in Database]
            DB_Retrieve[Task:<br/>Retrieve Issue Record] --> DB_UpdateReturn[Task:<br/>Update Return Time]
            DB_UpdateReturn --> DB_UpdateStatus[Task:<br/>Update Item to Available]
        end
        
        subgraph Lane4["Lane: Notification Service"]
            NOTIF_CheckOverdue[Task:<br/>Check Overdue Items] --> NOTIF_Query[Task:<br/>Query Issue Records]
            NOTIF_Query --> NOTIF_Filter[Task:<br/>Filter Overdue & Unnotified]
            NOTIF_Filter --> NOTIF_Generate[Task:<br/>Generate Email]
            NOTIF_Generate --> NOTIF_Send[Task:<br/>Send Email via SMTP]
            NOTIF_Send --> NOTIF_Update[Task:<br/>Mark notification_sent = true]
        end
        
        subgraph Lane5["Lane: Timer Service"]
            TIMER_Start([Timer Start Event:<br/>⏰ Daily at 9:00 AM]) --> TIMER_Trigger[Task:<br/>Trigger Overdue Check]
            TIMER_Trigger --> NOTIF_CheckOverdue
        end
    end
    
    %% Message Flows between Pools
    U_InitFaceScan -.->|Message: Request Verification| FACE_Receive
    FACE_Match -.->|Message: Verification Success| U_WaitResult
    FACE_Mismatch -.->|Message: Verification Failed| U_WaitResult
    
    LA_InitFaceScan -.->|Message: Request Verification| FACE_Receive
    FACE_Match -.->|Message: Verification Success| LA_ReceiveResult
    FACE_Mismatch -.->|Message: Verification Failed| LA_ReceiveResult
    
    U_SelectItem -.->|Message: Check Availability| DB_CheckItem
    DB_Validate -.->|Message: Item Status| U_ReceiveResult
    
    LA_SelectItem -.->|Message: Check Availability| DB_CheckItem
    DB_Validate -.->|Message: Item Status| LA_ReceiveResult
    
    LA_CreateRecord -.->|Message: Create Record| DB_CreateRecord
    DB_Store -.->|Message: Record Created| LA_NotifyUser
    
    U_ConfirmReturn -.->|Message: Return Request| DB_Retrieve
    DB_UpdateStatus -.->|Message: Return Confirmed| U_ReturnEnd
    
    LA_ProcessReturn -.->|Message: Process Return| DB_Retrieve
    DB_UpdateStatus -.->|Message: Return Processed| LA_ReturnEnd
    
    TIMER_Start -.->|Timer Event| TIMER_Trigger
    
    %% Data Store Associations
    DB_Store -.->|Data Store:<br/>💾 MongoDB Database| DB_Store
    DB_Retrieve -.->|Data Store:<br/>💾 MongoDB Database| DB_Retrieve
    
    style Pool1 fill:#E3F2FD
    style Pool2 fill:#F3E5F5
    style Pool3 fill:#E8F5E9
    style U_Start fill:#90EE90
    style U_EndSuccess fill:#90EE90
    style U_EndError fill:#FF6B6B
    style LA_Start fill:#90EE90
    style LA_EndSuccess fill:#90EE90
    style LA_EndError fill:#FF6B6B
    style TIMER_Start fill:#FFD700
```

---

## Detailed Process Flow: Item Issuance with Face Verification

This diagram provides a more detailed view of the item issuance process with all decision points and error handling.

```mermaid
flowchart TB
    subgraph Pool1["Pool: User"]
        direction TB
        Start1([Start Event:<br/>📧 User Requests Item]) --> T1[Task:<br/>View Available Items]
        T1 --> T2[Task:<br/>Select Item]
        T2 --> T3[Task:<br/>Set Estimated Return Time]
        T3 --> T4[Task:<br/>Click Issue Item]
        T4 --> T5[Task:<br/>Grant Camera Permission]
        T5 --> T6[Task:<br/>Position Face in Frame]
        T6 --> IE1{Intermediate Event:<br/>⏳ Waiting for Verification}
        IE1 --> G1{Exclusive Gateway:<br/>Verification Result?}
        G1 -->|Match| T7[Task:<br/>Receive Success Message]
        G1 -->|Mismatch| T8[Task:<br/>Receive Error:<br/>Face Mismatch for User Name]
        T7 --> End1([End Event:<br/>✅ Item Issued Successfully])
        T8 --> End2([End Event:<br/>❌ Issue Failed])
    end
    
    subgraph Pool2["Pool: System - Item Management"]
        direction TB
        T4 -.->|Message| T9[Task:<br/>Validate Request]
        T9 --> G2{Exclusive Gateway:<br/>Item Available?}
        G2 -->|No| T10[Task:<br/>Return Item Not Available]
        G2 -->|Yes| T11[Task:<br/>Retrieve User Face Data]
        T11 --> G3{Exclusive Gateway:<br/>Face Data Exists?}
        G3 -->|No| T12[Task:<br/>Return Error:<br/>No Face Data]
        G3 -->|Yes| T13[Task:<br/>Request Face Verification]
    end
    
    subgraph Pool3["Pool: System - Face Recognition Service"]
        direction TB
        T13 -.->|Message| T14[Task:<br/>Receive Face Image]
        T14 --> T15[Task:<br/>Detect Face in Image]
        T15 --> G4{Exclusive Gateway:<br/>Face Detected?}
        G4 -->|No| T16[Task:<br/>Return Error:<br/>No Face Detected]
        G4 -->|Yes| T17[Task:<br/>Extract Face Encoding]
        T17 --> T18[Task:<br/>Load Stored Face Encoding]
        T18 --> T19[Task:<br/>Calculate Face Distance]
        T19 --> G5{Exclusive Gateway:<br/>Distance < 0.6?}
        G5 -->|Yes| T20[Task:<br/>Return Match Result<br/>with Confidence]
        G5 -->|No| T21[Task:<br/>Return Mismatch Result<br/>with User Name]
    end
    
    subgraph Pool4["Pool: System - Database Service"]
        direction TB
        T20 -.->|Message| T22[Task:<br/>Create Issue Record]
        T22 --> T23[Task:<br/>Set estimated_return_time]
        T23 --> T24[Task:<br/>Update Item Status to ISSUED]
        T24 --> T25[Task:<br/>Store in MongoDB]
        T25 --> T26[Task:<br/>Return Success]
    end
    
    T10 -.->|Message| G1
    T12 -.->|Message| G1
    T16 -.->|Message| G1
    T21 -.->|Message| G1
    T26 -.->|Message| G1
    
    T25 -.->|Data Store:<br/>💾 MongoDB| T25
    
    style Pool1 fill:#E3F2FD
    style Pool2 fill:#FFF3E0
    style Pool3 fill:#E8F5E9
    style Pool4 fill:#F3E5F5
    style Start1 fill:#90EE90
    style End1 fill:#90EE90
    style End2 fill:#FF6B6B
```

---

## Complete Item Lifecycle Process with Pools and Lanes

This comprehensive diagram shows the complete item lifecycle from creation to return, including all participants and system services.

```mermaid
flowchart TB
    subgraph Pool1["Pool: Lab Admin"]
        direction TB
        subgraph Lane1["Lane: Item Management"]
            LA1([Start Event:<br/>📝 Create Item Request]) --> LA2[Task:<br/>Enter Item Details]
            LA2 --> LA3[Task:<br/>Set Category]
            LA3 --> LA4[Task:<br/>Submit Item]
            LA4 --> LA5([End Event:<br/>✅ Item Created])
            
            LA6([Start Event:<br/>✏️ Edit Item Request]) --> LA7[Task:<br/>Modify Item Details]
            LA7 --> LA8[Task:<br/>Update Status]
            LA8 --> LA9([End Event:<br/>✅ Item Updated])
            
            LA10([Start Event:<br/>🗑️ Delete Item Request]) --> LA11{Exclusive Gateway:<br/>Item Issued?}
            LA11 -->|Yes| LA12[Task:<br/>Display Error:<br/>Cannot Delete Issued Item]
            LA11 -->|No| LA13[Task:<br/>Delete Item]
            LA12 --> LA14([End Event:<br/>❌ Deletion Failed])
            LA13 --> LA15([End Event:<br/>✅ Item Deleted])
        end
        
        subgraph Lane2["Lane: Item Issuance"]
            LA16([Start Event:<br/>📤 Issue Item Request]) --> LA17[Task:<br/>Select User]
            LA17 --> LA18[Task:<br/>Select Item]
            LA18 --> LA19[Task:<br/>Set Estimated Return Time]
            LA19 --> LA20[Task:<br/>Initiate Face Verification]
            LA20 --> LA21{Exclusive Gateway:<br/>Verification Success?}
            LA21 -->|No| LA22[Task:<br/>Log Failure]
            LA21 -->|Yes| LA23[Task:<br/>Create Issue Record]
            LA22 --> LA24([End Event:<br/>❌ Issue Failed])
            LA23 --> LA25([End Event:<br/>✅ Item Issued])
        end
        
        subgraph Lane3["Lane: Return Processing"]
            LA26([Start Event:<br/>📥 Process Return Request]) --> LA27[Task:<br/>View Issue History]
            LA27 --> LA28[Task:<br/>Select Issue Record]
            LA28 --> LA29[Task:<br/>Mark as Returned]
            LA29 --> LA30([End Event:<br/>✅ Return Processed])
        end
    end
    
    subgraph Pool2["Pool: User"]
        direction TB
        U1([Start Event:<br/>👤 User Login]) --> U2[Task:<br/>View Dashboard]
        U2 --> U3[Task:<br/>View Available Items]
        U3 --> U4[Task:<br/>Request Item Issue]
        U4 --> U5[Task:<br/>Perform Face Verification]
        U5 --> U6{Exclusive Gateway:<br/>Verification Success?}
        U6 -->|Yes| U7[Task:<br/>Receive Confirmation]
        U6 -->|No| U8[Task:<br/>Receive Error Message]
        U7 --> U9([End Event:<br/>✅ Item Issued])
        U8 --> U10([End Event:<br/>❌ Issue Failed])
        
        U11([Start Event:<br/>📦 Return Item Request]) --> U12[Task:<br/>View My Issued Items]
        U12 --> U13[Task:<br/>Select Item to Return]
        U13 --> U14[Task:<br/>Confirm Return]
        U14 --> U15([End Event:<br/>✅ Item Returned])
    end
    
    subgraph Pool3["Pool: System"]
        direction TB
        subgraph Lane4["Lane: Authentication"]
            S1[Task:<br/>Validate Credentials] --> S2[Task:<br/>Generate JWT Token]
        end
        
        subgraph Lane5["Lane: Face Recognition"]
            S3[Task:<br/>Receive Image] --> S4[Task:<br/>Detect Face]
            S4 --> S5[Task:<br/>Extract Encoding]
            S5 --> S6[Task:<br/>Compare Faces]
            S6 --> S7{Exclusive Gateway:<br/>Match?}
            S7 -->|Yes| S8[Task:<br/>Return Match]
            S7 -->|No| S9[Task:<br/>Return Mismatch]
        end
        
        subgraph Lane6["Lane: Database Operations"]
            S10[Task:<br/>Create Item] --> S11[Task:<br/>Store in MongoDB]
            S12[Task:<br/>Create Issue Record] --> S13[Task:<br/>Update Item Status]
            S13 --> S14[Task:<br/>Store Record]
            S15[Task:<br/>Update Return Time] --> S16[Task:<br/>Set Item Available]
        end
        
        subgraph Lane7["Lane: Notification Service"]
            S17([Timer Event:<br/>⏰ Daily Check]) --> S18[Task:<br/>Query Overdue Items]
            S18 --> S19[Task:<br/>Filter Unnotified]
            S19 --> S20[Task:<br/>Send Email Notifications]
            S20 --> S21[Task:<br/>Update Flags]
        end
    end
    
    %% Message Flows
    LA4 -.->|Message| S10
    S11 -.->|Confirmation| LA5
    
    LA20 -.->|Message| S3
    S8 -.->|Success| LA21
    S9 -.->|Failure| LA21
    
    U5 -.->|Message| S3
    S8 -.->|Success| U6
    S9 -.->|Failure| U6
    
    LA23 -.->|Message| S12
    S14 -.->|Confirmation| LA25
    
    U14 -.->|Message| S15
    S16 -.->|Confirmation| U15
    
    LA29 -.->|Message| S15
    S16 -.->|Confirmation| LA30
    
    S17 -.->|Timer| S18
    
    %% Data Store
    S11 -.->|Data Store:<br/>💾 MongoDB| S11
    S14 -.->|Data Store:<br/>💾 MongoDB| S14
    S16 -.->|Data Store:<br/>💾 MongoDB| S16
    
    style Pool1 fill:#E3F2FD
    style Pool2 fill:#F3E5F5
    style Pool3 fill:#E8F5E9
```

---

## BPMN Element Legend

### Events
- **Start Event** (Circle with thin border): Process initiation
  - 📧 Message Start Event
  - ⏰ Timer Start Event
  - 📝 Manual Start Event
- **End Event** (Circle with thick border): Process completion
  - ✅ Success End Event
  - ❌ Error End Event
- **Intermediate Event** (Circle with double border): Event during execution
  - ⏳ Waiting/Catching Event

### Activities
- **Task** (Rounded rectangle): Work performed
  - User Task: Performed by human
  - Service Task: Performed by automated service
  - Script Task: Performed by script

### Gateways
- **Exclusive Gateway** (Diamond with X): Decision point - only one path taken
- **Parallel Gateway** (Diamond with +): Multiple paths taken simultaneously
- **Inclusive Gateway** (Diamond with O): One or more paths taken

### Flow Objects
- **Sequence Flow** (Solid arrow): Order of activities within a pool
- **Message Flow** (Dashed arrow with dot): Communication between pools
- **Association** (Dotted line): Links artifacts to flow objects

### Artifacts
- **Data Store** (Cylinder icon 💾): Persistent data storage
- **Pool**: Represents a participant in the process
- **Lane**: Represents a sub-partition within a pool

---

## Process Participants

### Pool 1: User
- **Role**: End user who requests and returns items
- **Responsibilities**: 
  - View available items
  - Request item issuance
  - Perform face verification
  - Return items

### Pool 2: Lab Admin
- **Role**: Laboratory administrator managing items and users
- **Responsibilities**:
  - Create and manage items
  - Issue items to users
  - Process returns
  - Monitor issue history

### Pool 3: System
- **Role**: Automated system services
- **Lanes**:
  - **Authentication Service**: User authentication and authorization
  - **Face Recognition Service**: Biometric verification
  - **Database Service**: Data persistence and retrieval
  - **Notification Service**: Automated email notifications
  - **Timer Service**: Scheduled tasks and triggers

---

## Key Process Flows

### 1. Item Issuance Flow
1. User/Lab Admin initiates item issue request
2. System validates item availability
3. Face verification process is triggered
4. Face recognition service compares faces
5. On success: Issue record is created
6. Item status is updated to ISSUED
7. Confirmation is sent to user

### 2. Item Return Flow
1. User/Lab Admin initiates return request
2. System retrieves issue record
3. Return time is updated
4. Item status is updated to AVAILABLE
5. Confirmation is sent

### 3. Overdue Notification Flow
1. Timer service triggers daily check
2. System queries overdue items
3. Filters unnotified records
4. Generates and sends email notifications
5. Updates notification flags

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**BPMN Version**: 2.0  
**Status**: Final  
**Modeling Tool**: Mermaid (BPMN-compatible notation)

