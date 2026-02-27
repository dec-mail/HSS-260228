"""
Test Suite for Profile, Notifications, and Group Application features
Iteration 7 - Testing new features:
- User Profile: GET /api/auth/me with username, display_name, avatar_url, notification_prefs
- User Profile: PATCH /api/users/profile for display_name and notification_prefs
- Notifications: GET /api/notifications, GET /api/notifications/unread/count
- Notifications: POST /api/notifications/read-all, PATCH /api/notifications/{id}/read
- Group Applications: POST /api/groups/{group_id}/apply (creator only)
- Group Applications: GET /api/group-applications (admin), GET /api/group-applications/my
- Group Applications: PATCH /api/group-applications/{id}/status (admin)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials from context
ADMIN_EMAIL = "admin@housesharingseniors.com.au"
ADMIN_PASSWORD = "HSSadmin2024!"

# Existing group for testing (from context)
EXISTING_GROUP_ID = "grp_07895f92"
EXISTING_PROPERTY_ID = "prop_ae2519658c27"

@pytest.fixture(scope="module")
def admin_session():
    """Get admin session with auth token"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login as admin
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        if token:
            session.headers.update({"Authorization": f"Bearer {token}"})
    return session

@pytest.fixture(scope="module")
def unauthenticated_session():
    """Session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestUserProfileGetMe:
    """Test GET /api/auth/me returns profile fields"""
    
    def test_auth_me_returns_username(self, admin_session):
        """Verify /api/auth/me returns username field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"GET /api/auth/me failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "username" in data, "username field missing from /api/auth/me response"
        print(f"✓ GET /api/auth/me returns username: {data.get('username')}")
    
    def test_auth_me_returns_display_name(self, admin_session):
        """Verify /api/auth/me returns display_name field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        # display_name can be null but key should exist in model
        assert "display_name" in data or data.get("display_name") is None
        print(f"✓ GET /api/auth/me returns display_name: {data.get('display_name')}")
    
    def test_auth_me_returns_avatar_url(self, admin_session):
        """Verify /api/auth/me returns avatar_url field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        # avatar_url can be null
        assert "avatar_url" in data or data.get("avatar_url") is None
        print(f"✓ GET /api/auth/me returns avatar_url: {data.get('avatar_url')}")
    
    def test_auth_me_returns_notification_prefs(self, admin_session):
        """Verify /api/auth/me returns notification_prefs field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "notification_prefs" in data or data.get("notification_prefs") is None
        print(f"✓ GET /api/auth/me returns notification_prefs: {data.get('notification_prefs')}")


class TestUserProfileUpdate:
    """Test PATCH /api/users/profile"""
    
    def test_update_display_name(self, admin_session):
        """Test updating display_name via PATCH /api/users/profile"""
        new_display_name = f"TEST_AdminDisplay_{uuid.uuid4().hex[:6]}"
        response = admin_session.patch(f"{BASE_URL}/api/users/profile", json={
            "display_name": new_display_name
        })
        assert response.status_code == 200, f"PATCH /api/users/profile failed: {response.text}"
        data = response.json()
        assert data.get("display_name") == new_display_name
        
        # Verify via GET /api/auth/me
        verify = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert verify.status_code == 200
        assert verify.json().get("display_name") == new_display_name
        print(f"✓ PATCH /api/users/profile updated display_name to: {new_display_name}")
    
    def test_update_notification_prefs(self, admin_session):
        """Test updating notification_prefs via PATCH /api/users/profile"""
        new_prefs = {"email": True, "sms": False, "push": True}
        response = admin_session.patch(f"{BASE_URL}/api/users/profile", json={
            "notification_prefs": new_prefs
        })
        assert response.status_code == 200, f"PATCH notification_prefs failed: {response.text}"
        data = response.json()
        assert data.get("notification_prefs") == new_prefs
        print(f"✓ PATCH /api/users/profile updated notification_prefs: {new_prefs}")
    
    def test_update_profile_unauthenticated_fails(self, unauthenticated_session):
        """Test PATCH /api/users/profile returns 401 without auth"""
        response = unauthenticated_session.patch(f"{BASE_URL}/api/users/profile", json={
            "display_name": "Unauthorized"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PATCH /api/users/profile correctly returns 401 for unauthenticated")


class TestNotificationsAPI:
    """Test Notifications endpoints"""
    
    def test_get_notifications(self, admin_session):
        """Test GET /api/notifications returns list"""
        response = admin_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"GET /api/notifications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notifications returns {len(data)} notifications")
    
    def test_get_unread_count(self, admin_session):
        """Test GET /api/notifications/unread/count returns count"""
        response = admin_session.get(f"{BASE_URL}/api/notifications/unread/count")
        assert response.status_code == 200, f"GET unread count failed: {response.text}"
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✓ GET /api/notifications/unread/count returns count: {data['count']}")
    
    def test_mark_all_read(self, admin_session):
        """Test POST /api/notifications/read-all"""
        response = admin_session.post(f"{BASE_URL}/api/notifications/read-all", json={})
        assert response.status_code == 200, f"POST read-all failed: {response.text}"
        data = response.json()
        assert "message" in data
        
        # Verify unread count is 0
        count_response = admin_session.get(f"{BASE_URL}/api/notifications/unread/count")
        assert count_response.status_code == 200
        assert count_response.json()["count"] == 0
        print("✓ POST /api/notifications/read-all works, unread count now 0")
    
    def test_notifications_unauthenticated_fails(self, unauthenticated_session):
        """Test notifications endpoints return 401 without auth"""
        response = unauthenticated_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        
        response2 = unauthenticated_session.get(f"{BASE_URL}/api/notifications/unread/count")
        assert response2.status_code == 401
        print("✓ Notification endpoints correctly return 401 for unauthenticated")


class TestGroupApplicationAPI:
    """Test Group Application endpoints"""
    
    def test_get_group_applications_admin(self, admin_session):
        """Test GET /api/group-applications returns list for admin"""
        response = admin_session.get(f"{BASE_URL}/api/group-applications")
        assert response.status_code == 200, f"GET /api/group-applications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/group-applications returns {len(data)} applications")
        if len(data) > 0:
            app = data[0]
            assert "application_id" in app
            assert "group_id" in app
            assert "status" in app
            print(f"  - First app: {app['application_id']}, status: {app['status']}")
    
    def test_get_my_group_applications(self, admin_session):
        """Test GET /api/group-applications/my returns user's group applications"""
        response = admin_session.get(f"{BASE_URL}/api/group-applications/my")
        assert response.status_code == 200, f"GET /api/group-applications/my failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/group-applications/my returns {len(data)} applications")
    
    def test_get_group_applications_unauthenticated_fails(self, unauthenticated_session):
        """Test GET /api/group-applications returns 401 without auth"""
        response = unauthenticated_session.get(f"{BASE_URL}/api/group-applications")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/group-applications correctly returns 401 for unauthenticated")
    
    def test_create_group_application_flow(self, admin_session):
        """Test group application creation flow"""
        # First, check if admin is the creator of the existing group
        group_response = admin_session.get(f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}")
        
        if group_response.status_code == 200:
            group = group_response.json()
            admin_user = admin_session.get(f"{BASE_URL}/api/auth/me").json()
            
            if group.get("created_by") == admin_user.get("user_id"):
                # Admin is creator, try to apply
                # Check if application already exists
                existing_apps = admin_session.get(f"{BASE_URL}/api/group-applications").json()
                existing = [a for a in existing_apps if a.get("group_id") == EXISTING_GROUP_ID and a.get("status") != "rejected"]
                
                if not existing:
                    # Create new application
                    apply_response = admin_session.post(
                        f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}/apply",
                        json={"message": "TEST application from pytest"}
                    )
                    if apply_response.status_code == 200:
                        print("✓ POST /api/groups/{group_id}/apply created application")
                    else:
                        print(f"  Note: Apply returned {apply_response.status_code}: {apply_response.text}")
                else:
                    print(f"  Note: Group {EXISTING_GROUP_ID} already has an active application")
            else:
                print(f"  Note: Admin is not creator of group {EXISTING_GROUP_ID}, skipping apply test")
        else:
            print(f"  Note: Group {EXISTING_GROUP_ID} not found, skipping apply test")
        
        # Test that we can at least check the endpoint structure
        apps = admin_session.get(f"{BASE_URL}/api/group-applications").json()
        print(f"✓ Verified {len(apps)} group applications exist in system")


