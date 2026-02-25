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

# Import email service
from email_service import (
    send_access_code_email,
    send_application_submitted_email,
    send_application_approved_email,
    send_application_rejected_email,
    send_contact_form_email,
    send_contact_confirmation_email
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

async def get_current_user(request: Request) -> User:
    """Extract user from session token (cookie or Authorization header)"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    
    session_token = None
    
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Ensure user is an admin"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ LEGACY MOCK EMAIL HELPER (DEPRECATED - Now using Resend) ============

def send_email_notification(to_email: str, subject: str, body: str):
    """DEPRECATED: Mock email notification - keeping for backwards compatibility"""
    logger.info(f"[DEPRECATED EMAIL MOCK] To: {to_email}")
    logger.info(f"[DEPRECATED EMAIL MOCK] Subject: {subject}")
    # Real emails are now sent via email_service.py using Resend

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "House Sharing Seniors API"}

# ============ AUTH ROUTES ============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for user data and create session"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Failed to exchange session_id: {e}")
            raise HTTPException(status_code=401, detail="Invalid session_id")
    
    # Check if user exists, create if not
    user_doc = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if not user_doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": "member",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "session_token": session_token,
        "user_id": user_doc["user_id"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {"user": User(**user_doc).model_dump()}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()


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


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, user: User = Depends(get_current_user)):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

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
    
    # Send confirmation email (mocked)
    send_email_notification(
        to_email=application.email,
        subject="Application Received - House Sharing Seniors",
        body=f"Dear {application.first_name},\n\nThank you for your application. We will review it and get back to you shortly.\n\nBest regards,\nHouse Sharing Seniors Team"
    )
    
    # Create audit log
    log_dict = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "application_id": application_id,
        "action": "application_submitted",
        "timestamp": now
    }
    await db.audit_logs.insert_one(log_dict)
    
    return Application(**app_dict)

@api_router.get("/applications", response_model=List[Application])
async def list_applications(admin: User = Depends(require_admin), status: Optional[str] = None):
    """List all applications (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    applications = []
    cursor = db.applications.find(query).sort("created_at", -1)
    async for doc in cursor:
        doc.pop("_id", None)
        applications.append(Application(**doc))
    return applications


# ============ PROPERTY ROUTES ============

# Create uploads directory for property images
UPLOAD_DIR = Path(__file__).parent / "uploads" / "properties"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Max 20 images per property, max 10MB per image
MAX_IMAGES_PER_PROPERTY = 20
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@api_router.post("/upload/images")
async def upload_images(files: List[UploadFile] = File(...)):
    """Upload multiple property images (max 20, PNG/JPG only)"""
    if len(files) > MAX_IMAGES_PER_PROPERTY:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES_PER_PROPERTY} images allowed")
    
    uploaded_urls = []
    errors = []
    
    for file in files:
        # Check file extension
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            errors.append(f"{file.filename}: Invalid format. Use JPG, PNG, or WebP")
            continue
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        if size > MAX_IMAGE_SIZE:
            errors.append(f"{file.filename}: File too large (max 10MB)")
            continue
        
        try:
            # Generate unique filename
            unique_name = f"{uuid.uuid4().hex}{ext}"
            file_path = UPLOAD_DIR / unique_name
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            
            # Generate URL (relative path that will be served)
            uploaded_urls.append(f"/api/uploads/properties/{unique_name}")
            
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {str(e)}")
            errors.append(f"{file.filename}: Upload failed")
    
    return {
        "success": True,
        "uploaded": uploaded_urls,
        "count": len(uploaded_urls),
        "errors": errors
    }

@api_router.get("/uploads/properties/{filename}")
async def get_property_image(filename: str):
    """Serve uploaded property images"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine content type
    ext = Path(filename).suffix.lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    async with aiofiles.open(file_path, 'rb') as f:
        content = await f.read()
    
    return Response(content=content, media_type=content_type)

@api_router.post("/properties", response_model=Property)
async def create_property(property_data: PropertyCreate, user: User = Depends(get_current_user)):
    """Create a new property listing"""
    property_id = f"prop_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    prop_dict = property_data.model_dump()
    prop_dict["property_id"] = property_id
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
async def update_property(property_id: str, updates: dict, user: User = Depends(get_current_user)):
    """Update property details"""
    prop_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check permission
    if prop_doc["added_by_user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this property")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.properties.update_one({"property_id": property_id}, {"$set": updates})
    
    return {"message": "Property updated"}

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
        await send_application_approved_email(app_doc["email"], applicant_name)
    else:
        await send_application_rejected_email(app_doc["email"], applicant_name)
    
    return {"message": f"Application {status}", "application_id": application_id, "status": status}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
