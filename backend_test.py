import requests
import sys
from datetime import datetime
import json

class HouseSharingAPITester:
    def __init__(self, base_url="https://shared-living-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
        self.test_application_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log(self, message, is_error=False):
        prefix = "❌" if is_error else "🔍"
        print(f"{prefix} {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, params=params)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                self.log(f"❌ Failed - Expected {expected_status}, got {response.status_code}", True)
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", True)
                except:
                    self.log(f"   Response text: {response.text[:200]}", True)
                return False, {}

        except Exception as e:
            self.log(f"❌ Failed - Error: {str(e)}", True)
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_create_application(self):
        """Test creating a new application"""
        timestamp = datetime.now().strftime('%H%M%S')
        application_data = {
            "first_name": "John",
            "last_name": "Smith",
            "email": f"john.smith.{timestamp}@example.com",
            "phone": "0412345678",
            "date_of_birth": "1955-06-15",
            "address": "123 Test Street",
            "city": "Sydney",
            "state": "NSW",
            "postcode": "2000",
            "pension_status": "full",
            "weekly_budget": 250.0,
            "has_assets": False,
            "mobility_level": "independent",
            "requires_care": False,
            "is_smoker": False,
            "has_pets": False,
            "dietary_preferences": "none",
            "interests": "Reading, gardening",
            "daily_routine": "Early riser, enjoys morning walks",
            "criminal_history": False,
            "references": "Mary Brown, neighbor, 0455123456",
            "preferred_age_range": "65-75",
            "preferred_gender": "any",
            "preferred_location": "Sydney",
            "preferred_interests": "Quiet, enjoys reading"
        }
        
        success, response = self.run_test(
            "Create Application", "POST", "applications", 200, data=application_data
        )
        if success and 'application_id' in response:
            self.test_application_id = response['application_id']
            self.log(f"✅ Created application with ID: {self.test_application_id}")
        return success

    def test_session_creation_invalid(self):
        """Test session creation with invalid session_id"""
        return self.run_test(
            "Invalid Session Creation", "POST", "auth/session", 401, 
            data={"session_id": "invalid_session_id"}
        )

    def test_get_me_without_auth(self):
        """Test getting current user without authentication"""
        return self.run_test("Get Me Without Auth", "GET", "auth/me", 401)

    def test_list_applications_without_auth(self):
        """Test listing applications without admin auth"""
        return self.run_test("List Applications Without Auth", "GET", "applications", 401)

    def test_members_without_auth(self):
        """Test listing members without authentication"""
        return self.run_test("List Members Without Auth", "GET", "members", 401)

    def test_shortlists_without_auth(self):
        """Test shortlists without authentication"""
        return self.run_test("Shortlists Without Auth", "GET", "shortlists", 401)

    def create_test_session(self, role="member"):
        """Create a test user and session for testing protected endpoints"""
        import pymongo
        from datetime import datetime, timezone, timedelta
        import uuid
        
        try:
            # Connect to MongoDB
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client["test_database"]
            
            # Create test user
            timestamp = datetime.now().strftime('%H%M%S')
            user_id = f"test_user_{role}_{timestamp}"
            email = f"test.{role}.{timestamp}@housesharingseniors.com.au"
            session_token = f"test_session_{role}_{timestamp}"
            
            # Insert user
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": f"Test {role.title()} User",
                "picture": "https://via.placeholder.com/150",
                "role": role,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.users.insert_one(user_doc)
            
            # Insert session
            session_doc = {
                "session_token": session_token,
                "user_id": user_id,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.user_sessions.insert_one(session_doc)
            
            self.log(f"✅ Created test {role} user and session")
            client.close()
            return session_token
            
        except Exception as e:
            self.log(f"❌ Failed to create test session: {e}", True)
            return None

    def test_with_authentication(self):
        """Test authenticated endpoints"""
        # Create test sessions
        self.admin_token = self.create_test_session("admin")
        self.member_token = self.create_test_session("member")
        
        if not self.admin_token or not self.member_token:
            self.log("Failed to create test sessions, skipping auth tests", True)
            return False

        # Test authenticated endpoints
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        headers_member = {"Authorization": f"Bearer {self.member_token}"}
        
        # Test get me (admin)
        self.run_test("Get Me (Admin)", "GET", "auth/me", 200, headers=headers_admin)
        
        # Test get me (member)  
        self.run_test("Get Me (Member)", "GET", "auth/me", 200, headers=headers_member)
        
        # Test list applications (admin only)
        success, apps = self.run_test("List Applications (Admin)", "GET", "applications", 200, headers=headers_admin)
        
        # Test list applications (member - should fail)
        self.run_test("List Applications (Member - Should Fail)", "GET", "applications", 403, headers=headers_member)
        
        # Test get specific application if we have one
        if self.test_application_id:
            self.run_test(f"Get Application {self.test_application_id}", "GET", f"applications/{self.test_application_id}", 200, headers=headers_admin)
            
            # Test update application status
            success, _ = self.run_test("Approve Application", "PATCH", f"applications/{self.test_application_id}/status", 200, headers=headers_admin, params={"status": "approved"})
            
            # Test add admin note
            self.run_test("Add Admin Note", "POST", "admin-notes", 200, headers=headers_admin, params={"application_id": self.test_application_id, "note": "Test note"})
            
            # Test get admin notes
            self.run_test("Get Admin Notes", "GET", f"admin-notes/{self.test_application_id}", 200, headers=headers_admin)
        
        # Test list members (authenticated)
        self.run_test("List Members (Admin)", "GET", "members", 200, headers=headers_admin)
        self.run_test("List Members (Member)", "GET", "members", 200, headers=headers_member)
        
        # Test shortlist endpoints
        self.run_test("Get Shortlists (Member)", "GET", "shortlists", 200, headers=headers_member)
        
        return True

def main():
    tester = HouseSharingAPITester()
    
    print("🏠 House Sharing Seniors API Testing")
    print("=" * 50)
    
    # Test public endpoints
    tester.test_root_endpoint()
    tester.test_create_application()
    
    # Test unauthorized access
    tester.test_session_creation_invalid()
    tester.test_get_me_without_auth() 
    tester.test_list_applications_without_auth()
    tester.test_members_without_auth()
    tester.test_shortlists_without_auth()
    
    # Test with authentication
    tester.test_with_authentication()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests Result: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())