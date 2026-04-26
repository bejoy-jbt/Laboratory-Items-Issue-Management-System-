# Business Process Model and Notation (BPMN) Diagrams
## Laboratory Items Issue Management System

This document contains standard BPMN 2.0 diagrams representing the key business processes in the Laboratory Items Issue Management System.

> **For a comprehensive BPMN diagram with Pools and Lanes (similar to professional BPMN modeling tools), see [BPMN_COMPLETE_PROCESS.md](./BPMN_COMPLETE_PROCESS.md)**

---

## 1. Item Issuance Process (Lab Admin)

This process represents the workflow when a Lab Admin issues an item to a user, including face verification.

```mermaid
flowchart TB
    Start([Start Event:<br/>Item Issue Request]) --> SelectItem[Task:<br/>Select Item and User]
    SelectItem --> SetReturnTime[Task:<br/>Set Estimated Return Time]
    SetReturnTime --> InitFaceScan[Task:<br/>Initiate Face Scan]
    InitFaceScan --> AccessCamera[Task:<br/>Access User Camera]
    AccessCamera --> CaptureFace[Task:<br/>Capture Face Image]
    CaptureFace --> SendToService[Task:<br/>Send Image to Face Recognition Service]
    SendToService --> CompareFace{Exclusive Gateway:<br/>Face Match?}
    
    CompareFace -->|No Match| ShowError[Task:<br/>Display Face Mismatch Error]
    ShowError --> EndError([End Event:<br/>Issue Cancelled])
    
    CompareFace -->|Match| CheckAvailability{Exclusive Gateway:<br/>Item Available?}
    CheckAvailability -->|No| NotAvailable[Task:<br/>Display Item Not Available]
    NotAvailable --> EndError
    
    CheckAvailability -->|Yes| CreateRecord[Task:<br/>Create Issue Record]
    CreateRecord --> UpdateStatus[Task:<br/>Update Item Status to ISSUED]
    UpdateStatus --> SendConfirmation[Task:<br/>Send Confirmation to User]
    SendConfirmation --> EndSuccess([End Event:<br/>Item Issued Successfully])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndError fill:#FF6B6B
    style CompareFace fill:#FFD700
    style CheckAvailability fill:#FFD700
```

---

## 2. Item Issuance Process (User Self-Service)

This process represents the workflow when a User issues an item themselves with face verification.

```mermaid
flowchart TB
    Start([Start Event:<br/>User Requests Item]) --> ViewItems[Task:<br/>View Available Items]
    ViewItems --> SelectItem[Task:<br/>Select Item]
    SelectItem --> SetReturnTime[Task:<br/>Set Estimated Return Time]
    SetReturnTime --> InitFaceScan[Task:<br/>Initiate Face Verification]
    InitFaceScan --> AccessCamera[Task:<br/>Access Camera]
    AccessCamera --> CaptureFace[Task:<br/>Capture Face Image]
    CaptureFace --> SendToService[Task:<br/>Send to Face Recognition Service]
    SendToService --> VerifyFace{Exclusive Gateway:<br/>Face Verified?}
    
    VerifyFace -->|No Match| ShowMismatch[Task:<br/>Display Face Mismatch Error<br/>with User Name]
    ShowMismatch --> EndError([End Event:<br/>Issue Failed])
    
    VerifyFace -->|Match| CheckItemStatus{Exclusive Gateway:<br/>Item Still Available?}
    CheckItemStatus -->|No| ItemTaken[Task:<br/>Display Item No Longer Available]
    ItemTaken --> EndError
    
    CheckItemStatus -->|Yes| CreateRecord[Task:<br/>Create Issue Record]
    CreateRecord --> UpdateItemStatus[Task:<br/>Update Item Status to ISSUED]
    UpdateItemStatus --> NotifyLabAdmin[Task:<br/>Notify Lab Admin]
    NotifyLabAdmin --> EndSuccess([End Event:<br/>Item Issued Successfully])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndError fill:#FF6B6B
    style VerifyFace fill:#FFD700
    style CheckItemStatus fill:#FFD700
```

---

## 3. Item Return Process

This process represents the workflow for returning an issued item.

