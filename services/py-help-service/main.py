import os
from typing import Any
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from client.cooking_assistant_api_client.models.help_request import HelpRequest
from client.cooking_assistant_api_client.models.help_response import HelpResponse

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

@app.post("/ai/help")
async def generate_help(request_data: dict[str, Any]):
    
    try:
        request = HelpRequest.from_dict(request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")
    
    try:
        context = ["You are a professional culinary assistant."]
        
        if request.profile and request.profile.preferences:
            prefs = request.profile.preferences
            if prefs.diet:
                context.append(f"The user follows a {prefs.diet} diet.")
    
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
