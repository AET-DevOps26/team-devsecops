import asyncio
import hashlib
import hmac
import os
import time
from typing import Any
from fastapi import Depends, FastAPI, HTTPException, Header, Request
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

from client.cooking_assistant_gen_ai_services_api_internal_client.models.help_request_forwarded import (
	HelpRequestForwarded,
)
from client.cooking_assistant_gen_ai_services_api_internal_client.models.help_response import (
	HelpResponse,
)

# Load variables from .env for local testing
load_dotenv()

app = FastAPI(title="Cooking Assistant GenAI Service")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
	body = exc.detail if isinstance(exc.detail, dict) else {"message": exc.detail}
	return JSONResponse(status_code=exc.status_code, content=body, headers=exc.headers)


LANGUAGE_NAMES = {"EN": "English", "DE": "German", "HU": "Hungarian"}

SECRET_KEY_STR = os.getenv("INTERNAL_AUTH_SECRET")
if not SECRET_KEY_STR:
	raise RuntimeError(
		"CRITICAL: INTERNAL_AUTH_SECRET environment variable is missing!"
	)

SECRET_KEY_BYTES = SECRET_KEY_STR.encode("utf-8")


async def verify_internal_hmac(
	request: Request,
	x_internal_timestamp: str = Header(None),
	x_internal_signature: str = Header(None),
):
	"""
	Validates that the incoming request contains an authentic HMAC signature bound to the timestamp and the request payload.
	Caution: Redundant versions of this method in py-help-service and py-recipe service.
	"""
	if not x_internal_timestamp or not x_internal_signature:
		raise HTTPException(
			status_code=401,
			detail={
				"message": "Unauthorized: Missing security authentication headers."
			},
		)

	# 1. Parse incoming timestamp string context securely
	try:
		request_time = int(x_internal_timestamp)
	except ValueError:
		raise HTTPException(
			status_code=400,
			detail={"message": "Invalid timestamp metadata formatting."},
		)

	# 2. Reject requests with more than 5 minutes of clock drift
	current_time = int(time.time())
	if abs(current_time - request_time) > 300:
		raise HTTPException(
			status_code=401, detail={"message": "Request token signature expired."}
		)

	# 3. Read the raw body bytes directly from the stream
	body_bytes = await request.body()

	# 4. Recalculate signature locally by hashing both pieces together
	# Using a separator byte like b'.' prevents boundary shifting bugs
	hmac_context = hmac.new(SECRET_KEY_BYTES, digestmod=hashlib.sha256)
	hmac_context.update(x_internal_timestamp.encode("utf-8"))
	hmac_context.update(b".")
	hmac_context.update(body_bytes)

	expected_signature = hmac_context.hexdigest()

	# 5. Use constant-time comparison to completely prevent timing attacks
	if not hmac.compare_digest(expected_signature, x_internal_signature):
		raise HTTPException(
			status_code=403,
			detail={"message": "Forbidden: HMAC signature validation mismatch."},
		)


def get_llm():
	"""
	Dynamically builds the correct LLM structure using environment variables.
	"""
	provider = os.getenv("PROVIDER", "google_genai")

	kwargs = {"timeout": 60}

	if provider == "local":
		kwargs["base_url"] = os.getenv(
			"LOCAL_BASE_URL", "http://host.docker.internal:1234/v1"
		)
		kwargs["api_key"] = os.getenv("LOCAL_KEY", "not-needed")
		model_name = os.getenv("LOCAL_MODEL", "local-model")

		# We explicitly enforce the underlying OpenAI integration layout
		provider_target = "openai"

	elif provider == "openai":
		logos_key = os.getenv("LOGOS_KEY")
		if not logos_key:
			raise RuntimeError("CRITICAL: LOGOS_KEY is missing!")

		kwargs["base_url"] = os.getenv(
			"LOGOS_BASE_URL", "https://logos.aet.cit.tum.de/v1"
		)
		kwargs["api_key"] = logos_key
		model_name = os.getenv("LOGOS_MODEL", "openai/gpt-oss-120b")

		provider_target = "openai"

	else:
		gemini_key = os.getenv("GEMINI_HELP_SERVICE_KEY")
		if not gemini_key:
			raise RuntimeError("CRITICAL: GEMINI_HELP_SERVICE_KEY is missing!")

		kwargs["google_api_key"] = gemini_key
		kwargs["response_format"] = {"type": "application/json"}
		model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

		provider_target = "google_genai"

	try:
		return init_chat_model(
			model=model_name, model_provider=provider_target, **kwargs
		)
	except Exception as e:
		raise RuntimeError(f"Failed to boot LLM provider '{provider}': {e}")


@app.get("/health")
def health_check():
	return {"status": "healthy"}


@app.post("/ai/help", dependencies=[Depends(verify_internal_hmac)])
async def generate_help(request_data: dict[str, Any], llm=Depends(get_llm)):
	try:
		request = HelpRequestForwarded.from_dict(request_data)
	except Exception as e:
		raise HTTPException(
			status_code=400, detail={"message": f"Invalid request format: {str(e)}"}
		)

	try:
		context = ["You are a professional culinary assistant."]

		language = "English"
		if request.profile and request.profile.preferences:
			prefs = request.profile.preferences

			language = LANGUAGE_NAMES.get(
				getattr(prefs.language, "value", None) or "EN", "English"
			)
			context.append(f"You serve a user speaking {language}.")

			diet = prefs.diet or []
			if diet:
				context.append(
					f"The user specifies the following diet: {', '.join(diet)}."
				)

			about_me = prefs.about_me or []
			if about_me:
				context.append(f"The user specifies: {', '.join(about_me)}")

			allergies = prefs.allergies or []
			if allergies:
				context.append(
					f"Important: The user is allergic to: {', '.join(allergies)}."
				)

		if request.recipe:
			context.append(
				f"The user is currently looking at a recipe for '{request.recipe.title}'."
			)

		# Combine into LLM prompt
		system_prompt = SystemMessage(content=" ".join(context))
		user_prompt = HumanMessage(content=request.prompt)

		result = await asyncio.wait_for(
			llm.ainvoke([system_prompt, user_prompt]), timeout=60
		)

		help_response = HelpResponse(response=result.content)
		return help_response.to_dict()

	except asyncio.TimeoutError:
		raise HTTPException(
			status_code=504, detail={"message": "LLM connection timed out."}
		)
	except Exception as e:
		raise HTTPException(status_code=500, detail={"message": str(e)})