```mermaid
flowchart TB
    Start([Start Event:<br/>Return Request]) --> GetIssueRecord[Task:<br/>Retrieve Issue Record]
    GetIssueRecord --> ValidateRecord{Exclusive Gateway:<br/>Record Valid?}
    
    ValidateRecord -->|No| ShowError[Task:<br/>Display Error Message]
    ShowError --> EndError([End Event:<br/>Return Failed])
    
    ValidateRecord -->|Yes| CheckReturned{Exclusive Gateway:<br/>Already Returned?}
    CheckReturned -->|Yes| AlreadyReturned[Task:<br/>Display Already Returned Message]
    AlreadyReturned --> EndError
    
    CheckReturned -->|No| UpdateReturnTime[Task:<br/>Update Return Time in Record]
    UpdateReturnTime --> UpdateItemStatus[Task:<br/>Update Item Status to AVAILABLE]
    UpdateItemStatus --> CheckOverdue{Exclusive Gateway:<br/>Was Item Overdue?}
    
    CheckOverdue -->|Yes| LogOverdue[Task:<br/>Log Overdue Return]
    CheckOverdue -->|No| SendConfirmation[Task:<br/>Send Return Confirmation]
    LogOverdue --> SendConfirmation
    SendConfirmation --> EndSuccess([End Event:<br/>Item Returned Successfully])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndError fill:#FF6B6B
    style ValidateRecord fill:#FFD700
    style CheckReturned fill:#FFD700
    style CheckOverdue fill:#FFD700
```

---

## 4. Overdue Item Notification Process

This process represents the automated workflow for detecting and notifying users about overdue items.

```mermaid
flowchart TB
    Start([Timer Start Event:<br/>Scheduled Daily Check]) --> QueryRecords[Task:<br/>Query Issue Records]
    QueryRecords --> FilterOverdue[Task:<br/>Filter Overdue Items<br/>estimated_return_time < now]
    FilterOverdue --> CheckNotified{Exclusive Gateway:<br/>Notification Already Sent?}
    
    CheckNotified -->|Yes| SkipRecord[Task:<br/>Skip Record]
    CheckNotified -->|No| GetUserInfo[Task:<br/>Retrieve User Information]
    
    GetUserInfo --> GetItemInfo[Task:<br/>Retrieve Item Information]
    GetItemInfo --> GenerateEmail[Task:<br/>Generate Email Notification]
    GenerateEmail --> SendEmail[Task:<br/>Send Email via SMTP]
    SendEmail --> UpdateFlag[Task:<br/>Mark notification_sent = true]
    UpdateFlag --> CheckMore{Exclusive Gateway:<br/>More Records?}
    
    SkipRecord --> CheckMore
    CheckMore -->|Yes| FilterOverdue
    CheckMore -->|No| EndSuccess([End Event:<br/>Notification Process Complete])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style CheckNotified fill:#FFD700
    style CheckMore fill:#FFD700
```

---

## 5. User Registration Process (With Face Capture)

This process represents the workflow for creating a new user with optional face descriptor capture.

```mermaid
flowchart TB
    Start([Start Event:<br/>User Registration Request]) --> ValidateInput[Task:<br/>Validate User Input]
    ValidateInput --> CheckEmail{Exclusive Gateway:<br/>Email Unique?}
    
    CheckEmail -->|No| ShowEmailError[Task:<br/>Display Email Already Exists]
    ShowEmailError --> EndError([End Event:<br/>Registration Failed])
    
    CheckEmail -->|Yes| HashPassword[Task:<br/>Hash Password]
    HashPassword --> CheckImage{Exclusive Gateway:<br/>Image Provided?}
    
    CheckImage -->|Yes| UploadImage[Task:<br/>Upload User Image]
    UploadImage --> StoreImagePath[Task:<br/>Store Image Path]
    StoreImagePath --> InitFaceScan[Task:<br/>Initiate Face Scan]
    
    CheckImage -->|No| CreateUser[Task:<br/>Create User Record]
    InitFaceScan --> AccessCamera[Task:<br/>Access Camera]
    AccessCamera --> CaptureFace[Task:<br/>Capture Face Image]
    CaptureFace --> ExtractEncoding[Task:<br/>Extract Face Encoding]
    ExtractEncoding --> StoreEncoding[Task:<br/>Store Face Descriptor]
    StoreEncoding --> CreateUser
    
    CreateUser --> AssignRole[Task:<br/>Assign User Role]
    AssignRole --> AssignLab[Task:<br/>Assign to Laboratory]
    AssignLab --> SendConfirmation[Task:<br/>Send Registration Confirmation]
    SendConfirmation --> EndSuccess([End Event:<br/>User Registered Successfully])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndError fill:#FF6B6B
    style CheckEmail fill:#FFD700
    style CheckImage fill:#FFD700
```

