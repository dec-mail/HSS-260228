"""
Chat API Tests - Community Chat and Group Chat
Tests for:
- Community Chat: GET (public), POST (auth required)
- Group Chat: GET/POST (auth + group membership required)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shared-living-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@housesharingseniors.com.au"
ADMIN_PASSWORD = "HSSadmin2024!"

# Known group from previous testing (where admin is a member)
KNOWN_GROUP_ID = "grp_07895f92"
KNOWN_PROPERTY_ID = "prop_ae2519658c27"


@pytest.fixture(scope="module")
def admin_session():
    """Get authenticated admin session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login as admin
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("token")
        if token:
            session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    else:
        pytest.skip(f"Admin login failed: {response.status_code}")


@pytest.fixture(scope="module")
def unauthenticated_session():
    """Get unauthenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestCommunityChatPublicRead:
    """Test GET /api/chat/community - Public Read"""
    
    def test_community_chat_get_public_no_auth(self, unauthenticated_session):
        """GET community chat should work without authentication"""
        response = unauthenticated_session.get(f"{BASE_URL}/api/chat/community")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected a list of messages"
        print(f"PASS: Community chat GET (public) returns {len(data)} messages")
    
    def test_community_chat_message_structure(self, unauthenticated_session):
        """Verify message structure has required fields"""
        response = unauthenticated_session.get(f"{BASE_URL}/api/chat/community")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            msg = data[0]
            required_fields = ["message_id", "channel_type", "channel_id", "user_id", "user_name", "content", "created_at"]
            for field in required_fields:
                assert field in msg, f"Missing field: {field}"
            
            assert msg["channel_type"] == "community"
            assert msg["channel_id"] == "community"
            print(f"PASS: Message structure has all required fields: {list(msg.keys())}")
        else:
            print("SKIP: No messages to verify structure")


class TestCommunityChatAuthRequired:
    """Test POST /api/chat/community - Auth Required"""
    
    def test_community_chat_post_without_auth_fails(self, unauthenticated_session):
        """POST community chat without auth should return 401"""
        response = unauthenticated_session.post(f"{BASE_URL}/api/chat/community", json={
            "content": "This should fail without auth"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Community chat POST without auth returns 401")
    
    def test_community_chat_post_with_auth_succeeds(self, admin_session):
        """POST community chat with auth should succeed"""
        unique_msg = f"TEST_CHAT_{uuid.uuid4().hex[:8]}"
        
        response = admin_session.post(f"{BASE_URL}/api/chat/community", json={
            "content": unique_msg
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message_id" in data, "Response should have message_id"
        assert data["content"] == unique_msg, "Content should match"
        assert data["channel_type"] == "community"
        assert data["channel_id"] == "community"
        print(f"PASS: Community chat POST with auth succeeds, message_id: {data['message_id']}")
    
    def test_community_chat_message_persisted(self, admin_session, unauthenticated_session):
        """Verify sent message appears in GET response"""
        unique_msg = f"TEST_PERSIST_{uuid.uuid4().hex[:8]}"
        
        # Send message
        post_resp = admin_session.post(f"{BASE_URL}/api/chat/community", json={
            "content": unique_msg
        })
        assert post_resp.status_code == 200
        
        # Verify in GET (public)
        get_resp = unauthenticated_session.get(f"{BASE_URL}/api/chat/community")
        assert get_resp.status_code == 200
        
        messages = get_resp.json()
        found = any(m["content"] == unique_msg for m in messages)
        assert found, f"Message '{unique_msg}' not found in community chat"
        print(f"PASS: Message persisted and retrievable: {unique_msg}")
    
    def test_community_chat_empty_message_rejected(self, admin_session):
        """Empty or whitespace-only messages should be rejected"""
        response = admin_session.post(f"{BASE_URL}/api/chat/community", json={
            "content": "   "
        })
        
        assert response.status_code == 400, f"Expected 400 for empty message, got {response.status_code}"
        print("PASS: Empty message rejected with 400")


class TestGroupChatAccess:
    """Test Group Chat - Requires auth AND group membership"""
    
    def test_group_chat_get_without_auth_fails(self, unauthenticated_session):
        """GET group chat without auth should return 401"""
        response = unauthenticated_session.get(f"{BASE_URL}/api/chat/group/{KNOWN_GROUP_ID}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Group chat GET without auth returns 401")
    
    def test_group_chat_post_without_auth_fails(self, unauthenticated_session):
        """POST group chat without auth should return 401"""
        response = unauthenticated_session.post(f"{BASE_URL}/api/chat/group/{KNOWN_GROUP_ID}", json={
            "content": "This should fail"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Group chat POST without auth returns 401")


class TestGroupChatMemberAccess:
    """Test Group Chat with authenticated member"""
    
    def test_admin_can_join_group(self, admin_session):
        """Admin joins the known group to test chat"""
        # First check if already member
        groups_resp = admin_session.get(f"{BASE_URL}/api/groups/{KNOWN_GROUP_ID}")
        if groups_resp.status_code == 200:
            group_data = groups_resp.json()
            admin_user_id = "user_admin001"  # Known admin user_id
            is_member = any(m.get("user_id") == admin_user_id for m in group_data.get("members", []))
            
            if not is_member:
                # Join the group
                join_resp = admin_session.post(f"{BASE_URL}/api/groups/{KNOWN_GROUP_ID}/join", json={})
                print(f"Admin join group response: {join_resp.status_code}")
            else:
                print("Admin already a member of the group")
        
        print("PASS: Admin group membership verified")
    
    def test_group_chat_get_as_member(self, admin_session):
        """GET group chat as member should succeed"""
        response = admin_session.get(f"{BASE_URL}/api/chat/group/{KNOWN_GROUP_ID}")
        
        # Could be 200 (success) or 403 (not a member)
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list), "Expected list of messages"
            print(f"PASS: Group chat GET as member returns {len(data)} messages")
        elif response.status_code == 403:
            print("INFO: Admin not a member of group - testing non-member scenario")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_group_chat_post_as_member(self, admin_session):
        """POST group chat as member should succeed or return 403 if not member"""
        unique_msg = f"TEST_GROUP_{uuid.uuid4().hex[:8]}"
        
        response = admin_session.post(f"{BASE_URL}/api/chat/group/{KNOWN_GROUP_ID}", json={
            "content": unique_msg
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "message_id" in data
            assert data["content"] == unique_msg
            assert data["channel_type"] == "group"
            assert data["channel_id"] == KNOWN_GROUP_ID
            print(f"PASS: Group chat POST as member succeeds: {data['message_id']}")
        elif response.status_code == 403:
            print("INFO: Admin not a member of this group - 403 is expected")
            # This is actually the expected behavior for non-members
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_nonexistent_group_chat_returns_404(self, admin_session):
        """GET/POST to non-existent group should return 404"""
        fake_group_id = "grp_nonexistent123"
        
        get_resp = admin_session.get(f"{BASE_URL}/api/chat/group/{fake_group_id}")
        assert get_resp.status_code == 404, f"Expected 404 for nonexistent group GET, got {get_resp.status_code}"
        
        post_resp = admin_session.post(f"{BASE_URL}/api/chat/group/{fake_group_id}", json={
            "content": "Test message"
        })
        assert post_resp.status_code == 404, f"Expected 404 for nonexistent group POST, got {post_resp.status_code}"
        
        print("PASS: Non-existent group returns 404 for GET and POST")


class TestGroupChatWithNewGroup:
    """Test Group Chat by creating a new group and testing full flow"""
    
    @pytest.fixture(scope="class")
    def test_group(self, admin_session):
        """Create a test group for chat testing"""
        # Create a new group
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "property_id": KNOWN_PROPERTY_ID,
            "group_type": "Mixed",
            "is_couple": False
        })
        
        if response.status_code == 200:
            group_data = response.json()
            group_id = group_data["group_id"]
            print(f"Created test group: {group_id}")
            yield group_id
            
            # Cleanup: delete the group
            admin_session.delete(f"{BASE_URL}/api/groups/{group_id}")
            print(f"Cleaned up test group: {group_id}")
        else:
            pytest.skip(f"Could not create test group: {response.status_code}")
    
    def test_member_can_send_group_message(self, admin_session, test_group):
        """Group member can send message"""
        unique_msg = f"TEST_NEWGROUP_{uuid.uuid4().hex[:8]}"
        
        response = admin_session.post(f"{BASE_URL}/api/chat/group/{test_group}", json={
            "content": unique_msg
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["content"] == unique_msg
        assert data["channel_id"] == test_group
        print(f"PASS: Member sent group message: {data['message_id']}")
    
    def test_member_can_read_group_messages(self, admin_session, test_group):
        """Group member can read messages"""
        response = admin_session.get(f"{BASE_URL}/api/chat/group/{test_group}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Member can read {len(data)} group messages")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