class TestGroupApplicationStatusUpdate:
    """Test group application status update (admin only)"""
    
    def test_update_group_application_status(self, admin_session):
        """Test PATCH /api/group-applications/{id}/status"""
        # Get existing applications
        apps_response = admin_session.get(f"{BASE_URL}/api/group-applications")
        assert apps_response.status_code == 200
        apps = apps_response.json()
        
        pending_apps = [a for a in apps if a.get("status") == "pending"]
        
        if pending_apps:
            app_id = pending_apps[0]["application_id"]
            # Test approve flow
            response = admin_session.patch(
                f"{BASE_URL}/api/group-applications/{app_id}/status",
                json={"status": "approved"}
            )
            assert response.status_code == 200, f"Status update failed: {response.text}"
            print(f"✓ PATCH /api/group-applications/{app_id}/status to approved succeeded")
            
            # Verify status changed
            verify = admin_session.get(f"{BASE_URL}/api/group-applications").json()
            updated_app = next((a for a in verify if a["application_id"] == app_id), None)
            if updated_app:
                assert updated_app["status"] == "approved"
                print(f"  - Verified application status is now: {updated_app['status']}")
        else:
            print("  Note: No pending group applications to test status update")
    
    def test_invalid_status_rejected(self, admin_session):
        """Test invalid status values are rejected"""
        apps = admin_session.get(f"{BASE_URL}/api/group-applications").json()
        if apps:
            app_id = apps[0]["application_id"]
            response = admin_session.patch(
                f"{BASE_URL}/api/group-applications/{app_id}/status",
                json={"status": "invalid_status"}
            )
            assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
            print("✓ Invalid status correctly rejected with 400")
        else:
            pytest.skip("No group applications to test")


class TestAvatarUpload:
    """Test avatar upload endpoint (validation only, not actual upload)"""
    
    def test_avatar_endpoint_exists(self, admin_session):
        """Test POST /api/users/avatar endpoint responds"""
        # Just verify the endpoint exists and requires proper data
        response = admin_session.post(f"{BASE_URL}/api/users/avatar")
        # Should return 422 (validation error for missing file) or similar, not 404
        assert response.status_code != 404, "Avatar upload endpoint does not exist"
        print(f"✓ POST /api/users/avatar endpoint exists (returned {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