---

## 6. Complete Item Lifecycle Process

This comprehensive process shows the complete lifecycle of an item from creation to return.

```mermaid
flowchart TB
    Start([Start Event:<br/>Item Lifecycle]) --> CreateItem[Task:<br/>Lab Admin Creates Item]
    CreateItem --> SetAvailable[Task:<br/>Set Status: AVAILABLE]
    SetAvailable --> ItemAvailable[Intermediate Event:<br/>Item Available]
    
    ItemAvailable --> UserRequest{Exclusive Gateway:<br/>User Requests Item?}
    UserRequest -->|No| Monitor[Task:<br/>Monitor Item Status]
    Monitor --> ItemAvailable
    
    UserRequest -->|Yes| FaceVerification[Task:<br/>Perform Face Verification]
    FaceVerification --> VerifyResult{Exclusive Gateway:<br/>Verification Success?}
    
    VerifyResult -->|No| VerificationFailed[Task:<br/>Log Verification Failure]
    VerificationFailed --> ItemAvailable
    
    VerifyResult -->|Yes| IssueItem[Task:<br/>Issue Item to User]
    IssueItem --> SetIssued[Task:<br/>Set Status: ISSUED]
    SetIssued --> CreateIssueRecord[Task:<br/>Create Issue Record<br/>with Estimated Return Time]
    CreateIssueRecord --> ItemInUse[Intermediate Event:<br/>Item In Use]
    
    ItemInUse --> CheckOverdue{Exclusive Gateway:<br/>Past Estimated Return Time?}
    CheckOverdue -->|Yes| SendOverdueNotification[Task:<br/>Send Overdue Notification]
    SendOverdueNotification --> ItemInUse
    
    CheckOverdue -->|No| CheckReturn{Exclusive Gateway:<br/>User Returns Item?}
    CheckReturn -->|No| ItemInUse
    
    CheckReturn -->|Yes| ProcessReturn[Task:<br/>Process Item Return]
    ProcessReturn --> UpdateReturnTime[Task:<br/>Update Return Time]
    UpdateReturnTime --> SetAvailableAgain[Task:<br/>Set Status: AVAILABLE]
    SetAvailableAgain --> ItemAvailable
    
    style Start fill:#90EE90
    style ItemAvailable fill:#87CEEB
    style ItemInUse fill:#FFA500
    style VerifyResult fill:#FFD700
    style CheckOverdue fill:#FFD700
    style CheckReturn fill:#FFD700
    style UserRequest fill:#FFD700
```

---

## 7. Face Verification Sub-Process

This detailed sub-process shows the face verification workflow used in item issuance.

