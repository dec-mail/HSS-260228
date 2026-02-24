"""
Backend API Tests for House Sharing Seniors Platform
Tests properties API endpoints and application flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestHealthCheck:
    """Test API health and basic connectivity"""
    
    def test_api_root(self):
        """Test API root endpoint returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "House Sharing Seniors API"


class TestPropertiesAPI:
    """Test properties endpoints"""
    
    def test_list_properties_returns_empty_or_list(self):
        """Test GET /api/properties returns array (empty or with properties)"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} properties")
    
    def test_get_nonexistent_property_returns_404(self):
        """Test GET /api/properties/{id} returns 404 for non-existent property"""
        response = requests.get(f"{BASE_URL}/api/properties/prop_nonexistent123")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Property not found"


class TestApplicationAPI:
    """Test application submission endpoints"""
    
    def test_start_application_valid_email(self):
        """Test POST /api/applications/start creates draft application"""
        test_email = "test_application_start@example.com"
        response = requests.post(
            f"{BASE_URL}/api/applications/start",
            json={"email": test_email}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_code" in data
        assert isinstance(data["access_code"], str)
        assert len(data["access_code"]) == 6  # Access code is 6 characters
        print(f"Access code generated: {data['access_code']}")
    
    def test_start_application_missing_email(self):
        """Test POST /api/applications/start fails without email"""
        response = requests.post(
            f"{BASE_URL}/api/applications/start",
            json={}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Email required" in data["detail"]
    
    def test_resume_application_invalid_code(self):
        """Test POST /api/applications/resume fails with invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/applications/resume",
            json={"email": "test@example.com", "access_code": "INVALID"}
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    def test_save_application_progress(self):
        """Test POST /api/applications/save saves progress"""
        test_email = "test_save_progress@example.com"
        
        # First start an application to get access code
        start_response = requests.post(
            f"{BASE_URL}/api/applications/start",
            json={"email": test_email}
        )
        assert start_response.status_code == 200
        access_code = start_response.json()["access_code"]
        
        # Now save progress
        save_response = requests.post(
            f"{BASE_URL}/api/applications/save",
            json={
                "email": test_email,
                "access_code": access_code,
                "current_step": 2,
                "first_name": "Test",
                "last_name": "User"
            }
        )
        assert save_response.status_code == 200
        data = save_response.json()
        assert "message" in data
        assert data["message"] == "Progress saved"
        print("Application progress saved successfully")


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_auth_me_unauthenticated(self):
        """Test GET /api/auth/me returns 401 when not authenticated"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_logout_unauthenticated(self):
        """Test POST /api/auth/logout returns 401 when not authenticated"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 401


class TestAdminEndpoints:
    """Test admin-protected endpoints return 401 without auth"""
    
    def test_list_applications_requires_auth(self):
        """Test GET /api/applications requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/applications")
        assert response.status_code == 401
    
    def test_get_application_requires_auth(self):
        """Test GET /api/applications/{id} requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/applications/app_test123")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
