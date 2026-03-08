import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize the Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_resume(resume_text: str):
    """
    Analyzes a resume using Llama-3.1 and returns an ATS score and feedback.
    """
    if not resume_text:
         return {"score": 0, "feedback": {"strengths": [], "weaknesses": ["No text provided"]}}

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and senior technical recruiter.
    Analyze the following resume text and provide:
    1. An ATS match score out of 100.
    2. A list of 2-3 specific strengths.
    3. A list of 2-3 specific areas for improvement (weaknesses).

    Return ONLY a valid JSON object in this exact format:
    {{
        "score": 85,
        "feedback": {{
            "strengths": ["Strong Python skills", "Good project descriptions"],
            "weaknesses": ["Missing quantitative metrics", "Formatting is inconsistent"]
        }}
    }}

    Resume Text:
    {resume_text}
    """

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Updated model
            temperature=0.2,
            response_format={"type": "json_object"} 
        )
        
        result_content = response.choices[0].message.content
        result_json = json.loads(result_content)
        
        return {
            "score": result_json.get("score", 50),
            "feedback": result_json.get("feedback", {"strengths": [], "weaknesses": []})
        }
        
    except Exception as e:
        print(f"Groq AI Resume Error: {e}")
        return {
            "score": 0, 
            "feedback": {"strengths": [], "weaknesses": [f"AI Analysis Failed: {str(e)}"]}
        }


def generate_custom_plan(role: str):
    """
    Generates a training plan using Llama-3.1.
    """
    if not role:
        role = "Technology Professional"
        
    prompt = f"""
    You are an expert career counselor. Create a high-level learning plan for a {role}.
    Provide the title of the very first milestone they should focus on, and the total number of modules to master the role (usually between 5 and 10).
    
    Return ONLY a valid JSON object in this exact format:
    {{
        "nextMilestone": "Mastering the Basics",
        "total": 6
    }}
    """
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Updated model
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        result_json = json.loads(response.choices[0].message.content)
        
        return {
            "nextMilestone": result_json.get("nextMilestone", f"Introduction to {role}"),
            "total": result_json.get("total", 5) 
        }
    except Exception as e:
        print(f"Groq AI Plan Error: {e}")
        return {"nextMilestone": "Introduction", "total": 5}


def generate_quiz(topic: str):
    """
    Generates a multiple-choice quiz using Llama-3.1 based on a given topic.
    """
    if not topic:
        topic = "General Technology"

    prompt = f"""
    You are an expert technical educator. Generate a 5-question multiple-choice quiz on the topic: '{topic}'.
    Make the questions challenging but fair.
    
    Return ONLY a valid JSON object in this exact format, with no markdown formatting or extra text:
    {{
        "questions": [
            {{
                "question": "What does HTML stand for?",
                "options": ["Hyper Text Markup Language", "Hot Mail", "How to Make Lasagna", "Hyperlinks and Text Markup Language"],
                "answer": "Hyper Text Markup Language"
            }}
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Updated model
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result_content = response.choices[0].message.content
        return json.loads(result_content)
        
    except Exception as e:
        print(f"Groq AI Quiz Error: {e}")
        return {
            "questions": [
                {
                    "question": f"Could not generate a quiz for {topic}. Please try again.",
                    "options": ["Okay"],
                    "answer": "Okay"
                }
            ]
        }


def generate_interview_response(role: str = "Technology Professional", question: str = "", user_answer: str = ""):
    """
    Evaluates a user's answer to an interview question using Llama-3.1
    and generates the next question.
    """
    prompt = f"""
    You are an expert technical interviewer hiring for a {role} position.
    The candidate was asked: "{question}"
    The candidate answered: "{user_answer}"

    Evaluate their answer and provide the next question. 
    Return ONLY a valid JSON object in this exact format:
    {{
        "score": 85,
        "feedback": "Your explanation was clear, but you missed mentioning edge cases.",
        "ideal_answer": "The ideal answer should cover...",
        "next_question": "Can you give an example of a time you resolved a complex bug?"
    }}
    """

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Updated model
            temperature=0.3,
            response_format={"type": "json_object"} 
        )
        
        result_content = response.choices[0].message.content
        return json.loads(result_content)
        
    except Exception as e:
        print(f"Groq AI Interview Error: {e}")
        return {
            "score": 0,
            "feedback": "AI evaluation failed.",
            "ideal_answer": "N/A",
            "next_question": "Let's try another topic."
        }