# Face Image Storage and Verification Flow

## 1. User Creation Flow (Where Scanned Image is Stored)

### Frontend (`CreateUser.jsx`)
1. User scans face using `FaceScanPython` component
2. Captured image is stored as **base64 string** in `faceImage` state
3. On form submit, `faceImage` (base64 string) is sent to backend via JSON

### Backend (`admin.routes.js` or `superAdmin.routes.js`)
1. Receives `faceImage` as base64 string in `req.body.faceImage`
2. **Stores directly in MongoDB** in the `users` collection:
   - Field: `image_url` 
   - Value: **Base64 string** (e.g., `"data:image/jpeg;base64,/9j/4AAQSkZJRg..."`)
   - **NOT stored as a file** - stored as a string in the database

### Database Storage
- **Location**: MongoDB `users` collection
- **Field**: `image_url`
- **Format**: Base64 string (starts with `"data:image/jpeg;base64,"` or similar)
- **Example**: 
  ```json
  {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "face_descriptor": null
  }
  ```

---

## 2. Item Issuance Flow (Where Image is Checked)

### Frontend (`AvailableItems.jsx`)
1. User clicks "Issue Item"
2. `FaceScanPython` component captures live face image
3. Live image is stored as **base64 string** in `liveImage` variable
4. Sends to backend: `POST /api/user/issue/:itemId` with:
   ```json
   {
     "estimatedReturnTime": "...",
     "faceDescriptor": "...",
     "liveImage": "data:image/jpeg;base64,..."  // Live captured image
   }
   ```

### Backend (`user.routes.js`)
1. Receives `liveImage` from request body
2. Fetches user from database:
   ```javascript
   const user = await prisma.user.findUnique({
     where: { id: req.user.id },
     select: { 
       name: true,
       faceDescriptor: true,
       imageUrl: true  // This is the base64 string stored during creation
     }
   });
   ```
3. Checks if `user.imageUrl` is base64 or file path:
   ```javascript
   if (user.imageUrl.startsWith('data:image')) {
     userImageUrl = user.imageUrl;  // Use base64 directly
   } else {
     userImageUrl = join(__dirname, '..', user.imageUrl);  // Resolve file path
   }
   ```
4. Calls `faceRecognitionService.verifyFace()` with:
   - `liveImage`: Base64 string from frontend
   - `userImageUrl`: Base64 string from database (or file path)
   - `user.faceDescriptor`: Optional encoding from database
   - `threshold`: 0.65

### Face Recognition Service (`faceRecognition.service.js`)
1. Prepares payload for Python service:
   ```javascript
   {
     live_image: liveImageBase64,  // From frontend
     user_image_base64: userImageUrl,  // From database (if base64)
     // OR
     user_encoding: userEncoding,  // If available
     threshold: 0.65
   }
   ```
2. Sends POST request to: `http://localhost:5001/verify-face`

### Python Service (`face_recognition_service/app.py`)
1. Receives JSON payload:
   ```python
   {
     'live_image': 'data:image/jpeg;base64,...',
     'user_image_base64': 'data:image/jpeg;base64,...',
     'threshold': 0.65
   }
   ```
2. Decodes both images from base64
3. Extracts face encodings from both images
4. Compares encodings using Euclidean distance
5. Returns result:
   ```python
   {
     'success': True,
     'is_match': True/False,
     'distance': 0.45,
     'threshold': 0.65,
     'confidence': 85.5,
     'message': '...'
   }
   ```

---

## 3. Common Issues and Debugging

### Issue: 400 Error from Python Service
**Possible causes:**
1. `live_image` is missing or invalid
2. Neither `user_image_base64`, `user_image_url`, nor `user_encoding` is provided
3. Base64 string is malformed

**Debug steps:**
1. Check backend logs for payload being sent
2. Check Python service logs for received data
3. Verify `user.imageUrl` exists in database
4. Verify `liveImage` is being sent from frontend

### Issue: Face Verification Fails Even for Correct Person
**Possible causes:**
1. Threshold too strict (default: 0.65)
2. Image quality differences (lighting, angle, distance)
3. Base64 encoding/decoding issues

**Solutions:**
- Adjust threshold (higher = more lenient)
- Ensure consistent image quality
- Check distance values in logs

---

## 4. Data Flow Diagram

```
User Creation:
Frontend (FaceScan) 
  → Base64 Image 
  → Backend (admin.routes.js) 
  → MongoDB (users.image_url as base64 string)

Item Issuance:
Frontend (FaceScan) 
  → Live Base64 Image 
  → Backend (user.routes.js) 
  → Fetch user.image_url from MongoDB 
  → faceRecognition.service.js 
  → Python Service (app.py) 
  → Face Comparison 
  → Return Result
```

---

## 5. Key Points

1. **Images are NOT stored as files** - they're stored as base64 strings in MongoDB
2. **No file system access needed** - everything is base64 strings
3. **Python service receives base64** - decodes internally
4. **Threshold of 0.65** - more lenient than default 0.6
5. **Both images must be base64** - live image and stored user image

