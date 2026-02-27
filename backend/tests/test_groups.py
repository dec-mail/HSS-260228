"""
Test suite for Groups feature (property-centric groups)
Tests: Create, List, Join, Leave, Delete groups
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@housesharingseniors.com.au"
ADMIN_PASSWORD = "HSSadmin2024!"
TEST_MEMBER_EMAIL = "jane.doe.test@example.com"
TEST_MEMBER_PASSWORD = "testpass123"


class TestPropertyCodes:
    """Test property codes are returned for all properties"""
    
    def test_properties_have_property_code(self):
        """GET /api/properties returns property_code for all properties"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        
        properties = response.json()
        assert len(properties) > 0, "No properties in database to test"
        
        for prop in properties:
            assert "property_code" in prop, f"Property {prop.get('property_id')} missing property_code"
            assert prop["property_code"] is not None, f"Property {prop.get('property_id')} has null property_code"
            # Property code format: STATE-SUB-STR-NUM
            code = prop["property_code"]
            parts = code.split("-")
            assert len(parts) == 4, f"Invalid property_code format: {code}"
            print(f"✓ Property {prop['property_id']}: {code}")


class TestGroupsBackend:
    """Test Groups API endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def member_token(self):
        """Get member auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_MEMBER_EMAIL,
            "password": TEST_MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Member login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def test_property_id(self):
        """Get first available property ID"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        properties = response.json()
        assert len(properties) > 0, "No properties available for testing"
        return properties[0]["property_id"]
    
    def test_list_groups_requires_auth(self):
        """GET /api/groups requires authentication"""
        response = requests.get(f"{BASE_URL}/api/groups")
        assert response.status_code == 401
        print("✓ Groups endpoint requires authentication")
    
    def test_list_all_groups(self, admin_token):
        """GET /api/groups lists all groups"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"✓ Listed {len(groups)} groups")
        
        # Check group structure
        if groups:
            group = groups[0]
            assert "group_id" in group
            assert "property_id" in group
            assert "name" in group
            assert "members" in group
            assert "spots_taken" in group
            assert "spots_available" in group
    
    def test_list_groups_for_property(self, admin_token, test_property_id):
        """GET /api/groups?property_id=xxx filters by property"""
        response = requests.get(
            f"{BASE_URL}/api/groups?property_id={test_property_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        groups = response.json()
        
        # All returned groups should be for the specified property
        for group in groups:
            assert group["property_id"] == test_property_id
        print(f"✓ Listed {len(groups)} groups for property {test_property_id}")
    
    def test_create_group_requires_property_id(self, admin_token):
        """POST /api/groups requires property_id"""
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"group_type": "Mixed"}  # Missing property_id
        )
        assert response.status_code == 422  # Validation error
        print("✓ Create group requires property_id")
    
    def test_create_group_for_property(self, admin_token, test_property_id):
        """POST /api/groups creates group tied to property"""
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "property_id": test_property_id,
                "group_type": "SingleFemale",
                "is_couple": False
            }
        )
        assert response.status_code == 200
        
        group = response.json()
        assert "group_id" in group
        assert group["property_id"] == test_property_id
        assert group["group_type"] == "SingleFemale"
        assert len(group["members"]) == 1  # Creator auto-joined
        print(f"✓ Created group {group['name']} for property {test_property_id}")
        
        # Cleanup - delete the test group
        delete_response = requests.delete(
            f"{BASE_URL}/api/groups/{group['group_id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test group {group['group_id']}")
    
    def test_create_group_generates_name(self, admin_token):
        """POST /api/groups auto-generates group name"""
        # Get a property without existing groups (use second property)
        props_response = requests.get(f"{BASE_URL}/api/properties")
        properties = props_response.json()
        assert len(properties) > 1, "Need at least 2 properties"
        test_property = properties[1]
        
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "property_id": test_property["property_id"],
                "group_type": "Couples"
            }
        )
        assert response.status_code == 200
        
        group = response.json()
        assert group["name"], "Group name should be auto-generated"
        # Name format: CityShort-Letter (e.g., Everton-A)
        assert "-" in group["name"]
        print(f"✓ Auto-generated group name: {group['name']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/groups/{group['group_id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_get_group_details(self, admin_token):
        """GET /api/groups/{group_id} returns group details"""
        # First list groups to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = list_response.json()
        if not groups:
            pytest.skip("No groups available to test")
        
        group_id = groups[0]["group_id"]
        response = requests.get(
            f"{BASE_URL}/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        group = response.json()
        assert group["group_id"] == group_id
        assert "spots_taken" in group
        assert "spots_available" in group
        print(f"✓ Got details for group {group['name']}")


class TestGroupJoinLeave:
    """Test Join and Leave group functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def member_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_MEMBER_EMAIL,
            "password": TEST_MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Member login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def test_group(self, admin_token):
        """Create a test group for join/leave tests"""
        # Get first property
        props = requests.get(f"{BASE_URL}/api/properties").json()
        prop_id = props[0]["property_id"]
        
        # Create group
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "property_id": prop_id,
                "group_type": "Mixed",
                "is_couple": False
            }
        )
        group = response.json()
        yield group
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/groups/{group['group_id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_join_group(self, member_token, test_group):
        """POST /api/groups/{group_id}/join adds member to group"""
        group_id = test_group["group_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/join",
            headers={"Authorization": f"Bearer {member_token}"},
            json={}
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        assert result.get("position") in ["member", "waitlist"]
        print(f"✓ Joined group: {result['message']}")
    
    def test_leave_group(self, member_token, admin_token):
        """POST /api/groups/{group_id}/leave removes member from group"""
        # Get first property
        props = requests.get(f"{BASE_URL}/api/properties").json()
        prop_id = props[0]["property_id"]
        
        # Create a test group
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"property_id": prop_id, "group_type": "Mixed"}
        )
        group = create_response.json()
        group_id = group["group_id"]
        
        # Member joins
        requests.post(
            f"{BASE_URL}/api/groups/{group_id}/join",
            headers={"Authorization": f"Bearer {member_token}"},
            json={}
        )
        
        # Member leaves
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/leave",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        print(f"✓ Left group: {result['message']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_already_member_join(self, admin_token):
        """Joining same group twice returns appropriate message"""
        # Get existing groups
        groups = requests.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        
        if not groups:
            pytest.skip("No groups available")
        
        group_id = groups[0]["group_id"]
        
        # Try to join (admin is already member of existing group)
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/join",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "already" in result["message"].lower() or "waitlist" in result["message"].lower()
        print(f"✓ Duplicate join handled: {result['message']}")


class TestGroupDelete:
    """Test group deletion"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def member_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_MEMBER_EMAIL,
            "password": TEST_MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Member login failed")
        return response.json()["token"]
    
    def test_delete_group_by_creator(self, admin_token):
        """DELETE /api/groups/{group_id} works for creator"""
        # Get a property
        props = requests.get(f"{BASE_URL}/api/properties").json()
        prop_id = props[0]["property_id"]
        
        # Create group
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"property_id": prop_id, "group_type": "Mixed"}
        )
        group_id = create_response.json()["group_id"]
        
        # Delete
        response = requests.delete(
            f"{BASE_URL}/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        print("✓ Creator can delete their group")
    
    def test_delete_group_by_non_creator_fails(self, admin_token, member_token):
        """DELETE /api/groups/{group_id} fails for non-creator non-admin"""
        # Get a property
        props = requests.get(f"{BASE_URL}/api/properties").json()
        prop_id = props[0]["property_id"]
        
        # Admin creates group
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"property_id": prop_id, "group_type": "Mixed"}
        )
        group_id = create_response.json()["group_id"]
        
        # Member tries to delete
        response = requests.delete(
            f"{BASE_URL}/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 403
        print("✓ Non-creator cannot delete group")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/groups/{group_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestWaitlistFunctionality:
    """Test waitlist when group is full"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_group_shows_waitlist_count(self, admin_token):
        """Groups show waitlist_count field"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if groups:
            group = groups[0]
            assert "waitlist_count" in group or "waitlist" in group
            print(f"✓ Group shows waitlist info: waitlist_count={group.get('waitlist_count', len(group.get('waitlist', [])))}")
    
    def test_group_shows_spots_available(self, admin_token):
        """Groups show spots_available computed field"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        groups = response.json()
        
        if groups:
            group = groups[0]
            assert "spots_available" in group
            assert "spots_taken" in group
            assert "max_spots" in group
            expected_available = max(0, group["max_spots"] - group["spots_taken"])
            assert group["spots_available"] == expected_available
            print(f"✓ Group spots: {group['spots_taken']}/{group['max_spots']} ({group['spots_available']} available)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
