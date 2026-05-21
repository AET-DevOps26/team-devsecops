import hashlib
import hmac
import os
import time
from typing import Any
from fastapi import Depends, FastAPI, HTTPException, Header
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from client.cooking_assistant_api_client.models.help_request_forwarded import HelpRequestForwarded
from client.cooking_assistant_api_client.models.help_response import HelpResponse

# Load variables from .env for local testing
load_dotenv()

app = FastAPI(title="Cooking Assistant GenAI Service")

INTERNAL_AUTH_SECRET = os.getenv("INTERNAL_AUTH_SECRET")

SECRET_KEY_STR = os.getenv("INTERNAL_AUTH_SECRET")
if not SECRET_KEY_STR:
    raise RuntimeError("CRITICAL: INTERNAL_AUTH_SECRET environment variable is missing!") 

SECRET_KEY_BYTES = SECRET_KEY_STR.encode('utf-8')

async def verify_internal_hmac(
    x_internal_timestamp: str = Header(None), 
    x_internal_signature: str = Header(None)
):
    """
    Validates that the incoming request contains an authentic HMAC signature
    and checks against clock drift to eliminate replay attacks.
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

    # 2. Reject requests with more than 5 minutes of clock drift (prevents replay attacks)
    current_time = int(time.time())
    if abs(current_time - request_time) > 300:
        raise HTTPException(status_code=401, detail="Request token signature expired.")

    # 3. Recalculate signature locally based on the timestamp they provided
    expected_signature = hmac.new(
        SECRET_KEY_BYTES, 
        x_internal_timestamp.encode('utf-8'), 
        hashlib.sha256
    ).hexdigest()

    # 4. Use constant-time comparison to completely prevent timing attacks
    if not hmac.compare_digest(expected_signature, x_internal_signature):
        raise HTTPException(status_code=403, detail="Forbidden: HMAC signature validation mismatch.")
# --------------------------

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    google_api_key=os.getenv("SERVICE_API_KEY")
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/ai/help", dependencies=[Depends(verify_internal_hmac)])
async def generate_help(request_data: dict[str, Any]):
    
    try:
        request = HelpRequestForwarded.from_dict(request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")
    
    try:
        context = ["You are a professional culinary assistant."]
        
        if request.profile and request.profile.preferences:
            prefs = request.profile.preferences
            diet = prefs.diet or []
            if diet:
                context.append(f"The user specifies the following diet: {', '.join(diet)}.")
    
            about_me = prefs.about_me or []
            if about_me:
                context.append(f"The user specifies: {', '.join(about_me)}") 

            allergies = prefs.allergies or []
            if allergies:
                context.append(f"Important: The user is allergic to: {', '.join(allergies)}.")
        
        if request.recipe:
            context.append(f"The user is currently looking at a recipe for '{request.recipe.title}'.")

        # Combine into LLM prompt
        system_prompt = SystemMessage(content=" ".join(context))
        user_prompt = HumanMessage(content=request.prompt)

        result = llm.invoke([system_prompt, user_prompt])

        help_response = HelpResponse(response=result.content)
        return help_response.to_dict()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
