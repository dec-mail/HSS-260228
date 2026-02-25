"""
Test suite for Express Interest and Favorites features
- Express Interest: POST /api/interests, GET /api/interests, PATCH /api/interests/{id}/status
- Favorites: POST /api/favorites, GET /api/favorites, DELETE /api/favorites/{id}
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@housesharingseniors.com.au"
ADMIN_PASSWORD = "HSSadmin2024!"
MEMBER_EMAIL = "jane.doe.test@example.com"
MEMBER_PASSWORD = "testpass123"


class TestInterestsAndFavoritesSetup:
    """Setup and verification tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth tokens for admin and member"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_api_root(self):
        """Verify API is accessible"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert "House Sharing Seniors API" in response.json().get("message", "")
        print("API root accessible")
    
    def test_admin_login(self):
        """Verify admin can login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "admin"
        print("Admin login successful")
        
    def test_member_login(self):
        """Verify test member can login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "member"
        print("Member login successful")


class TestExpressInterest:
    """Express Interest endpoint tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Member login failed")
        
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
        
    @pytest.fixture
    def test_property(self, admin_token):
        """Create a test property for interest testing"""
        response = requests.post(
            f"{BASE_URL}/api/properties",
            json={
                "city": "TEST_Sydney",
                "state": "NSW",
                "weekly_rent_per_person": 200,
                "property_type": "house",
                "total_bedrooms": 3,
                "available_bedrooms": 1
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200:
            prop = response.json()
            yield prop
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/properties/{prop['property_id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        else:
            pytest.skip("Failed to create test property")
    
    def test_express_interest_requires_auth(self):
        """POST /api/interests requires authentication"""
        response = requests.post(f"{BASE_URL}/api/interests", json={
            "property_id": "fake_id",
            "message": "Test"
        })
        assert response.status_code == 401
        print("Express interest correctly requires authentication")
        
    def test_express_interest_invalid_property(self, member_token):
        """POST /api/interests fails for non-existent property"""
        response = requests.post(
            f"{BASE_URL}/api/interests",
            json={
                "property_id": "nonexistent_prop_123",
                "message": "Test message"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 404
        assert "Property not found" in response.json().get("detail", "")
        print("Express interest correctly rejects invalid property")
        
    def test_express_interest_success(self, member_token, test_property):
        """POST /api/interests creates interest successfully"""
        response = requests.post(
            f"{BASE_URL}/api/interests",
            json={
                "property_id": test_property["property_id"],
                "message": "I'm very interested in this property for TEST",
                "phone": "0400000000"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "interest_id" in data
        assert data.get("message") == "Interest expressed successfully"
        print(f"Interest created: {data.get('interest_id')}")
        
    def test_express_interest_duplicate_rejected(self, member_token, test_property):
        """POST /api/interests rejects duplicate interest"""
        # First create interest
        requests.post(
            f"{BASE_URL}/api/interests",
            json={
                "property_id": test_property["property_id"],
                "message": "First interest"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        # Try to create duplicate
        response = requests.post(
            f"{BASE_URL}/api/interests",
            json={
                "property_id": test_property["property_id"],
                "message": "Duplicate interest"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 400
        assert "already expressed interest" in response.json().get("detail", "").lower()
        print("Duplicate interest correctly rejected")
        
    def test_get_interests_requires_admin(self, member_token):
        """GET /api/interests requires admin role"""
        response = requests.get(
            f"{BASE_URL}/api/interests",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 403
        print("GET interests correctly requires admin")
        
    def test_get_interests_admin(self, admin_token):
        """GET /api/interests returns interests list for admin"""
        response = requests.get(
            f"{BASE_URL}/api/interests",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin can see {len(data)} interests")
        
    def test_get_my_interests(self, member_token):
        """GET /api/interests/my returns user's own interests"""
        response = requests.get(
            f"{BASE_URL}/api/interests/my",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Member can see their {len(data)} interests")
        
    def test_update_interest_status_admin(self, admin_token):
        """PATCH /api/interests/{id}/status works for admin"""
        # Get an existing interest
        interests_response = requests.get(
            f"{BASE_URL}/api/interests",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        interests = interests_response.json()
        
        if len(interests) == 0:
            pytest.skip("No interests to test status update")
            
        interest_id = interests[0]["interest_id"]
        response = requests.patch(
            f"{BASE_URL}/api/interests/{interest_id}/status",
            json={"status": "reviewed"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "reviewed" in response.json().get("message", "").lower()
        print(f"Interest {interest_id} marked as reviewed")


class TestFavorites:
    """Favorites endpoint tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Member login failed")
        
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
        
    @pytest.fixture
    def test_property(self, admin_token):
        """Create a test property for favorites testing"""
        response = requests.post(
            f"{BASE_URL}/api/properties",
            json={
                "city": "TEST_Melbourne",
                "state": "VIC",
                "weekly_rent_per_person": 180,
                "property_type": "apartment"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200:
            prop = response.json()
            yield prop
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/properties/{prop['property_id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        else:
            pytest.skip("Failed to create test property")
            
    def test_add_favorite_requires_auth(self):
        """POST /api/favorites requires authentication"""
        response = requests.post(f"{BASE_URL}/api/favorites", json={
            "item_id": "fake_id",
            "item_type": "property"
        })
        assert response.status_code == 401
        print("Add favorite correctly requires authentication")
        
    def test_add_property_favorite(self, member_token, test_property):
        """POST /api/favorites adds property to favorites"""
        response = requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": test_property["property_id"],
                "item_type": "property"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Added to favorites" in data.get("message", "") or "Already in favorites" in data.get("message", "")
        print(f"Property favorite added: {data}")
        
    def test_add_member_favorite(self, member_token, admin_token):
        """POST /api/favorites adds member to favorites"""
        # Get admin user_id to favorite
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        admin_user_id = me_response.json().get("user_id")
        
        response = requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": admin_user_id,
                "item_type": "member"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Added to favorites" in data.get("message", "") or "Already in favorites" in data.get("message", "")
        print(f"Member favorite added: {data}")
        
    def test_add_duplicate_favorite(self, member_token, test_property):
        """POST /api/favorites returns 'Already in favorites' for duplicates"""
        # Add first time
        requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": test_property["property_id"],
                "item_type": "property"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        # Try to add again
        response = requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": test_property["property_id"],
                "item_type": "property"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        assert "Already in favorites" in response.json().get("message", "")
        print("Duplicate favorite correctly handled")
        
    def test_get_favorites(self, member_token):
        """GET /api/favorites returns user's favorites"""
        response = requests.get(
            f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} favorites")
        
    def test_get_favorites_with_filter(self, member_token):
        """GET /api/favorites?item_type=property filters by type"""
        response = requests.get(
            f"{BASE_URL}/api/favorites?item_type=property",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify all items are properties
        for fav in data:
            assert fav.get("item_type") == "property"
        print(f"Filtered favorites: {len(data)} properties")
        
    def test_get_favorites_enriched_data(self, member_token, test_property):
        """GET /api/favorites includes item_data"""
        # First add a favorite
        requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": test_property["property_id"],
                "item_type": "property"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        # Get favorites
        response = requests.get(
            f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find the test property favorite
        test_fav = next((f for f in data if f.get("item_id") == test_property["property_id"]), None)
        if test_fav:
            assert "item_data" in test_fav
            assert test_fav["item_data"].get("city") == "TEST_Melbourne"
            print("Favorites include enriched item_data")
        else:
            print("Test property favorite not found in response")
            
    def test_delete_favorite(self, member_token, test_property):
        """DELETE /api/favorites/{id} removes favorite"""
        # First add a favorite
        add_response = requests.post(
            f"{BASE_URL}/api/favorites",
            json={
                "item_id": test_property["property_id"],
                "item_type": "property"
            },
            headers={"Authorization": f"Bearer {member_token}"}
        )
        
        # Get favorites to find the ID
        get_response = requests.get(
            f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        favorites = get_response.json()
        test_fav = next((f for f in favorites if f.get("item_id") == test_property["property_id"]), None)
        
        if not test_fav:
            pytest.skip("Could not find test favorite to delete")
            
        # Delete the favorite
        delete_response = requests.delete(
            f"{BASE_URL}/api/favorites/{test_fav['favorite_id']}",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert delete_response.status_code == 200
        assert "Removed from favorites" in delete_response.json().get("message", "")
        print(f"Favorite {test_fav['favorite_id']} deleted successfully")
        
    def test_delete_nonexistent_favorite(self, member_token):
        """DELETE /api/favorites/{id} returns 404 for non-existent"""
        response = requests.delete(
            f"{BASE_URL}/api/favorites/fav_nonexistent123",
            headers={"Authorization": f"Bearer {member_token}"}
        )
        assert response.status_code == 404
        print("Delete non-existent favorite correctly returns 404")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_properties(self):
        """Clean up TEST_ prefixed properties"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Admin login failed for cleanup")
            
        token = login_response.json().get("token")
        
        # Get all properties
        props_response = requests.get(
            f"{BASE_URL}/api/properties",
            headers={"Authorization": f"Bearer {token}"}
        )
        if props_response.status_code != 200:
            pytest.skip("Could not get properties for cleanup")
            
        # Delete TEST_ properties
        count = 0
        for prop in props_response.json():
            if prop.get("city", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/properties/{prop['property_id']}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                count += 1
                
        print(f"Cleaned up {count} TEST_ properties")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
