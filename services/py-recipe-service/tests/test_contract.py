"""OpenAPI contract-conformance test for py-recipe-service using Schemathesis.

Verifies that the service's live responses conform to the internal contract in
`api/openapi-internal.yaml`.
"""

import pathlib
from unittest.mock import AsyncMock, MagicMock

import pytest
import schemathesis

from main import app, get_llm, verify_internal_hmac, RecipeListWrapper, LocalRecipeInput

_CONTRACT = (
	pathlib.Path(__file__).resolve().parents[3] / "api" / "openapi-internal.yaml"
)
app.openapi_schema = schemathesis.openapi.from_path(_CONTRACT).raw_schema

# /ai/help belongs to py-help-service
schema = schemathesis.openapi.from_asgi("/openapi.json", app).exclude(path="/ai/help")

# Happy path only. Auth rejection (missing/invalid HMAC headers) is covered in test_recipe_service.py.
schema.config.generation.update(modes=[schemathesis.GenerationMode.POSITIVE])
schema.config.phases.update(phases=["examples", "fuzzing"])


@pytest.fixture(autouse=True)
def _stub_provider_dependencies():
	app.dependency_overrides[verify_internal_hmac] = lambda: None

	conforming = RecipeListWrapper(
		recipes=[
			LocalRecipeInput(
				title="Test Recipe",
				ingredients=[{"quantity": 1.0, "unit": "cup", "name": "Flour"}],
				instructions=["Mix.", "Bake."],
				portions=2.0,
				nutrients={"calories": 200, "protein": 5, "fat": 3, "carbs": 35},
			)
		]
	)
	structured_runnable = AsyncMock()
	structured_runnable.ainvoke.return_value = conforming
	llm = MagicMock()
	llm.with_structured_output.return_value = structured_runnable
	app.dependency_overrides[get_llm] = lambda: llm

	yield
	app.dependency_overrides.clear()


@schema.parametrize()
def test_openapi_conformance(case):
	case.call_and_validate()