```mermaid
flowchart TB
    Start([Start Event:<br/>Face Verification Request]) --> GetUserData[Task:<br/>Retrieve User Face Data]
    GetUserData --> CheckData{Exclusive Gateway:<br/>Face Data Available?}
    
    CheckData -->|No| ErrorNoData[Task:<br/>Error: No Face Data Found]
    ErrorNoData --> EndError([End Event:<br/>Verification Failed])
    
    CheckData -->|Yes| RequestCamera[Task:<br/>Request Camera Access]
    RequestCamera --> CameraGranted{Exclusive Gateway:<br/>Camera Access Granted?}
    
    CameraGranted -->|No| ErrorCamera[Task:<br/>Error: Camera Access Denied]
    ErrorCamera --> EndError
    
    CameraGranted -->|Yes| StartVideo[Task:<br/>Start Video Stream]
    StartVideo --> DetectFace[Task:<br/>Detect Face in Frame]
    DetectFace --> FaceDetected{Exclusive Gateway:<br/>Face Detected?}
    
    FaceDetected -->|No| WaitForFace[Task:<br/>Wait for Face Detection]
    WaitForFace --> DetectFace
    
    FaceDetected -->|Yes| CaptureFrame[Task:<br/>Capture Frame]
    CaptureFrame --> EncodeImage[Task:<br/>Encode Image to Base64]
    EncodeImage --> SendToPython[Task:<br/>Send to Python Service]
    SendToPython --> CompareFaces[Task:<br/>Compare Faces]
    CompareFaces --> CalculateDistance[Task:<br/>Calculate Distance]
    CalculateDistance --> CheckThreshold{Exclusive Gateway:<br/>Distance < Threshold?}
    
    CheckThreshold -->|No| FaceMismatch[Task:<br/>Face Mismatch Detected]
    FaceMismatch --> ReturnMismatch[Task:<br/>Return Mismatch Result<br/>with User Name]
    ReturnMismatch --> EndError
    
    CheckThreshold -->|Yes| FaceMatch[Task:<br/>Face Match Confirmed]
    FaceMatch --> ReturnMatch[Task:<br/>Return Match Result<br/>with Confidence]
    ReturnMatch --> EndSuccess([End Event:<br/>Verification Successful])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndError fill:#FF6B6B
    style CheckData fill:#FFD700
    style CameraGranted fill:#FFD700
    style FaceDetected fill:#FFD700
    style CheckThreshold fill:#FFD700
```

---

## 8. Pool and Lane Diagram: Item Issuance Process

This BPMN pool diagram shows the interaction between different participants (User, Lab Admin, System) in the item issuance process.

```mermaid
flowchart TB
    subgraph Pool1["Pool: User"]
        direction TB
        U1[User Selects Item] --> U2[User Sets Return Time]
        U2 --> U3[User Initiates Face Scan]
        U3 --> U4[User Positions Face]
        U4 --> U5{User Receives<br/>Verification Result}
        U5 -->|Success| U6[User Receives Confirmation]
        U5 -->|Failure| U7[User Sees Error Message]
    end
    
    subgraph Pool2["Pool: Lab Admin"]
        direction TB
        LA1[Lab Admin Views Request] --> LA2[Lab Admin Monitors Process]
        LA2 --> LA3[Lab Admin Receives Notification]
    end
    
    subgraph Pool3["Pool: System"]
        direction TB
        S1[System Validates Request] --> S2[System Accesses Camera]
        S2 --> S3[System Captures Face]
        S3 --> S4[System Sends to Face Service]
        S4 --> S5[System Compares Faces]
        S5 --> S6{System Verifies Match}
        S6 -->|Match| S7[System Creates Issue Record]
        S6 -->|No Match| S8[System Logs Mismatch]
        S7 --> S9[System Updates Item Status]
        S9 --> S10[System Sends Notifications]
    end
    
    U3 -.->|Triggers| S1
    S5 -.->|Result| U5
    S10 -.->|Notifies| LA3
    
    style Pool1 fill:#E3F2FD
    style Pool2 fill:#F3E5F5
    style Pool3 fill:#E8F5E9
```

---

## 9. Event-Driven Process: Overdue Item Monitoring

This process shows the event-driven workflow for monitoring and handling overdue items.

```mermaid
flowchart TB
    Start([Timer Start Event:<br/>Daily at 9:00 AM]) --> QueryDB[Task:<br/>Query All Active Issue Records]
    QueryDB --> LoopStart[Loop Start:<br/>For Each Record]
    LoopStart --> CheckTime{Exclusive Gateway:<br/>estimated_return_time < now?}
    
    CheckTime -->|No| NextRecord[Task:<br/>Move to Next Record]
    CheckTime -->|Yes| CheckNotified{Exclusive Gateway:<br/>notification_sent = false?}
    
    CheckNotified -->|No| NextRecord
    CheckNotified -->|Yes| GetUserEmail[Task:<br/>Get User Email Address]
    GetUserEmail --> GetItemDetails[Task:<br/>Get Item Details]
    GetItemDetails --> CalculateOverdue[Task:<br/>Calculate Overdue Duration]
    CalculateOverdue --> ComposeEmail[Task:<br/>Compose Email Message]
    ComposeEmail --> SendEmail[Task:<br/>Send Email Notification]
    SendEmail --> UpdateNotification[Task:<br/>Set notification_sent = true]
    UpdateNotification --> NextRecord
    
    NextRecord --> MoreRecords{Exclusive Gateway:<br/>More Records?}
    MoreRecords -->|Yes| LoopStart
    MoreRecords -->|No| EndLoop[Loop End]
    EndLoop --> EndSuccess([End Event:<br/>All Notifications Sent])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style CheckTime fill:#FFD700
    style CheckNotified fill:#FFD700
    style MoreRecords fill:#FFD700
```

