from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
from dotenv import load_dotenv
import openai
import anthropic
import redis
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Synapse AI Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize clients
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Request/Response models
class TextInput(BaseModel):
    text: str = Field(..., description="Input text to process")
    config: Dict[str, Any] = Field(default_factory=dict)

class SummarizeRequest(TextInput):
    style: str = Field("brief", description="Summary style: brief, detailed, bullet-points")
    max_length: Optional[int] = Field(None, description="Maximum summary length")
    model: str = Field("gpt-4", description="AI model to use")

class QuestionGenerateRequest(TextInput):
    question_type: str = Field("multiple-choice", description="Type: multiple-choice, true-false, open-ended")
    difficulty: str = Field("medium", description="Difficulty: easy, medium, hard")
    count: int = Field(5, description="Number of questions to generate")
    model: str = Field("gpt-4", description="AI model to use")

class FlashcardGenerateRequest(TextInput):
    max_cards: int = Field(20, description="Maximum number of flashcards")
    include_definitions: bool = Field(True, description="Include definitions")
    model: str = Field("gpt-4", description="AI model to use")

class GradeRequest(BaseModel):
    answer: str = Field(..., description="Student's answer")
    context: str = Field(..., description="Source material or rubric")
    criteria: Dict[str, Any] = Field(default_factory=dict, description="Grading criteria")
    harshness: str = Field("medium", description="Grading harshness: lenient, medium, strict")
    model: str = Field("gpt-4", description="AI model to use")

# Helper functions
def get_user_id(x_user_id: Optional[str] = Header(None)):
    """Extract user ID from headers"""
    return x_user_id or "anonymous"

def cache_key(operation: str, user_id: str, content_hash: str):
    """Generate cache key"""
    return f"ai:{operation}:{user_id}:{content_hash}"

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service", "timestamp": datetime.now().isoformat()}

# Summarization endpoint
@app.post("/summarize")
async def summarize(request: SummarizeRequest, user_id: str = Header(None, alias="X-User-Id")):
    try:
        # Check cache
        cache_id = cache_key("summarize", user_id, request.text[:100])
        cached = redis_client.get(cache_id)
        if cached:
            return json.loads(cached)
        
        # Build prompt based on style
        style_prompts = {
            "brief": "Provide a brief, concise summary in 2-3 sentences.",
            "detailed": "Provide a comprehensive summary covering all main points.",
            "bullet-points": "Provide a summary as a bulleted list of key points."
        }
        
        prompt = f"""
        {style_prompts.get(request.style, style_prompts['brief'])}
        
        Text to summarize:
        {request.text}
        
        Summary:
        """
        
        # Generate summary
        if request.model.startswith("claude"):
            response = anthropic_client.messages.create(
                model=request.model,
                max_tokens=request.max_length or 500,
                messages=[{"role": "user", "content": prompt}]
            )
            summary = response.content[0].text
        else:
            response = openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=request.max_length or 500
            )
            summary = response.choices[0].message.content
        
        result = {"summary": summary, "model": request.model}
        
        # Cache result
        redis_client.setex(cache_id, 3600, json.dumps(result))
        
        return result
    
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Question generation endpoint
@app.post("/generate-questions")
async def generate_questions(request: QuestionGenerateRequest, user_id: str = Header(None, alias="X-User-Id")):
    try:
        prompt = f"""
        Generate {request.count} {request.question_type} questions based on the following text.
        Difficulty level: {request.difficulty}
        
        For multiple-choice questions, provide 4 options with one correct answer.
        For true-false questions, provide a statement and the correct answer.
        For open-ended questions, provide thought-provoking questions that test understanding.
        
        Format the output as a JSON array of questions.
        
        Text:
        {request.text}
        
        Questions:
        """
        
        # Generate questions
        if request.model.startswith("claude"):
            response = anthropic_client.messages.create(
                model=request.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
        else:
            response = openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
        
        # Parse questions
        try:
            questions = json.loads(content)
            if not isinstance(questions, list):
                questions = questions.get("questions", [])
        except:
            # Fallback if JSON parsing fails
            questions = [{"question": content, "type": request.question_type}]
        
        return {"questions": questions, "count": len(questions), "model": request.model}
    
    except Exception as e:
        logger.error(f"Question generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Flashcard generation endpoint
@app.post("/generate-flashcards")
async def generate_flashcards(request: FlashcardGenerateRequest, user_id: str = Header(None, alias="X-User-Id")):
    try:
        prompt = f"""
        Extract key terms and concepts from the following text and create flashcards.
        Maximum cards: {request.max_cards}
        Include definitions: {request.include_definitions}
        
        Format as JSON array with 'term' and 'definition' fields.
        
        Text:
        {request.text}
        
        Flashcards:
        """
        
        # Generate flashcards
        if request.model.startswith("claude"):
            response = anthropic_client.messages.create(
                model=request.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
        else:
            response = openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
        
        # Parse flashcards
        try:
            flashcards = json.loads(content)
            if not isinstance(flashcards, list):
                flashcards = flashcards.get("flashcards", [])
        except:
            flashcards = [{"term": "Error", "definition": "Failed to parse flashcards"}]
        
        return {"flashcards": flashcards[:request.max_cards], "count": len(flashcards), "model": request.model}
    
    except Exception as e:
        logger.error(f"Flashcard generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Grading endpoint
@app.post("/grade")
async def grade_answer(request: GradeRequest, user_id: str = Header(None, alias="X-User-Id")):
    try:
        harshness_prompts = {
            "lenient": "Be encouraging and focus on what the student got right.",
            "medium": "Provide balanced feedback highlighting both strengths and areas for improvement.",
            "strict": "Be rigorous and critical, pointing out all errors and missing elements."
        }
        
        prompt = f"""
        Grade the following student answer based on the provided context/rubric.
        {harshness_prompts.get(request.harshness, harshness_prompts['medium'])}
        
        Context/Rubric:
        {request.context}
        
        Student Answer:
        {request.answer}
        
        Provide:
        1. A numerical grade (0-100)
        2. Detailed feedback
        3. Specific suggestions for improvement
        
        Format as JSON with 'grade', 'feedback', and 'suggestions' fields.
        """
        
        # Generate grade
        if request.model.startswith("claude"):
            response = anthropic_client.messages.create(
                model=request.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
        else:
            response = openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
        
        # Parse result
        try:
            result = json.loads(content)
        except:
            result = {
                "grade": 0,
                "feedback": content,
                "suggestions": ["Unable to parse grading response"]
            }
        
        return {**result, "model": request.model, "harshness": request.harshness}
    
    except Exception as e:
        logger.error(f"Grading error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3004)