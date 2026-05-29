import pytest
import time
import hmac
import hashlib
import json
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient
from main import app, get_llm, SECRET_KEY_STR

client = TestClient(app)

def create_auth_headers(payload: dict):
    """Helper to generate valid HMAC headers for testing."""
    timestamp = str(int(time.time()))
    body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    hmac_context = hmac.new(SECRET_KEY_STR.encode('utf-8'), digestmod=hashlib.sha256)
    hmac_context.update(timestamp.encode('utf-8'))
    hmac_context.update(b'.')
    hmac_context.update(body_bytes)
    
    return {
        "X-Internal-Timestamp": timestamp,
        "X-Internal-Signature": hmac_context.hexdigest()
    }

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.fixture
def mock_llm():
    mock = AsyncMock()
    app.dependency_overrides[get_llm] = lambda: mock
    yield mock
    app.dependency_overrides.clear()


def test_generate_recipes_success(mock_llm):

    mock_llm.ainvoke.return_value.content = '{"recipes": [{"title": "Pancake", "ingredients": [{"quantity": 1, "unit": "cup", "name": "Flour"}], "instructions": ["Cook"], "portions": 1.0}]}'

    payload = {
        "profile": {
            "username": "testuser",
            "preferences": {
                "diet": ["vegan"],
                "allergies": [],
                "aboutMe": []
            }
        },
        "prompt": "Pancakes"
    }

    headers = create_auth_headers(payload)
    response = client.post("/ai/recipes", json=payload, headers=headers)
    
    assert response.status_code == 200
    assert response.json() == [{"title": "Pancake", "ingredients": [{"quantity": 1, "unit": "cup", "name": "Flour"}], "instructions": ["Cook"], "portions": 1.0}]
    mock_llm.ainvoke.assert_called_once()


def test_generate_recipes_invalid_payload(mock_llm):
    
    # preferences field missing
    payload = {
        "profile": {
            "username": "testuser"
        },
        "prompt": "Pancakes"
    }

    headers = create_auth_headers(payload)    
    response = client.post("/ai/recipes", json=payload, headers=headers)
    
    assert response.status_code == 400
    assert "Invalid request format" in response.json()["detail"]


def test_generate_recipes_unauthorized():
    # no header
    response = client.post("/ai/recipes", json={"prompt": "test"})
    assert response.status_code == 401


def test_generate_recipes_invalid_signature():
    payload = {"prompt": "test"}
    headers = {
        "X-Internal-Timestamp": str(int(time.time())),
        "X-Internal-Signature": "wrong-signature"
    }
    response = client.post("/ai/recipes", json=payload, headers=headers)
    assert response.status_code == 403