---

## 10. Error Handling Process: Face Verification Failure

This process shows the error handling workflow when face verification fails.

```mermaid
flowchart TB
    Start([Start Event:<br/>Face Verification Failure]) --> LogError[Task:<br/>Log Verification Error]
    LogError --> DetermineErrorType{Exclusive Gateway:<br/>Error Type?}
    
    DetermineErrorType -->|Face Mismatch| ShowMismatch[Task:<br/>Display Face Mismatch Message<br/>with User Name]
    DetermineErrorType -->|No Face Detected| ShowNoFace[Task:<br/>Display No Face Detected Message]
    DetermineErrorType -->|Camera Error| ShowCameraError[Task:<br/>Display Camera Access Error]
    DetermineErrorType -->|Service Error| ShowServiceError[Task:<br/>Display Service Unavailable Error]
    
    ShowMismatch --> AllowRetry{Exclusive Gateway:<br/>Allow Retry?}
    ShowNoFace --> AllowRetry
    ShowCameraError --> AllowRetry
    ShowServiceError --> AllowRetry
    
    AllowRetry -->|Yes| WaitForRetry[Intermediate Event:<br/>Wait for User Action]
    WaitForRetry --> RetryVerification[Task:<br/>Retry Face Verification]
    RetryVerification --> CheckRetryCount{Exclusive Gateway:<br/>Retry Count < 3?}
    
    CheckRetryCount -->|Yes| Start
    CheckRetryCount -->|No| MaxRetries[Task:<br/>Display Max Retries Reached]
    MaxRetries --> EndFailure([End Event:<br/>Verification Failed])
    
    AllowRetry -->|No| EndFailure
    
    style Start fill:#90EE90
    style EndFailure fill:#FF6B6B
    style DetermineErrorType fill:#FFD700
    style AllowRetry fill:#FFD700
    style CheckRetryCount fill:#FFD700
```

---

## BPMN Element Legend

### Events
- **Start Event** (Circle with thin border): Process initiation point
- **End Event** (Circle with thick border): Process completion point
- **Intermediate Event** (Circle with double border): Event during process execution
- **Timer Event** (Clock icon): Time-based trigger

### Activities
- **Task** (Rounded rectangle): Work performed in the process
- **User Task**: Task performed by a human
- **Service Task**: Task performed by an automated service
- **Script Task**: Task performed by a script

### Gateways
- **Exclusive Gateway** (Diamond with X): Decision point - only one path is taken
- **Parallel Gateway** (Diamond with +): Multiple paths taken simultaneously
- **Inclusive Gateway** (Diamond with O): One or more paths taken

### Flow Objects
- **Sequence Flow** (Solid arrow): Order of activities
- **Message Flow** (Dashed arrow): Communication between pools
- **Association** (Dotted line): Links artifacts to flow objects

### Artifacts
- **Data Object**: Data used or produced in the process
- **Annotation**: Additional information about the process

---

## Process Summary

### Main Business Processes

1. **Item Issuance (Lab Admin)**: Complete workflow for Lab Admin issuing items with face verification
2. **Item Issuance (User Self-Service)**: User-initiated item issuance with face verification
3. **Item Return**: Process for returning issued items
4. **Overdue Notification**: Automated process for detecting and notifying about overdue items
5. **User Registration**: Process for creating new users with optional face capture
6. **Item Lifecycle**: Complete lifecycle from creation to return
7. **Face Verification**: Detailed sub-process for face recognition
8. **Error Handling**: Comprehensive error handling for verification failures

### Key Features Represented

- ✅ Face recognition verification
- ✅ Role-based access control
- ✅ Automated notifications
- ✅ Error handling and retry logic
- ✅ Multi-participant processes
- ✅ Event-driven workflows
- ✅ Timer-based automation

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**BPMN Version**: 2.0  
**Status**: Final

