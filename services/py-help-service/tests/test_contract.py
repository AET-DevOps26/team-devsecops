"""OpenAPI contract-conformance test for py-help-service using Schemathesis.

Verifies that the service's live responses conform to the internal contract in
`api/openapi-internal.yaml`.
"""

import pathlib
from unittest.mock import AsyncMock, MagicMock

import pytest
import schemathesis

from main import app, get_llm, verify_internal_hmac, LocalHelpResponse

_CONTRACT = (
	pathlib.Path(__file__).resolve().parents[3] / "api" / "openapi-internal.yaml"
)
_ORIGINAL_OPENAPI_SCHEMA = app.openapi_schema
_CONTRACT_SCHEMA = schemathesis.openapi.from_path(_CONTRACT).raw_schema
app.openapi_schema = _CONTRACT_SCHEMA

# /ai/recipes belongs to py-recipe-service
schema = schemathesis.openapi.from_asgi("/openapi.json", app).exclude(
	path="/ai/recipes"
)

# Happy path only. Auth rejection (missing/invalid HMAC headers) is covered in test_help_service.py.
schema.config.generation.update(modes=[schemathesis.GenerationMode.POSITIVE])
schema.config.phases.update(phases=["examples", "fuzzing"])


@pytest.fixture(autouse=True)
def _stub_provider_dependencies():
	app.openapi_schema = _CONTRACT_SCHEMA
	app.dependency_overrides[verify_internal_hmac] = lambda: None

	conforming = LocalHelpResponse(
		response="Add a pinch of salt to balance the flavour."
	)
	structured_runnable = AsyncMock()
	structured_runnable.ainvoke.return_value = conforming
	llm = MagicMock()
	llm.with_structured_output.return_value = structured_runnable
	app.dependency_overrides[get_llm] = lambda: llm

	yield
	del app.dependency_overrides[verify_internal_hmac]
	del app.dependency_overrides[get_llm]
	app.openapi_schema = _ORIGINAL_OPENAPI_SCHEMA


@schema.parametrize()
def test_openapi_conformance(case):
	case.call_and_validate()
