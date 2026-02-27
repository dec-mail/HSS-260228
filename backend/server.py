from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import random
import string
import aiofiles
import shutil
import bcrypt
import jwt
import cloudinary
import cloudinary.uploader
import re


def generate_property_code(address: str, city: str, state: str) -> str:
    """Generate property code: STATE-SUB-STR-NUM e.g. QLD-KUR-SAI-44"""
    state_code = (state or "XX").upper().strip()
    suburb_code = re.sub(r'[^A-Z]', '', (city or "XXX").upper()[:3]).ljust(3, 'X')
    addr = (address or "").strip()
    num_match = re.match(r'^(\d+[A-Za-z]?)\s+', addr)
    street_num = num_match.group(1) if num_match else "0"
    street_part = addr[num_match.end():] if num_match else addr
    street_code = re.sub(r'[^A-Z]', '', street_part.upper()[:3]).ljust(3, 'X')
    return f"{state_code}-{suburb_code}-{street_code}-{street_num}"

# Import email service
from email_service import (
    send_access_code_email,
    send_application_submitted_email,
    send_application_approved_email,
    send_application_rejected_email,
    send_contact_form_email,
    send_contact_confirmation_email,
    send_password_reset_email,
    send_registration_welcome_email
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'hss-secret-key-change-in-production-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: Literal["admin", "member"] = "member"
    created_at: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: str
    created_at: str

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    application_id: str
    
    # Step 1: Personal Details
    shared_housing_type: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: str
    address: str
    city: str
    state: str
    postcode: str
    
    # Step 2: Financial
    pension_status: str
    weekly_budget: float
    has_assets: bool
    assets_description: Optional[str] = None
    
    # Step 3: Health & Accessibility
    mobility_level: str
    medical_conditions: Optional[str] = None
    requires_care: bool
    care_details: Optional[str] = None
    
    # Step 4: Lifestyle
    is_smoker: bool
    has_pets: bool
    pet_details: Optional[str] = None
    dietary_preferences: str
    interests: str
    daily_routine: str
    
    # Step 5: Safety & Risk
    criminal_history: bool
    criminal_details: Optional[str] = None
    references: str
    
    # Step 6: Housemate Preferences
    preferred_age_range: str
    preferred_location: str
    preferred_interests: str
    
    # Metadata
    status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: str
    updated_at: str
    
class ApplicationCreate(BaseModel):
    shared_housing_type: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: str
    address: str
    city: str
    state: str
    postcode: str
    pension_status: str
    weekly_budget: float
    has_assets: bool
    assets_description: Optional[str] = None
    mobility_level: str
    medical_conditions: Optional[str] = None
    requires_care: bool
    care_details: Optional[str] = None
    is_smoker: bool
    has_pets: bool
    pet_details: Optional[str] = None
    dietary_preferences: str
    interests: str
    daily_routine: str
    criminal_history: bool
    criminal_details: Optional[str] = None
    references: str
    preferred_age_range: str
    preferred_location: str
    preferred_interests: str

class AdminNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    note_id: str
    application_id: str
    admin_user_id: str
    note: str
    created_at: str

class Shortlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shortlist_id: str
    user_id: str
    shortlisted_user_id: str
    created_at: str

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    log_id: str
    application_id: str
    action: str
    admin_user_id: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    timestamp: str


class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    property_id: str
    added_by_user_id: Optional[str] = None
    
    # Basic Info (Required)
    city: str  # Suburb/Town - Required
    state: str  # Required
    weekly_rent_per_person: float  # Required
    
    # Property Details (Optional)
    property_type: Optional[str] = "house"
    address: Optional[str] = None  # Can be TBA
    postcode: Optional[str] = None
    
    # Accommodation Details (Optional - can be TBA/NA)
    total_bedrooms: Optional[int] = None
    available_bedrooms: Optional[int] = None
    total_bathrooms: Optional[int] = None
    
    # Financial (Optional)
    bond_required: Optional[float] = None
    
    # Amenities (Optional)
    amenities: Optional[List[str]] = []
    
    # Availability (Optional)
    available_from: Optional[str] = None
    
    # Images (Optional - up to 20)
    images: Optional[List[str]] = []
    
    # Description (Optional)
    description: Optional[str] = None
    
    # Additional fields
    house_rules: Optional[str] = None
    pet_policy: Optional[str] = None
    smoking_policy: Optional[str] = None
    lease_term: Optional[str] = None
    
    # Status
    status: Literal["active", "inactive", "pending"] = "active"
    
    # Metadata
    created_at: str
    updated_at: str

class PropertyCreate(BaseModel):
    # Required fields (minimal)
    city: str  # Suburb/Town - Required
    state: str  # Required
    weekly_rent_per_person: float  # Required
    
    # Optional fields
    property_type: Optional[str] = "house"
    address: Optional[str] = None
    postcode: Optional[str] = None
    total_bedrooms: Optional[int] = None
    available_bedrooms: Optional[int] = None
    total_bathrooms: Optional[int] = None
    bond_required: Optional[float] = None
    amenities: Optional[List[str]] = []
    available_from: Optional[str] = None
    images: Optional[List[str]] = []
    description: Optional[str] = None
    house_rules: Optional[str] = None
    pet_policy: Optional[str] = None
    smoking_policy: Optional[str] = None
    lease_term: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> User:
    """Extract user from JWT token (cookie or Authorization header)"""
    token = None
    
    # Check cookie first
    token = request.cookies.get("auth_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Decode token
    payload = decode_jwt_token(token)
    
    # Get user from database
    user_doc = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Ensure user is an admin"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "House Sharing Seniors API"}

# ============ AUTH ROUTES ============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    """Register a new user account - only for approved applicants"""
    # Check if there's an approved application for this email
    approved_app = await db.applications.find_one({"email": req.email, "status": "approved"}, {"_id": 0})
    if not approved_app:
        raise HTTPException(status_code=400, detail="Registration requires an approved application. Please submit an application first and wait for approval.")
    
    # Check if user already exists with a password (already registered)
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing and existing.get("password_hash"):
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please login instead.")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        # User doc was created during approval but has no password - update it
        await db.users.update_one(
            {"email": req.email},
            {"$set": {
                "password_hash": hash_password(req.password),
                "name": req.name,
                "application_id": approved_app.get("application_id")
            }}
        )
        user_id = existing["user_id"]
        user_doc = {**existing, "name": req.name, "application_id": approved_app.get("application_id")}
    else:
        # No user doc exists yet - create one
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": req.email,
            "name": req.name,
            "password_hash": hash_password(req.password),
            "picture": None,
            "role": "member",
            "application_id": approved_app.get("application_id"),
            "created_at": now
        }
        await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, req.email, "member")
    
    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRY_HOURS * 3600
    )
    
    # Send welcome email
    await send_registration_welcome_email(req.email, req.name)
    
    # Return user (without password_hash and _id)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": User(**user_doc).model_dump(), "token": token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    """Login with email and password"""
    # Find user
    user_doc = await db.users.find_one({"email": req.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not user_doc.get("password_hash") or not verify_password(req.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_jwt_token(user_doc["user_id"], req.email, user_doc["role"])
    
    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRY_HOURS * 3600
    )
    
    # Return user (without password_hash and _id)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": User(**user_doc).model_dump(), "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout - clear auth cookie"""
    response.delete_cookie(key="auth_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

# ============ PASSWORD MANAGEMENT ============

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Send password reset email"""
    user_doc = await db.users.find_one({"email": req.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user_doc or not user_doc.get("password_hash"):
        return {"message": "If an account exists with that email, a reset link has been sent."}
    
    # Generate reset token
    reset_token = uuid.uuid4().hex
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    
    # Invalidate any existing tokens for this email
    await db.password_reset_tokens.delete_many({"email": req.email})
    
    # Store token
    await db.password_reset_tokens.insert_one({
        "token": reset_token,
        "email": req.email,
        "user_id": user_doc["user_id"],
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Build reset link using frontend URL
    frontend_url = os.environ.get("FRONTEND_URL", "")
    if not frontend_url:
        # Derive from request or use a sensible default
        frontend_url = ""
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Send email
    await send_password_reset_email(req.email, user_doc.get("name", "User"), reset_link)
    
    return {"message": "If an account exists with that email, a reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Reset password using token"""
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find the token
    token_doc = await db.password_reset_tokens.find_one({"token": req.token, "used": False})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")
    
    # Check expiry
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        await db.password_reset_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    # Update password
    new_hash = hash_password(req.password)
    await db.users.update_one(
        {"user_id": token_doc["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
    
    return {"message": "Password reset successfully. You can now login with your new password."}

@api_router.post("/auth/change-password")
async def change_password(req: ChangePasswordRequest, user: User = Depends(get_current_user)):
    """Change password for authenticated user"""
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Get user with password hash
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="Cannot change password for this account")
    
    # Verify current password
    if not verify_password(req.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hash = hash_password(req.new_password)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}


# ============ DRAFT APPLICATION ROUTES (Save/Resume) ============

def generate_access_code():
    """Generate a random 6-character access code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@api_router.post("/applications/start")
async def start_application(request: Request):
    """Start a new application - generate access code"""
    body = await request.json()
    email = body.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Check if there's an existing draft for this email
    existing = await db.draft_applications.find_one({"email": email, "status": "draft"}, {"_id": 0})
    
    if existing:
        # Send reminder email with existing access code
        await send_access_code_email(email, existing["access_code"])
        return {"access_code": existing["access_code"], "existing": True}
    
    # Create new draft
    access_code = generate_access_code()
    draft = {
        "email": email,
        "access_code": access_code,
        "status": "draft",
        "current_step": 1,
        "data": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    await db.draft_applications.insert_one(draft)
    
    # Send email with access code (REAL EMAIL via Resend)
    await send_access_code_email(email, access_code)
    
    return {"access_code": access_code, "existing": False}

@api_router.post("/applications/resume")
async def resume_application(request: Request):
    """Resume an existing application"""
    body = await request.json()
    email = body.get("email")
    access_code = body.get("access_code")
    
    if not email or not access_code:
        raise HTTPException(status_code=400, detail="Email and access code required")
    
    draft = await db.draft_applications.find_one({
        "email": email,
        "access_code": access_code.upper(),
        "status": "draft"
    }, {"_id": 0})
    
    if not draft:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"application": draft.get("data", {}), "current_step": draft.get("current_step", 1)}

@api_router.post("/applications/save")
async def save_application_progress(request: Request):
    """Save application progress"""
    body = await request.json()
    email = body.get("email")
    access_code = body.get("access_code")
    
    if not email or not access_code:
        raise HTTPException(status_code=400, detail="Email and access code required")
    
    # Update draft
    result = await db.draft_applications.update_one(
        {"email": email, "access_code": access_code.upper()},
        {"$set": {
            "data": body,
            "current_step": body.get("current_step", 1),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        # Try to create if doesn't exist
        draft = {
            "email": email,
            "access_code": access_code.upper(),
            "status": "draft",
            "data": body,
            "current_step": body.get("current_step", 1),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        await db.draft_applications.insert_one(draft)
    
    return {"message": "Progress saved"}

@api_router.post("/applications/submit")
async def submit_application_final(request: Request):
    """Submit completed application"""
    body = await request.json()
    email = body.get("email")
    access_code = body.get("access_code")
    
    if not email or not access_code:
        raise HTTPException(status_code=400, detail="Email and access code required")
    
    # Create application from draft
    application_id = f"app_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    app_dict = {
        "application_id": application_id,
        **body,
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }
    
    # Remove access_code and current_step from final application
    app_dict.pop("access_code", None)
    app_dict.pop("current_step", None)
    app_dict.pop("last_updated", None)
    
    await db.applications.insert_one(app_dict)
    
    # Delete draft
    await db.draft_applications.delete_one({"email": email, "access_code": access_code.upper()})
    
    # Send confirmation email (REAL EMAIL via Resend)
    applicant_name = body.get("given_name", "Applicant")
    await send_application_submitted_email(email, applicant_name)
    
    # Create audit log
    log_dict = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "application_id": application_id,
        "action": "application_submitted",
        "timestamp": now
    }
    await db.audit_logs.insert_one(log_dict)
    
    return {"application_id": application_id, "message": "Application submitted successfully"}


# ============ APPLICATION ROUTES ============

@api_router.post("/applications", response_model=Application)
async def create_application(application: ApplicationCreate):
    """Submit a new application (public endpoint)"""
    application_id = f"app_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    app_dict = application.model_dump()
    app_dict["application_id"] = application_id
    app_dict["status"] = "pending"
    app_dict["created_at"] = now
    app_dict["updated_at"] = now
    
    await db.applications.insert_one(app_dict)
    
    # Send confirmation email
    await send_application_submitted_email(application.email, application.first_name)
    
    # Create audit log
    log_dict = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "application_id": application_id,
        "action": "application_submitted",
        "timestamp": now
    }
    await db.audit_logs.insert_one(log_dict)
    
    return Application(**app_dict)

@api_router.get("/applications")
async def list_applications(admin: User = Depends(require_admin), status: Optional[str] = None):
    """List all applications (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    applications = []
    cursor = db.applications.find(query).sort("created_at", -1)
    async for doc in cursor:
        doc.pop("_id", None)
        # Return raw docs to handle incomplete applications
        applications.append(doc)
    return applications


# ============ PROPERTY ROUTES ============

# Max 20 images per property, max 10MB per image
MAX_IMAGES_PER_PROPERTY = 20
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@api_router.post("/upload/images")
async def upload_images(files: List[UploadFile] = File(...)):
    """Upload multiple property images to Cloudinary (max 20, PNG/JPG only)"""
    if len(files) > MAX_IMAGES_PER_PROPERTY:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES_PER_PROPERTY} images allowed")
    
    uploaded_urls = []
    errors = []
    
    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            errors.append(f"{file.filename}: Invalid format. Use JPG, PNG, or WebP")
            continue
        
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > MAX_IMAGE_SIZE:
            errors.append(f"{file.filename}: File too large (max 10MB)")
            continue
        
        try:
            content = await file.read()
            import asyncio
            result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                content,
                folder="hss/properties",
                resource_type="image"
            )
            uploaded_urls.append(result["secure_url"])
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {str(e)}")
            errors.append(f"{file.filename}: Upload failed")
    
    return {
        "success": True,
        "uploaded": uploaded_urls,
        "count": len(uploaded_urls),
        "errors": errors
    }

# Keep local fallback for existing images
UPLOAD_DIR = Path(__file__).parent / "uploads" / "properties"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@api_router.get("/uploads/properties/{filename}")
async def get_property_image(filename: str):
    """Serve locally stored property images (legacy fallback)"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    ext = Path(filename).suffix.lower()
    content_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    async with aiofiles.open(file_path, 'rb') as f:
        content = await f.read()
    return Response(content=content, media_type=content_types.get(ext, "application/octet-stream"))

@api_router.post("/properties", response_model=Property)
async def create_property(property_data: PropertyCreate, user: User = Depends(get_current_user)):
    """Create a new property listing"""
    property_id = f"prop_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    prop_dict = property_data.model_dump()
    prop_dict["property_id"] = property_id
    prop_dict["property_code"] = generate_property_code(
        prop_dict.get("address", ""), prop_dict.get("city", ""), prop_dict.get("state", "")
    )
    prop_dict["added_by_user_id"] = user.user_id
    prop_dict["status"] = "active"
    prop_dict["created_at"] = now
    prop_dict["updated_at"] = now
    
    await db.properties.insert_one(prop_dict)
    
    return Property(**prop_dict)

@api_router.post("/properties/bulk")
async def bulk_create_properties(request: Request, user: User = Depends(get_current_user)):
    """Bulk create properties from CSV data"""
    body = await request.json()
    properties_data = body.get("properties", [])
    
    if not properties_data:
        raise HTTPException(status_code=400, detail="No properties provided")
    
    created_properties = []
    errors = []
    
    for idx, prop_data in enumerate(properties_data):
        try:
            property_id = f"prop_{uuid.uuid4().hex[:12]}"
            now = datetime.now(timezone.utc).isoformat()
            
            prop_dict = {
                "property_id": property_id,
                "added_by_user_id": user.user_id,
                "status": "active",
                "created_at": now,
                "updated_at": now,
                **prop_data
            }
            
            await db.properties.insert_one(prop_dict)
            created_properties.append(property_id)
        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})
    
    return {
        "created": len(created_properties),
        "errors": errors,
        "property_ids": created_properties
    }

@api_router.get("/properties", response_model=List[Property])
async def list_properties(status: Optional[str] = None):
    """List all active properties (public endpoint)"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = "active"
    
    properties = await db.properties.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return properties

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """Get property details"""
    prop_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return Property(**prop_doc)

@api_router.patch("/properties/{property_id}")
async def update_property(property_id: str, request: Request, user: User = Depends(get_current_user)):
    """Update property details"""
    prop_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check permission - allow owner or admin
    if prop_doc.get("added_by_user_id") != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this property")
    
    updates = await request.json()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Don't allow changing property_id or created_at
    updates.pop("property_id", None)
    updates.pop("created_at", None)
    updates.pop("added_by_user_id", None)
    
    await db.properties.update_one({"property_id": property_id}, {"$set": updates})
    
    return {"message": "Property updated", "property_id": property_id}

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user: User = Depends(get_current_user)):
    """Delete property (soft delete - set to inactive)"""
    prop_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check permission
    if prop_doc["added_by_user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this property")
    
    await db.properties.update_one(
        {"property_id": property_id},
        {"$set": {"status": "inactive", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Property deleted"}

@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str, admin: User = Depends(require_admin)):
    """Get application details (admin only)"""
    app_doc = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    return Application(**app_doc)

@api_router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str, 
    status: Literal["approved", "rejected"],
    admin: User = Depends(require_admin)
):
    """Approve or reject application (admin only)"""
    app_doc = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = app_doc["status"]
    now = datetime.now(timezone.utc).isoformat()
    
    # Update application status
    await db.applications.update_one(
        {"application_id": application_id},
        {"$set": {"status": status, "updated_at": now}}
    )
    
    # If approved, create user account (if doesn't exist)
    if status == "approved":
        existing_user = await db.users.find_one({"email": app_doc["email"]}, {"_id": 0})
        if not existing_user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_dict = {
                "user_id": user_id,
                "email": app_doc["email"],
                "name": f"{app_doc.get('given_name', app_doc.get('first_name', ''))} {app_doc.get('family_name', app_doc.get('last_name', ''))}",
                "picture": None,
                "role": "member",
                "created_at": now
            }
            await db.users.insert_one(user_dict)
    
    # Create audit log
    log_dict = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "application_id": application_id,
        "action": "status_changed",
        "admin_user_id": admin.user_id,
        "old_status": old_status,
        "new_status": status,
        "timestamp": now
    }
    await db.audit_logs.insert_one(log_dict)
    
    # Send notification email (REAL EMAIL via Resend)
    applicant_name = app_doc.get('given_name', app_doc.get('first_name', 'Applicant'))
    if status == "approved":
        frontend_url = os.environ.get("FRONTEND_URL", "")
        await send_application_approved_email(app_doc["email"], applicant_name, frontend_url)
    else:
        await send_application_rejected_email(app_doc["email"], applicant_name)
    
    return {"message": f"Application {status}", "application_id": application_id, "status": status}

@api_router.post("/applications/bulk-action")
async def bulk_update_applications(request: Request, admin: User = Depends(require_admin)):
    """Approve or reject multiple applications at once"""
    body = await request.json()
    application_ids = body.get("application_ids", [])
    action = body.get("status")
    
    if action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    if not application_ids:
        raise HTTPException(status_code=400, detail="No applications selected")
    
    results = {"success": 0, "failed": 0, "errors": []}
    now = datetime.now(timezone.utc).isoformat()
    
    for app_id in application_ids:
        try:
            app_doc = await db.applications.find_one({"application_id": app_id}, {"_id": 0})
            if not app_doc:
                results["errors"].append(f"{app_id}: not found")
                results["failed"] += 1
                continue
            
            old_status = app_doc["status"]
            await db.applications.update_one(
                {"application_id": app_id},
                {"$set": {"status": action, "updated_at": now}}
            )
            
            if action == "approved":
                existing_user = await db.users.find_one({"email": app_doc["email"]}, {"_id": 0})
                if not existing_user:
                    user_id = f"user_{uuid.uuid4().hex[:12]}"
                    user_dict = {
                        "user_id": user_id,
                        "email": app_doc["email"],
                        "name": f"{app_doc.get('given_name', app_doc.get('first_name', ''))} {app_doc.get('family_name', app_doc.get('last_name', ''))}",
                        "picture": None,
                        "role": "member",
                        "created_at": now
                    }
                    await db.users.insert_one(user_dict)
            
            # Audit log
            await db.audit_logs.insert_one({
                "log_id": f"log_{uuid.uuid4().hex[:12]}",
                "application_id": app_id,
                "action": "bulk_status_changed",
                "admin_user_id": admin.user_id,
                "old_status": old_status,
                "new_status": action,
                "timestamp": now
            })
            
            # Send email
            applicant_name = app_doc.get('given_name', app_doc.get('first_name', 'Applicant'))
            try:
                if action == "approved":
                    frontend_url = os.environ.get("FRONTEND_URL", "")
                    await send_application_approved_email(app_doc["email"], applicant_name, frontend_url)
                else:
                    await send_application_rejected_email(app_doc["email"], applicant_name)
            except Exception as email_err:
                logger.error(f"Email failed for {app_id}: {email_err}")
            
            results["success"] += 1
        except Exception as e:
            results["errors"].append(f"{app_id}: {str(e)}")
            results["failed"] += 1
    
    return {"message": f"Bulk {action}: {results['success']} successful, {results['failed']} failed", **results}

# ============ MEMBER ROUTES ============

@api_router.get("/members")
async def list_members(user: User = Depends(get_current_user)):
    """List all approved members (anonymized for regular users, full for admins)"""
    try:
        members = await db.users.find({"role": "member"}, {"_id": 0}).to_list(1000)
        
        # Anonymize for non-admin users
        if user.role != "admin":
            anonymized_members = []
            for member in members:
                # Create anonymized copy
                anonymized = {
                    "user_id": member["user_id"],
                    "email": "***@***.***",
                    "name": member["name"].split()[0] if member["name"] else "Member",
                    "picture": member.get("picture"),
                    "role": member["role"],
                    "created_at": member["created_at"]
                }
                anonymized_members.append(anonymized)
            return anonymized_members
        
        return members
    except Exception as e:
        logger.error(f"Error fetching members: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch members")

@api_router.get("/members/{user_id}")
async def get_member_profile(user_id: str, user: User = Depends(get_current_user)):
    """Get a member's profile with application details"""
    member = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member.pop("password_hash", None)
    
    # Get application details for richer profile
    app_doc = None
    if member.get("application_id"):
        app_doc = await db.applications.find_one({"application_id": member["application_id"]}, {"_id": 0})
    elif member.get("email"):
        app_doc = await db.applications.find_one({"email": member["email"], "status": "approved"}, {"_id": 0})
    
    profile = {
        "user_id": member["user_id"],
        "name": member.get("name", "Member"),
        "picture": member.get("picture"),
        "role": member.get("role"),
        "created_at": member.get("created_at"),
    }
    
    if app_doc:
        profile["location"] = f"{app_doc.get('city', '')}, {app_doc.get('state', '')}"
        profile["interests"] = app_doc.get("interests", "")
        profile["daily_routine"] = app_doc.get("daily_routine", "")
        profile["housing_type"] = app_doc.get("shared_housing_type", "")
        profile["mobility_level"] = app_doc.get("mobility_level", "")
        profile["is_smoker"] = app_doc.get("is_smoker", False)
        profile["has_pets"] = app_doc.get("has_pets", False)
        profile["dietary_preferences"] = app_doc.get("dietary_preferences", "")
        profile["preferred_location"] = app_doc.get("preferred_location", "")
        profile["preferred_age_range"] = app_doc.get("preferred_age_range", "")
        profile["weekly_budget"] = app_doc.get("weekly_budget")
    
    return profile

# ============ SHORTLIST ROUTES ============

@api_router.post("/shortlists")
async def add_to_shortlist(shortlisted_user_id: str, user: User = Depends(get_current_user)):
    """Add a member to shortlist"""
    # Check if already shortlisted
    existing = await db.shortlists.find_one({
        "user_id": user.user_id,
        "shortlisted_user_id": shortlisted_user_id
    })
    
    if existing:
        return {"message": "Already in shortlist"}
    
    shortlist_dict = {
        "shortlist_id": f"sl_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "shortlisted_user_id": shortlisted_user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shortlists.insert_one(shortlist_dict)
    
    return {"message": "Added to shortlist", "shortlist": Shortlist(**shortlist_dict).model_dump()}

@api_router.get("/shortlists")
async def get_my_shortlists(user: User = Depends(get_current_user)):
    """Get my shortlisted members"""
    shortlists = await db.shortlists.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    # Get user details for each shortlisted user
    result = []
    for sl in shortlists:
        member_doc = await db.users.find_one({"user_id": sl["shortlisted_user_id"]}, {"_id": 0})
        if member_doc:
            result.append({
                "shortlist_id": sl["shortlist_id"],
                "member": User(**member_doc).model_dump(),
                "created_at": sl["created_at"]
            })
    
    return result

@api_router.delete("/shortlists/{shortlist_id}")
async def remove_from_shortlist(shortlist_id: str, user: User = Depends(get_current_user)):
    """Remove from shortlist"""
    result = await db.shortlists.delete_one({
        "shortlist_id": shortlist_id,
        "user_id": user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shortlist entry not found")
    
    return {"message": "Removed from shortlist"}

# ============ EXPRESS INTEREST ROUTES ============

class ExpressInterestRequest(BaseModel):
    property_id: str
    message: Optional[str] = ""
    phone: Optional[str] = ""

@api_router.post("/interests")
async def express_interest(req: ExpressInterestRequest, user: User = Depends(get_current_user)):
    """Express interest in a property"""
    # Check property exists
    prop = await db.properties.find_one({"property_id": req.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if already expressed interest
    existing = await db.property_interests.find_one({
        "user_id": user.user_id, "property_id": req.property_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already expressed interest in this property")
    
    now = datetime.now(timezone.utc).isoformat()
    interest_doc = {
        "interest_id": f"int_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "user_name": user.name,
        "user_email": user.email,
        "property_id": req.property_id,
        "property_location": f"{prop.get('city', '')}, {prop.get('state', '')}",
        "property_address": prop.get("address", "TBA"),
        "message": req.message,
        "phone": req.phone,
        "status": "new",
        "created_at": now
    }
    await db.property_interests.insert_one(interest_doc)
    
    # Email admin about the interest
    try:
        from email_service import send_email
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a2332;">New Property Interest</h2>
            <p><strong>{user.name}</strong> ({user.email}) has expressed interest in a property.</p>
            <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px; border-bottom:1px solid #eee; font-weight:bold;">Property:</td><td style="padding:8px; border-bottom:1px solid #eee;">{prop.get('address', 'TBA')} - {prop.get('city')}, {prop.get('state')}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee; font-weight:bold;">Rent:</td><td style="padding:8px; border-bottom:1px solid #eee;">${prop.get('weekly_rent_per_person')}/week</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee; font-weight:bold;">Phone:</td><td style="padding:8px; border-bottom:1px solid #eee;">{req.phone or 'Not provided'}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">Message:</td><td style="padding:8px;">{req.message or 'No message'}</td></tr>
            </table>
        </div>
        """
        admin_email = os.environ.get("ADMIN_EMAIL", "apps@decsites.org")
        await send_email(admin_email, f"[Interest] {user.name} - {prop.get('city')}, {prop.get('state')}", admin_html)
    except Exception as e:
        logger.error(f"Failed to send interest notification: {e}")
    
    interest_doc.pop("_id", None)
    return {"message": "Interest expressed successfully", "interest_id": interest_doc["interest_id"]}

@api_router.get("/interests")
async def list_interests(admin: User = Depends(require_admin)):
    """List all property interests (admin only)"""
    interests = await db.property_interests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return interests

@api_router.get("/interests/my")
async def get_my_interests(user: User = Depends(get_current_user)):
    """Get current user's interests"""
    interests = await db.property_interests.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return interests

@api_router.patch("/interests/{interest_id}/status")
async def update_interest_status(interest_id: str, request: Request, admin: User = Depends(require_admin)):
    """Update interest status (admin only)"""
    body = await request.json()
    new_status = body.get("status", "reviewed")
    result = await db.property_interests.update_one(
        {"interest_id": interest_id},
        {"$set": {"status": new_status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Interest not found")
    return {"message": f"Interest marked as {new_status}"}

# ============ FAVORITES ROUTES ============

class FavoriteRequest(BaseModel):
    item_id: str
    item_type: Literal["property", "member"]

@api_router.post("/favorites")
async def add_favorite(req: FavoriteRequest, user: User = Depends(get_current_user)):
    """Add a property or member to favorites"""
    existing = await db.favorites.find_one({
        "user_id": user.user_id, "item_id": req.item_id, "item_type": req.item_type
    })
    if existing:
        return {"message": "Already in favorites"}
    
    fav_doc = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "item_id": req.item_id,
        "item_type": req.item_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(fav_doc)
    fav_doc.pop("_id", None)
    return {"message": "Added to favorites", "favorite": fav_doc}

@api_router.get("/favorites")
async def get_my_favorites(user: User = Depends(get_current_user), item_type: Optional[str] = None):
    """Get current user's favorites"""
    query = {"user_id": user.user_id}
    if item_type:
        query["item_type"] = item_type
    
    favs = await db.favorites.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with item details
    result = []
    for fav in favs:
        item_data = None
        if fav["item_type"] == "property":
            item_data = await db.properties.find_one({"property_id": fav["item_id"]}, {"_id": 0})
        elif fav["item_type"] == "member":
            item_data = await db.users.find_one({"user_id": fav["item_id"]}, {"_id": 0})
            if item_data:
                item_data.pop("password_hash", None)
        
        if item_data:
            result.append({**fav, "item_data": item_data})
    
    return result

@api_router.delete("/favorites/{favorite_id}")
async def remove_favorite(favorite_id: str, user: User = Depends(get_current_user)):
    """Remove from favorites"""
    result = await db.favorites.delete_one({
        "favorite_id": favorite_id, "user_id": user.user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# ============ PROPERTY GROUPS ROUTES ============

class CreatePropertyGroupRequest(BaseModel):
    property_id: str
    name: Optional[str] = ""
    group_type: Optional[str] = ""  # Couples/SingleFemale/SingleMale/Mixed
    is_couple: Optional[bool] = False  # Creator is a couple (counts as 1 spot)

@api_router.post("/groups")
async def create_property_group(req: CreatePropertyGroupRequest, user: User = Depends(get_current_user)):
    """Create a new group tied to a property"""
    # Verify property exists
    prop = await db.properties.find_one({"property_id": req.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    max_spots = prop.get("total_bedrooms") or prop.get("available_bedrooms") or 4
    
    # Auto-generate group name: PropertyCity-GroupLetter
    existing_groups = await db.groups.find({"property_id": req.property_id}).to_list(100)
    letter = chr(65 + len(existing_groups))  # A, B, C...
    city_short = prop.get("city", "HSS")[:10].replace(" ", "")
    auto_name = f"{city_short}-{letter}"
    
    now = datetime.now(timezone.utc).isoformat()
    group_doc = {
        "group_id": f"grp_{uuid.uuid4().hex[:8]}",
        "property_id": req.property_id,
        "property_city": prop.get("city", ""),
        "property_state": prop.get("state", ""),
        "property_rent": prop.get("weekly_rent_per_person", 0),
        "name": req.name or auto_name,
        "group_type": req.group_type or "Mixed",
        "status": "vacancies",
        "max_spots": max_spots,
        "created_by": user.user_id,
        "creator_name": user.name,
        "members": [{
            "user_id": user.user_id,
            "name": user.name,
            "is_couple": req.is_couple,
            "joined_at": now
        }],
        "waitlist": [],
        "created_at": now
    }
    await db.groups.insert_one(group_doc)
    group_doc.pop("_id", None)
    return group_doc

@api_router.get("/groups")
async def list_groups(user: User = Depends(get_current_user), property_id: Optional[str] = None):
    """List groups, optionally filtered by property"""
    query = {}
    if property_id:
        query["property_id"] = property_id
    groups = await db.groups.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Add computed fields
    for g in groups:
        occupied = len(g.get("members", []))
        g["spots_taken"] = occupied
        g["spots_available"] = max(0, g.get("max_spots", 4) - occupied)
        g["waitlist_count"] = len(g.get("waitlist", []))
    return groups

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, user: User = Depends(get_current_user)):
    """Get group details"""
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    occupied = len(group.get("members", []))
    group["spots_taken"] = occupied
    group["spots_available"] = max(0, group.get("max_spots", 4) - occupied)
    return group

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, request: Request, user: User = Depends(get_current_user)):
    """Join a property group or get waitlisted"""
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    is_couple = body.get("is_couple", False)
    
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check not already member or waitlisted
    all_user_ids = [m["user_id"] for m in group.get("members", [])] + [w["user_id"] for w in group.get("waitlist", [])]
    if user.user_id in all_user_ids:
        return {"message": "Already in this group or waitlisted"}
    
    now = datetime.now(timezone.utc).isoformat()
    member_entry = {"user_id": user.user_id, "name": user.name, "is_couple": is_couple, "joined_at": now}
    
    max_spots = group.get("max_spots", 4)
    current_members = len(group.get("members", []))
    
    if current_members < max_spots:
        # Add as member
        await db.groups.update_one({"group_id": group_id}, {"$push": {"members": member_entry}})
        new_count = current_members + 1
        if new_count >= max_spots:
            await db.groups.update_one({"group_id": group_id}, {"$set": {"status": "full"}})
        return {"message": "Joined group", "position": "member"}
    else:
        # Add to waitlist
        await db.groups.update_one({"group_id": group_id}, {"$push": {"waitlist": member_entry}})
        waitlist_pos = len(group.get("waitlist", [])) + 1
        return {"message": f"Group is full. Added to waitlist (position {waitlist_pos})", "position": "waitlist"}

@api_router.post("/groups/{group_id}/leave")
async def leave_group(group_id: str, user: User = Depends(get_current_user)):
    """Leave a group — auto-promotes from waitlist"""
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    was_member = any(m["user_id"] == user.user_id for m in group.get("members", []))
    
    # Remove from members or waitlist
    await db.groups.update_one({"group_id": group_id}, {"$pull": {"members": {"user_id": user.user_id}}})
    await db.groups.update_one({"group_id": group_id}, {"$pull": {"waitlist": {"user_id": user.user_id}}})
    
    # Auto-promote from waitlist if a member left
    if was_member and group.get("waitlist"):
        promoted = group["waitlist"][0]
        await db.groups.update_one(
            {"group_id": group_id},
            {"$push": {"members": promoted}, "$pull": {"waitlist": {"user_id": promoted["user_id"]}}, "$set": {"status": "vacancies"}}
        )
        # TODO: send notification to promoted user
    elif was_member:
        await db.groups.update_one({"group_id": group_id}, {"$set": {"status": "vacancies"}})
    
    return {"message": "Left group"}

@api_router.post("/groups/{group_id}/invite")
async def invite_to_group(group_id: str, request: Request, user: User = Depends(get_current_user)):
    """Invite another user to a group"""
    body = await request.json()
    invite_user_id = body.get("user_id")
    if not invite_user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check inviter is a member
    if not any(m["user_id"] == user.user_id for m in group.get("members", [])):
        raise HTTPException(status_code=403, detail="Only group members can invite")
    
    invited_user = await db.users.find_one({"user_id": invite_user_id}, {"_id": 0})
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send in-app message as invitation
    now = datetime.now(timezone.utc).isoformat()
    pair = sorted([user.user_id, invite_user_id])
    conversation_id = f"conv_{pair[0]}_{pair[1]}"
    
    prop = await db.properties.find_one({"property_id": group["property_id"]}, {"_id": 0})
    prop_name = f"{prop.get('city', '')}, {prop.get('state', '')}" if prop else "a property"
    
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "from_user_id": user.user_id,
        "from_name": user.name,
        "to_user_id": invite_user_id,
        "to_name": invited_user.get("name", ""),
        "content": f"You're invited to join group '{group['name']}' for {prop_name}! Go to the property page to join.",
        "read": False,
        "created_at": now
    }
    await db.messages.insert_one(msg_doc)
    
    return {"message": f"Invitation sent to {invited_user.get('name', 'user')}"}

@api_router.patch("/groups/{group_id}/status")
async def update_group_status(group_id: str, request: Request, admin: User = Depends(require_admin)):
    """Admin: update group status"""
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ("vacancies", "full", "fulfilled", "on_hold"):
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.groups.update_one({"group_id": group_id}, {"$set": {"status": new_status}})
    return {"message": f"Group status updated to {new_status}"}

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str, user: User = Depends(get_current_user)):
    """Delete a group (creator or admin only)"""
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group["created_by"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the group creator or admin can delete")
    await db.groups.delete_one({"group_id": group_id})
    return {"message": "Group deleted"}

# ============ MESSAGING ROUTES ============

class SendMessageRequest(BaseModel):
    to_user_id: str
    content: str

@api_router.post("/messages")
async def send_message(req: SendMessageRequest, user: User = Depends(get_current_user)):
    """Send a message to another user"""
    if req.to_user_id == user.user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    recipient = await db.users.find_one({"user_id": req.to_user_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Create conversation_id (sorted so it's the same regardless of direction)
    pair = sorted([user.user_id, req.to_user_id])
    conversation_id = f"conv_{pair[0]}_{pair[1]}"
    
    now = datetime.now(timezone.utc).isoformat()
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "from_user_id": user.user_id,
        "from_name": user.name,
        "to_user_id": req.to_user_id,
        "to_name": recipient.get("name", ""),
        "content": req.content,
        "read": False,
        "created_at": now
    }
    await db.messages.insert_one(msg_doc)
    msg_doc.pop("_id", None)
    return msg_doc

@api_router.get("/messages/conversations")
async def get_conversations(user: User = Depends(get_current_user)):
    """Get list of conversations for current user"""
    pipeline = [
        {"$match": {"$or": [{"from_user_id": user.user_id}, {"to_user_id": user.user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$conversation_id",
            "last_message": {"$first": "$$ROOT"},
            "unread_count": {"$sum": {"$cond": [
                {"$and": [{"$eq": ["$to_user_id", user.user_id]}, {"$eq": ["$read", False]}]}, 1, 0
            ]}}
        }},
        {"$sort": {"last_message.created_at": -1}},
        {"$project": {"_id": 0, "conversation_id": "$_id", "last_message": 1, "unread_count": 1}}
    ]
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    # Clean _id from last_message
    for c in conversations:
        c["last_message"].pop("_id", None)
    return conversations

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, user: User = Depends(get_current_user)):
    """Get messages in a conversation"""
    messages = await db.messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    # Verify user is part of this conversation
    if messages and messages[0]["from_user_id"] != user.user_id and messages[0]["to_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark messages as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "to_user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return messages

@api_router.get("/messages/unread/count")
async def get_unread_count(user: User = Depends(get_current_user)):
    """Get total unread message count"""
    count = await db.messages.count_documents({"to_user_id": user.user_id, "read": False})
    return {"unread_count": count}

# ============ ADMIN NOTES ROUTES ============

@api_router.post("/admin-notes")
async def add_admin_note(application_id: str, note: str, admin: User = Depends(require_admin)):
    """Add admin note to application"""
    note_dict = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "application_id": application_id,
        "admin_user_id": admin.user_id,
        "note": note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_notes.insert_one(note_dict)
    return {"message": "Note added", "note": AdminNote(**note_dict).model_dump()}

@api_router.get("/admin-notes/{application_id}")
async def get_admin_notes(application_id: str, admin: User = Depends(require_admin)):
    """Get all notes for an application"""
    notes = await db.admin_notes.find({"application_id": application_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return notes

# ============ CONTACT FORM ============

class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

@api_router.post("/contact")
async def submit_contact_form(contact: ContactFormRequest):
    """Submit contact form and send emails"""
    try:
        # Send to admin
        await send_contact_form_email(
            name=contact.name,
            email=contact.email,
            phone=contact.phone or "",
            subject=contact.subject,
            message=contact.message
        )
        
        # Send confirmation to user
        await send_contact_confirmation_email(contact.email, contact.name)
        
        # Store in database for records
        contact_dict = {
            "contact_id": f"contact_{uuid.uuid4().hex[:12]}",
            **contact.model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.contact_submissions.insert_one(contact_dict)
        
        return {"success": True, "message": "Message sent successfully"}
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

# ============ INCLUDE ROUTER ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def seed_admin():
    """Create default admin user if not exists"""
    admin_email = "admin@housesharingseniors.com.au"
    admin_exists = await db.users.find_one({"email": admin_email})
    
    if not admin_exists:
        admin_doc = {
            "user_id": "user_admin001",
            "email": admin_email,
            "name": "HSS Admin",
            "password_hash": hash_password(os.environ.get("ADMIN_PASSWORD", "HSSadmin2024!")),
            "picture": None,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Created default admin user: {admin_email}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
