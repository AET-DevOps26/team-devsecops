import asyncio
import hashlib
import hmac
import os
import json
import time
import traceback
from typing import Any
from fastapi import Depends, FastAPI, HTTPException, Header, Request
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from client.cooking_assistant_api_client.models.recipe_request_forwarded import RecipeRequestForwarded

# Load variables from .env for local testing
load_dotenv()

app = FastAPI(title="Cooking Assistant GenAI Service")

LANGUAGE_NAMES = {"EN": "English", "DE": "German", "HU": "Hungarian"}

SECRET_KEY_STR = os.getenv("INTERNAL_AUTH_SECRET")
if not SECRET_KEY_STR:
    raise RuntimeError("CRITICAL: INTERNAL_AUTH_SECRET environment variable is missing!")

SECRET_KEY_BYTES = SECRET_KEY_STR.encode('utf-8')

async def verify_internal_hmac(
    request: Request,
    x_internal_timestamp: str = Header(None),
    x_internal_signature: str = Header(None)
):
    """
    Validates that the incoming request contains an authentic HMAC signature bound to the timestamp and the request payload.
    Caution: Redundant versions of this method in py-help-service and py-recipe service.
    """
    if not x_internal_timestamp or not x_internal_signature:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing security authentication headers."
        )

    # 1. Parse incoming timestamp string context securely
    try:
        request_time = int(x_internal_timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp metadata formatting.")

    # 2. Reject requests with more than 5 minutes of clock drift
    current_time = int(time.time())
    if abs(current_time - request_time) > 300:
        raise HTTPException(status_code=401, detail="Request token signature expired.")

    # 3. Read the raw body bytes directly from the stream
    body_bytes = await request.body()

    # 4. Recalculate signature locally by hashing both pieces together
    # Using a separator byte like b'.' prevents boundary shifting bugs
    hmac_context = hmac.new(SECRET_KEY_BYTES, digestmod=hashlib.sha256)
    hmac_context.update(x_internal_timestamp.encode('utf-8'))
    hmac_context.update(b'.')
    hmac_context.update(body_bytes)

    expected_signature = hmac_context.hexdigest()

    # 5. Use constant-time comparison to completely prevent timing attacks
    if not hmac.compare_digest(expected_signature, x_internal_signature):
        raise HTTPException(status_code=403, detail="Forbidden: HMAC signature validation mismatch.")


def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        google_api_key=os.getenv("SERVICE_API_KEY"),
        timeout=30,
    )

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/ai/recipes", dependencies=[Depends(verify_internal_hmac)])
async def generate_recipes(request_data: dict[str, Any], llm: ChatGoogleGenerativeAI = Depends(get_llm)):

    try:
        request = RecipeRequestForwarded.from_dict(request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")

    if not request.profile or not request.profile.preferences:
        raise HTTPException(status_code=400, detail="Missing required profile preferences.")

    try:

        # 1. Extract Profile Context
        prefs = request.profile.preferences
        diet = ", ".join(prefs.diet) if prefs.diet else "None"
        allergies = ", ".join(prefs.allergies) if prefs.allergies else "None"
        about = ", ".join(prefs.about_me) if prefs.about_me else "None"
        language = LANGUAGE_NAMES.get(getattr(prefs.language, "value", None) or "EN", "English")

        # 2. Build the System Prompt with strict JSON requirements
        system_prompt = (
            "You are a professional chef. Create a collection of distinct high-quality recipes.\n"
            f"Constraint - Diet: {diet}\n"
            f"Constraint - Allergies: {allergies} (DO NOT USE THESE)\n"
            f"User Context: {about}\n\n"
            "Respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"recipes\": [\n"
            "    {\n"
            "      \"title\": \"string\",\n"
            "      \"ingredients\": [{\"quantity\": number, \"unit\": \"string\", \"name\": \"string\"}],\n"
            "      \"instructions\": [\"string\"],\n"
            "      \"portions\": number,\n"
            "      \"nutrients\": {\"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}\n"
            "    }\n"
            "  ]\n"
            "}"
			f"Write all recipe content (title, ingredients, units and instructions) in {language}. "
			f"Keep the JSON keys in English as specified."
        )

        # 3. Invoke LLM
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Generate 3 distinct recipes for: {request.prompt}")
        ]

        response = await asyncio.wait_for(llm.ainvoke(messages), timeout=60)

        # 4. Parse and Validate
        # Clean markdown formatting if present
        clean_json = response.content.strip()

        if clean_json.startswith("```json"):
            clean_json = clean_json.removeprefix("```json").removesuffix("```").strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json.removeprefix("```").removesuffix("```").strip()

        data = json.loads(clean_json)

        if isinstance(data, dict) and "recipes" in data:
            return data["recipes"]

        return data

    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="LLM connection timed out.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
