"""OpenAPI contract-conformance test for py-recipe-service using Schemathesis.

Verifies that the service's live responses conform to the internal contract in
`api/openapi-internal.yaml`.
"""

import pathlib
from unittest.mock import AsyncMock, MagicMock

import pytest
import schemathesis

from main import (
	app,
	get_llm,
	verify_internal_hmac,
	RecipeListWrapper,
	LocalRecipeInput,
	LocalRecipeNutrients,
)

_CONTRACT = (
	pathlib.Path(__file__).resolve().parents[3] / "api" / "openapi-internal.yaml"
)
_ORIGINAL_OPENAPI_SCHEMA = app.openapi_schema
_CONTRACT_SCHEMA = schemathesis.openapi.from_path(_CONTRACT).raw_schema
app.openapi_schema = _CONTRACT_SCHEMA

# /ai/help belongs to py-help-service
schema = schemathesis.openapi.from_asgi("/openapi.json", app).exclude(path="/ai/help")

# Happy path only. Auth rejection (missing/invalid HMAC headers) is covered in test_recipe_service.py.
schema.config.generation.update(modes=[schemathesis.GenerationMode.POSITIVE])
schema.config.phases.update(phases=["examples", "fuzzing"])


@pytest.fixture(autouse=True)
def _stub_provider_dependencies():
	app.openapi_schema = _CONTRACT_SCHEMA
	app.dependency_overrides[verify_internal_hmac] = lambda: None

	nutrients = LocalRecipeNutrients(calories=200, protein=5, fat=3, carbs=35)
	conforming = {
		RecipeListWrapper: RecipeListWrapper(
			recipes=[
				LocalRecipeInput(
					title="Test Recipe",
					# One of each ingredient kind: an absent quantity/unit must be marked by
					# omitting the key, since the contract forbids both null and "".
					ingredients=[
						{"quantity": 1.0, "unit": "cup", "name": "Flour"},
						{"quantity": 2.0, "name": "Eggs"},
						{"name": "Salt"},
					],
					instructions=["Mix.", "Bake."],
					portions=2.0,
					nutrients=nutrients,
				)
			]
		),
		LocalRecipeNutrients: nutrients,
	}

	def _structured_output(schema_class):
		runnable = AsyncMock()
		runnable.ainvoke.return_value = conforming[schema_class]
		return runnable

	llm = MagicMock()
	llm.with_structured_output.side_effect = _structured_output
	app.dependency_overrides[get_llm] = lambda: llm

	yield
	del app.dependency_overrides[verify_internal_hmac]
	del app.dependency_overrides[get_llm]
	app.openapi_schema = _ORIGINAL_OPENAPI_SCHEMA


@schema.parametrize()
def test_openapi_conformance(case):
	case.call_and_validate()
