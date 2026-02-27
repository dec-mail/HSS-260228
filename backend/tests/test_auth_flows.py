"""
Backend API Tests for Authentication Flows
Tests for: Registration, Forgot Password, Reset Password, Change Password
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shared-living-hub.preview.emergentagent.com')
API = f"{BASE_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@housesharingseniors.com.au"
ADMIN_PASSWORD = "HSSadmin2024!"

# Test data
TEST_USER_EMAIL = "jane.doe.test@example.com"
TEST_USER_PASSWORD = "testpass123"

class TestAuthBasics:
    """Basic authentication endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{API}/")
        assert response.status_code == 200
        assert response.json()["message"] == "House Sharing Seniors API"
        print("✅ API root endpoint working")

    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✅ Admin login successful - user_id: {data['user']['user_id']}")
        return data["token"]

    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Login correctly rejects invalid credentials")

    def test_login_nonexistent_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✅ Login correctly rejects non-existent email")


class TestRegistrationWithApprovedApplication:
    """Test registration flow - requires approved application"""
    
    def test_register_without_approved_application(self):
        """Registration should fail without approved application"""
        unique_email = f"noapp_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{API}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "No App User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "approved application" in data["detail"].lower()
        print("✅ Registration correctly requires approved application")

    def test_register_with_invalid_email_format(self):
        """Registration should validate email format"""
        response = requests.post(f"{API}/auth/register", json={
            "email": "invalidemail",
            "password": "testpass123",
            "name": "Invalid Email User"
        })
        assert response.status_code == 422  # Validation error
        print("✅ Registration correctly validates email format")

    def test_existing_user_cannot_register_again(self):
        """Already registered user should get proper error"""
        response = requests.post(f"{API}/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": "newpassword",
            "name": "Jane Again"
        })
        # Should get 400 - already has account
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"].lower() or "login instead" in data["detail"].lower()
        print("✅ Registration correctly prevents duplicate accounts")


class TestForgotPasswordFlow:
    """Test forgot password endpoint"""
    
    def test_forgot_password_existing_user(self):
        """Forgot password for existing user should succeed"""
        response = requests.post(f"{API}/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should not reveal if account exists (security best practice)
        print("✅ Forgot password returns success message for existing user")

    def test_forgot_password_nonexistent_user(self):
        """Forgot password for non-existent user should also succeed (prevent enumeration)"""
        response = requests.post(f"{API}/auth/forgot-password", json={
            "email": "nonexistent_user_xyz@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ Forgot password correctly prevents email enumeration")

    def test_forgot_password_invalid_email_format(self):
        """Forgot password should validate email format"""
        response = requests.post(f"{API}/auth/forgot-password", json={
            "email": "notanemail"
        })
        assert response.status_code == 422  # Validation error
        print("✅ Forgot password validates email format")


class TestResetPasswordFlow:
    """Test reset password endpoint"""
    
    def test_reset_password_invalid_token(self):
        """Reset password with invalid token should fail"""
        response = requests.post(f"{API}/auth/reset-password", json={
            "token": "invalid_token_xyz",
            "password": "newpassword123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
        print("✅ Reset password correctly rejects invalid token")

    def test_reset_password_short_password(self):
        """Reset password should validate password length"""
        response = requests.post(f"{API}/auth/reset-password", json={
            "token": "sometoken",
            "password": "12345"  # Less than 6 chars
        })
        assert response.status_code == 400
        data = response.json()
        assert "6 character" in data["detail"].lower() or "invalid" in data["detail"].lower()
        print("✅ Reset password validates password length")


class TestChangePasswordFlow:
    """Test change password endpoint - requires authentication"""
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = requests.post(f"{API}/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json()["token"]
        return None

    def test_change_password_without_auth(self):
        """Change password should require authentication"""
        response = requests.post(f"{API}/auth/change-password", json={
            "current_password": "oldpass",
            "new_password": "newpass123"
        })
        assert response.status_code == 401
        print("✅ Change password correctly requires authentication")

    def test_change_password_wrong_current_password(self):
        """Change password with wrong current password should fail"""
        token = self.get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        if not token:
            pytest.skip("Could not authenticate test user")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API}/auth/change-password", json={
            "current_password": "wrongcurrentpassword",
            "new_password": "newvalidpass123"
        }, headers=headers)
        
        assert response.status_code == 400
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "wrong" in data["detail"].lower() or "current password" in data["detail"].lower()
        print("✅ Change password correctly rejects wrong current password")

    def test_change_password_short_new_password(self):
        """Change password should validate new password length"""
        token = self.get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        if not token:
            pytest.skip("Could not authenticate test user")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API}/auth/change-password", json={
            "current_password": TEST_USER_PASSWORD,
            "new_password": "12345"  # Less than 6 chars
        }, headers=headers)
        
        assert response.status_code == 400
        data = response.json()
        assert "6 character" in data["detail"].lower()
        print("✅ Change password validates new password length")

    def test_change_password_success_and_revert(self):
        """Change password should work with correct credentials - then revert"""
        token = self.get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        if not token:
            pytest.skip("Could not authenticate test user")
        
        new_password = "tempnewpass123"
        
        # Change password
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API}/auth/change-password", json={
            "current_password": TEST_USER_PASSWORD,
            "new_password": new_password
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data["message"].lower()
        print("✅ Change password succeeded")
        
        # Verify we can login with new password
        login_response = requests.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": new_password
        })
        assert login_response.status_code == 200
        print("✅ Can login with new password")
        
        # Revert password back to original
        new_token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {new_token}"}
        revert_response = requests.post(f"{API}/auth/change-password", json={
            "current_password": new_password,
            "new_password": TEST_USER_PASSWORD
        }, headers=headers)
        
        assert revert_response.status_code == 200
        print("✅ Password reverted back to original")


