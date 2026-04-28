from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from face_recognition import face_encodings, face_locations, load_image_file, compare_faces
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def decode_base64_image(base64_string):
    """Decode base64 image string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)  # Fixed: frombuffer (not frombuffer)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

def encode_image_to_base64(image):
    """Encode numpy array image to base64 string"""
    try:
        _, buffer = cv2.imencode('.jpg', image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        return image_base64
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'Face Recognition Service is running',
        'opencv_version': cv2.__version__
    })

@app.route('/detect-face', methods=['POST'])
def detect_face():
    """Detect face in an image and return face encoding"""
    try:
        data = request.json
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image = decode_base64_image(data['image'])
        if image is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # Convert BGR to RGB (face_recognition uses RGB)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locs = face_locations(rgb_image)
        
        if len(face_locs) == 0:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image',
                'face_count': 0
            }), 200
        
        if len(face_locs) > 1:
            return jsonify({
                'success': False,
                'message': 'Multiple faces detected. Please ensure only one person is in the frame.',
                'face_count': len(face_locs)
            }), 200
        
        # Get face encoding
        encodings = face_encodings(rgb_image, face_locs)
        
        if len(encodings) == 0:
            return jsonify({
                'success': False,
                'message': 'Failed to generate face encoding'
            }), 200
        
        # Convert encoding to list for JSON serialization
        face_encoding = encodings[0].tolist()
        
        # Encode to base64 for storage
        encoding_json = json.dumps(face_encoding)
        encoding_base64 = base64.b64encode(encoding_json.encode()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'message': 'Face detected and encoded successfully',
            'face_encoding': encoding_base64,
            'face_location': face_locs[0]
        }), 200
        
    except Exception as e:
        print(f"Error in detect_face: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/compare-faces', methods=['POST'])
def compare_faces_endpoint():
    """Compare two face encodings"""
    try:
        data = request.json
        
        if 'encoding1' not in data or 'encoding2' not in data:
            return jsonify({'error': 'Both encodings are required'}), 400
        
        # Decode base64 encodings
        try:
            encoding1_json = base64.b64decode(data['encoding1']).decode('utf-8')
            encoding2_json = base64.b64decode(data['encoding2']).decode('utf-8')
            
            encoding1 = np.array(json.loads(encoding1_json))
            encoding2 = np.array(json.loads(encoding2_json))
        except Exception as e:
            return jsonify({'error': f'Failed to decode encodings: {str(e)}'}), 400
        
        # Compare faces
        distance = np.linalg.norm(encoding1 - encoding2)
        
        # Threshold for face matching (lower is more strict)
        # Default threshold: 0.60 (closer to face_recognition defaults; reduces false-positives)
        threshold = data.get('threshold', 0.60)
        is_match = bool(distance < threshold)  # Convert NumPy bool_ to Python bool for JSON serialization
        
        return jsonify({
            'success': True,
            'is_match': is_match,
            'distance': float(distance),
            'threshold': float(threshold),
            'confidence': float(max(0, min(100, (1 - distance) * 100)))
        }), 200
        
    except Exception as e:
        print(f"Error in compare_faces: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify a live face against a stored user image"""
    try:
        data = request.json
        
        # Log received data for debugging (without printing full base64 strings)
        print(f"[VERIFY] Received request with keys: {list(data.keys()) if data else 'None'}")
        if data:
            for key in data.keys():
                if key in ['live_image', 'user_image_base64', 'user_encoding']:
                    value = data[key]
                    if isinstance(value, str):
                        print(f"[VERIFY] {key}: length={len(value)}, starts_with={value[:50] if len(value) > 50 else value}")
                    else:
                        print(f"[VERIFY] {key}: type={type(value).__name__}")
                else:
                    print(f"[VERIFY] {key}: {data[key]}")
        
        if not data:
            return jsonify({'error': 'No data received in request'}), 400
        
        if 'live_image' not in data:
            print("[VERIFY] ERROR: live_image is missing")
            return jsonify({'error': 'Live image is required'}), 400
        
        if 'user_image_url' not in data and 'user_image_base64' not in data and 'user_encoding' not in data:
            print("[VERIFY] ERROR: No user image data provided (need user_image_url, user_image_base64, or user_encoding)")
            return jsonify({'error': 'Either user_image_url, user_image_base64, or user_encoding is required'}), 400
        
        # Decode live image
        live_image = decode_base64_image(data['live_image'])
        if live_image is None:
            return jsonify({'error': 'Failed to decode live image'}), 400
        
        rgb_live = cv2.cvtColor(live_image, cv2.COLOR_BGR2RGB)
        live_locations = face_locations(rgb_live)
        if len(live_locations) == 0:
            return jsonify({
                'success': False,
                'is_match': False,
                'message': 'No face detected in live image'
            }), 200
        if len(live_locations) > 1:
            return jsonify({
                'success': False,
                'is_match': False,
                'message': 'Multiple faces detected in live image'
            }), 200

        live_encodings = face_encodings(rgb_live, live_locations)
        
        if len(live_encodings) == 0:
            return jsonify({
                'success': False,
                'is_match': False,
                'message': 'Failed to generate face encoding from live image'
            }), 200
        
        live_encoding = live_encodings[0]
        
        # Get user encoding
        user_encoding = None
        encoding_used = False
        
        if 'user_encoding' in data:
            # Use provided encoding (preferred method - fastest)
            try:
                user_encoding_json = base64.b64decode(data['user_encoding']).decode('utf-8')
                user_encoding = np.array(json.loads(user_encoding_json))
                encoding_used = True
                print(f"[VERIFY] Successfully decoded user encoding, shape: {user_encoding.shape}")
            except Exception as e:
                print(f"[VERIFY] Failed to decode user encoding: {str(e)}")
                print("[VERIFY] Will fall back to using image instead")
                # Continue to image processing below
        
        if not encoding_used:
            # Process image if encoding wasn't used or failed
            if 'user_image_base64' in data:
                # Decode from base64 image (when file path is not accessible)
                user_image = decode_base64_image(data['user_image_base64'])
                if user_image is None:
                    return jsonify({'error': 'Failed to decode user image from base64'}), 400
                
                rgb_user = cv2.cvtColor(user_image, cv2.COLOR_BGR2RGB)
                user_locations = face_locations(rgb_user)
                if len(user_locations) == 0:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'No face detected in user image'
                    }), 200
                if len(user_locations) > 1:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'Multiple faces detected in user image'
                    }), 200

                user_encodings = face_encodings(rgb_user, user_locations)
                
                if len(user_encodings) == 0:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'Failed to generate face encoding from user image'
                    }), 200
                
                user_encoding = user_encodings[0]
            else:
                # Load from image file path (fallback - only works if file is accessible)
                user_image_path = data['user_image_url']
                if not os.path.exists(user_image_path):
                    return jsonify({'error': 'User image file not found'}), 404
                
                user_image = load_image_file(user_image_path)
                user_locations = face_locations(user_image)
                if len(user_locations) == 0:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'No face detected in user image'
                    }), 200
                if len(user_locations) > 1:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'Multiple faces detected in user image'
                    }), 200

                user_encodings = face_encodings(user_image, user_locations)
                
                if len(user_encodings) == 0:
                    return jsonify({
                        'success': False,
                        'is_match': False,
                        'message': 'Failed to generate face encoding from user image'
                    }), 200
                
                user_encoding = user_encodings[0]
        
        # Ensure we have a user encoding at this point
        if user_encoding is None:
            return jsonify({'error': 'Failed to obtain user encoding from any source'}), 400
        
        # Compare faces
        distance = np.linalg.norm(live_encoding - user_encoding)
        threshold = data.get('threshold', 0.60)  # Default threshold 0.60 to reduce false positives
        is_match = bool(distance < threshold)  # Convert NumPy bool_ to Python bool for JSON serialization
        confidence = max(0, min(100, (1 - distance) * 100))
        
        # Log verification details for debugging
        print(f"[VERIFY] Distance: {distance:.4f}, Threshold: {threshold}, Match: {is_match}, Confidence: {confidence:.2f}%")
        
        return jsonify({
            'success': True,
            'is_match': is_match,
            'distance': float(distance),
            'threshold': float(threshold),
            'confidence': float(confidence),
            'message': 'Face verified successfully' if is_match else f'Face verification failed (distance: {distance:.4f}, threshold: {threshold})'
        }), 200
        
    except Exception as e:
        print(f"Error in verify_face: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/extract-encoding', methods=['POST'])
def extract_encoding():
    """Extract face encoding from uploaded image file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Load and process image
            image = load_image_file(filepath)
            encodings = face_encodings(image, face_locations(image))
            
            if len(encodings) == 0:
                return jsonify({
                    'success': False,
                    'message': 'No face detected in the image'
                }), 200
            
            if len(encodings) > 1:
                return jsonify({
                    'success': False,
                    'message': 'Multiple faces detected. Please ensure only one person is in the image.'
                }), 200
            
            # Convert to base64
            encoding_json = json.dumps(encodings[0].tolist())
            encoding_base64 = base64.b64encode(encoding_json.encode()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'face_encoding': encoding_base64,
                'message': 'Face encoding extracted successfully'
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
        
    except Exception as e:
        print(f"Error in extract_encoding: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)


