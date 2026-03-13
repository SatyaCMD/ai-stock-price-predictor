from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@router.post("/")
async def chat_with_ai(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    try:
        system_instruction = """
        You are a highly professional, expert AI Market Assistant named TradeMind AI.
        You specialize in the stock market, cryptocurrency, forex, and general financial concepts.
        Provide concise, accurate, and easy-to-understand answers. 
        If the user asks about a specific stock and you have context data, use it.
        Always maintain a helpful, objective, and analytical tone.
        Format your responses in markdown for readability (use bolding, lists, etc. when appropriate).
        Keep your responses relatively brief (under 150 words usually) unless specifically asked for a deep dive.
        """
        
        prompt = f"User Message: {request.message}\n"
        if request.context:
            prompt += f"\nAdditional Context from App:\n{request.context}"
            
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"AI Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response")
