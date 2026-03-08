from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from services.supabase_client import get_supabase
from dependencies import get_current_user 
from services.ai import analyze_resume
import PyPDF2
import io

# 1. Removed the prefix here
router = APIRouter()
supabase = get_supabase()

@router.post("/evaluate")
async def evaluate_resume(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user identification")

    try:
        content = await file.read()
        resume_text = ""

        if file.filename.lower().endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted: resume_text += extracted + " "
        else:
            resume_text = content.decode("utf-8", errors="ignore")

        safe_resume_text = resume_text.replace("\x00", "")[:4000]
        ai_response = analyze_resume(safe_resume_text)
        
        score = ai_response.get("score", 0)
        feedback = ai_response.get("feedback", {"strengths": [], "weaknesses": []})

        # Save to history
        supabase.table('resumes').insert({
            "user_id": user_id,
            "resume_text": safe_resume_text[:2000], 
            "score": score,
            "feedback": feedback
        }).execute()

        # Update Dashboard
        progress_res = supabase.table('user_progress').select('*').eq('user_id', user_id).execute()
        
        if not progress_res.data:
            supabase.table('user_progress').insert({
                "user_id": user_id,
                "best_resume_score": score,
                "activity_type": "initial_upload"
            }).execute()
        else:
            current_best = progress_res.data[0].get("best_resume_score") or 0
            if score > current_best:
                supabase.table('user_progress').update({"best_resume_score": score}).eq('user_id', user_id).execute()

        return {"message": "Success", "score": score, "feedback": feedback}

    except Exception as e:
        print(f"Resume Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))