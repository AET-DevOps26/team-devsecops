import pytest
import time
import hmac
import hashlib
import json
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app, get_llm, SECRET_KEY_STR, LocalHelpResponse

client = TestClient(app)


def create_auth_headers(payload: dict):
	"""Helper to generate valid HMAC headers for testing."""
	timestamp = str(int(time.time()))
	body_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

	hmac_context = hmac.new(SECRET_KEY_STR.encode("utf-8"), digestmod=hashlib.sha256)
	hmac_context.update(timestamp.encode("utf-8"))
	hmac_context.update(b".")
	hmac_context.update(body_bytes)

	return {
		"X-Internal-Timestamp": timestamp,
		"X-Internal-Signature": hmac_context.hexdigest(),
	}


def test_health_check():
	response = client.get("/health")
	assert response.status_code == 200
	assert response.json() == {"status": "healthy"}


@pytest.fixture
def mock_llm():
	mock_base = MagicMock()
	mock_structured_runnable = AsyncMock()

	# llm.with_structured_output(LocalHelpResponse) returns the runnable
	mock_base.with_structured_output.return_value = mock_structured_runnable
	app.dependency_overrides[get_llm] = lambda: mock_base
	yield mock_base
	app.dependency_overrides.clear()


def test_generate_help_success(mock_llm):
	mock_structured_runnable = mock_llm.with_structured_output.return_value
	mock_structured_runnable.ainvoke.return_value = LocalHelpResponse(
		response="Add a pinch of salt."
	)

	payload = {
		"profile": {
			"username": "testuser",
			"preferences": {
				"diet": ["vegan"],
				"allergies": [],
				"about_me": [],
				"language": "EN",
			},
		},
		"recipe": {
			"title": "Tomato Soup",
			"ingredients": [{"quantity": 1, "unit": "cup", "name": "Tomato"}],
			"instructions": ["Boil tomatoes."],
			"portions": 2.0,
		},
		"prompt": "How do I fix bland soup?",
	}

	headers = create_auth_headers(payload)
	response = client.post("/ai/help", json=payload, headers=headers)

	assert response.status_code == 200
	assert response.json()["response"] == "Add a pinch of salt."

	mock_structured_runnable.ainvoke.assert_called_once()


def test_generate_help_invalid_payload(mock_llm):

	# preferences field missing
	payload = {
		"profile": {"username": "testuser"},
		"recipe": {
			"title": "Tomato Soup",
			"ingredients": [{"quantity": 1, "unit": "cup", "name": "Tomato"}],
			"instructions": ["Boil tomatoes."],
			"portions": 2.0,
		},
		"prompt": "How do I fix bland soup?",
	}

	headers = create_auth_headers(payload)
	response = client.post("/ai/help", json=payload, headers=headers)

	assert response.status_code == 400

	response_json = response.json()
	if "detail" in response_json:
		assert "Invalid request format" in str(response_json["detail"])
	else:
		assert "Invalid request format" in response_json["message"]


def test_generate_help_unauthorized():
	# no header
	response = client.post("/ai/help", json={"prompt": "test"})
	assert response.status_code == 401


def test_generate_help_invalid_signature():
	payload = {"prompt": "test"}
	headers = {
		"X-Internal-Timestamp": str(int(time.time())),
		"X-Internal-Signature": "wrong-signature",
	}

	response = client.post("/ai/help", json=payload, headers=headers)
	assert response.status_code == 403

	response_json = response.json()
	if "detail" in response_json:
		assert "message" in response_json["detail"]
		assert "Forbidden" in response_json["detail"]["message"]
	else:
		assert "message" in response_json
		assert "Forbidden" in response_json["message"]
