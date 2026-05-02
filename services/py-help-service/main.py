import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load variables from .env for local testing
load_dotenv()

app = FastAPI(title="Cooking Assistant GenAI Service")

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# request structure
class PromptRequest(BaseModel):
    prompt: str

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/generate/help")
async def generate_help(request: PromptRequest):
    try:
        response = llm.invoke(request.prompt)
        return {"answer": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
