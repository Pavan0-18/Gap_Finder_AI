import pytest

def test_register_and_login(client):
    # 1. Register
    reg_payload = {
        "email": "student1@example.com",
        "password": "Password123!",
        "full_name": "Test Student One",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student1@example.com"

    # 2. Duplicate registration fails
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login
    login_payload = {
        "email": "student1@example.com",
        "password": "Password123!",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Access Protected Route /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "student1@example.com"

def test_unauthorized_access(client):
    res = client.get("/api/v1/subjects")
    assert res.status_code == 401
