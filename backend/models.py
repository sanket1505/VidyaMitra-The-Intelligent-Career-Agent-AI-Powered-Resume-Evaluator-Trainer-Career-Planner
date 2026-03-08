from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Relationships: This allows us to access a user's scores easily via user.progress
    progress = relationship("UserProgress", back_populates="owner")
    plans = relationship("TrainingPlan", back_populates="owner")

class UserProgress(Base):
    """
    Stores historical data for Quizzes and Resume Evaluations.
    Used to generate the charts on the Progress Page.
    """
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # activity_type can be "QUIZ", "RESUME", or "INTERVIEW"
    activity_type = Column(String) 
    score = Column(Float)
    details = Column(String)  # e.g., "Frontend Developer Quiz"
    timestamp = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="progress")

class TrainingPlan(Base):
    """
    Saves the AI-generated roadmap so the user doesn't have to 
    re-generate it every time they visit the page.
    """
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_role = Column(String)
    current_milestone = Column(String)
    completed_modules = Column(Integer, default=0)
    total_modules = Column(Integer, default=5)
    
    owner = relationship("User", back_populates="plans")