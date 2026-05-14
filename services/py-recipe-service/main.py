import os
import json
from typing import Any
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from client.cooking_assistant_api_client.models.recipe_request import RecipeRequest
from client.cooking_assistant_api_client.models.recipe import Recipe

# Load variables from .env for local testing
load_dotenv()

app = FastAPI(title="Cooking Assistant GenAI Service")

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    google_api_key=os.getenv("SERVICE_API_KEY")
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/ai/recipes")
async def generate_recipes(request_data: dict[str, Any]):
    try:

        try:
            request = RecipeRequest.from_dict(request_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")

        # 1. Extract Profile Context
        prefs = request.profile.preferences
        diet = prefs.diet or "No specific diet"
        allergies = ", ".join(prefs.allergies) if prefs.allergies else "None"
        about = ", ".join(prefs.about_me) if prefs.about_me else "None"

        # 2. Build the System Prompt with strict JSON requirements
        system_prompt = (
            "You are a professional chef. Create a single high-quality recipe.\n"
            f"Constraint - Diet: {diet}\n"
            f"Constraint - Allergies: {allergies} (DO NOT USE THESE)\n"
            f"User Context: {about}\n\n"
            "Respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"title\": \"string\",\n"
            "  \"ingredients\": [{\"quantity\": number, \"unit\": \"string\", \"name\": \"string\"}],\n"
            "  \"instructions\": [\"string\"],\n"
            "  \"portions\": number,\n"
            "  \"nutrients\": {\"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}\n"
            "}"
        )

        # 3. Invoke LLM
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Generate a recipe for: {request.prompt}")
        ]
        
        response = llm.invoke(messages)

        # 4. Parse and Validate
        # Clean markdown formatting if present
        clean_json = response.content.strip().removeprefix("```json").removesuffix("```").strip()
        data = json.loads(clean_json)

        recipe_obj = Recipe.from_dict(data) 
        return recipe_obj.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))