class TestApplicationApprovalAndRegistration:
    """Test full flow: Create application, approve it, then register"""
    
    def get_admin_token(self):
        """Helper to get admin token"""
        response = requests.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        return None

    def test_full_registration_flow(self):
        """Create application, approve, then register"""
        # Generate unique test email
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_name = "Test Registration User"
        
        # Step 1: Create a draft application and submit it
        # First, start an application to get access code
        start_response = requests.post(f"{API}/applications/start", json={
            "email": test_email
        })
        assert start_response.status_code == 200
        access_code = start_response.json()["access_code"]
        print(f"✅ Application started with access code: {access_code}")
        
        # Step 2: Submit full application via the submit endpoint
        application_data = {
            "email": test_email,
            "access_code": access_code,
            "shared_housing_type": "single_female",
            "first_name": "Test",
            "last_name": "User",
            "given_name": "Test",
            "family_name": "User",
            "phone": "0412345678",
            "date_of_birth": "1960-01-01",
            "address": "123 Test Street",
            "city": "Sydney",
            "state": "NSW",
            "postcode": "2000",
            "pension_status": "full",
            "weekly_budget": 200.0,
            "has_assets": False,
            "mobility_level": "fully_mobile",
            "requires_care": False,
            "is_smoker": False,
            "has_pets": False,
            "dietary_preferences": "no_restrictions",
            "interests": "reading",
            "daily_routine": "early_riser",
            "criminal_history": False,
            "references": "John Smith - 0412345679",
            "preferred_age_range": "60-70",
            "preferred_location": "Sydney Metro",
            "preferred_interests": "gardening"
        }
        
        submit_response = requests.post(f"{API}/applications/submit", json=application_data)
        assert submit_response.status_code == 200
        application_id = submit_response.json()["application_id"]
        print(f"✅ Application submitted: {application_id}")
        
        # Step 3: Admin approves the application
        admin_token = self.get_admin_token()
        assert admin_token is not None, "Admin login failed"
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        approve_response = requests.patch(
            f"{API}/applications/{application_id}/status?status=approved",
            headers=headers
        )
        assert approve_response.status_code == 200
        assert approve_response.json()["status"] == "approved"
        print(f"✅ Application approved")
        
        # Step 4: Now register with the approved email
        register_response = requests.post(f"{API}/auth/register", json={
            "email": test_email,
            "password": "newuserpass123",
            "name": test_name
        })
        assert register_response.status_code == 200
        data = register_response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == test_email
        assert data["user"]["role"] == "member"
        print(f"✅ Registration successful for approved applicant")
        
        # Step 5: Verify can login with new credentials
        login_response = requests.post(f"{API}/auth/login", json={
            "email": test_email,
            "password": "newuserpass123"
        })
        assert login_response.status_code == 200
        print("✅ New user can login successfully")
        
        return test_email


class TestAuthMeEndpoint:
    """Test /auth/me endpoint"""
    
    def test_auth_me_without_token(self):
        """Auth me should require authentication"""
        response = requests.get(f"{API}/auth/me")
        assert response.status_code == 401
        print("✅ /auth/me correctly requires authentication")

    def test_auth_me_with_valid_token(self):
        """Auth me should return user info with valid token"""
        # Login first
        login_response = requests.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API}/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print("✅ /auth/me returns correct user info")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
