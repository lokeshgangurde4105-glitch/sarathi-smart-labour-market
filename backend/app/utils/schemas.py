from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# COMMON CONFIGURATION
# ============================================================

class ORMBaseModel(BaseModel):
    """
    Allows Pydantic schemas to read SQLAlchemy model objects.
    """

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# LOCATION
# ============================================================

class LocationBase(BaseModel):
    state: str
    district: str
    city: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# SECTOR
# ============================================================

class SectorBase(BaseModel):
    name: str
    description: Optional[str] = None
    growth_rate: float = 0.0


class SectorCreate(SectorBase):
    pass


class SectorResponse(SectorBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# JOB ROLE
# ============================================================

class JobRoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    sector_id: Optional[int] = None
    required_experience: Optional[str] = None
    average_salary: Optional[float] = None


class JobRoleCreate(JobRoleBase):
    pass


class JobRoleResponse(JobRoleBase, ORMBaseModel):
    id: int


# ============================================================
# SKILL
# ============================================================

class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    is_emerging: bool = False
    is_obsolete: bool = False


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# JOB DEMAND
# ============================================================

class JobDemandBase(BaseModel):
    job_role_id: int
    sector_id: int
    location_id: int

    posting_count: int = Field(
        default=0,
        ge=0,
    )

    growth_rate: float = 0.0

    salary_min: Optional[float] = None
    salary_max: Optional[float] = None

    demand_level: str = "Medium"

    period: str

    source: Optional[str] = None


class JobDemandCreate(JobDemandBase):
    pass


class JobDemandResponse(JobDemandBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# SKILL DEMAND
# ============================================================

class SkillDemandBase(BaseModel):
    skill_id: int

    job_role_id: Optional[int] = None
    location_id: Optional[int] = None

    required_proficiency: str

    demand_count: int = Field(
        default=0,
        ge=0,
    )

    growth_rate: float = 0.0

    period: str


class SkillDemandCreate(SkillDemandBase):
    pass


class SkillDemandResponse(SkillDemandBase, ORMBaseModel):
    id: int


# ============================================================
# SKILL GAP
# ============================================================

class SkillGapBase(BaseModel):
    skill_id: int

    job_role_id: Optional[int] = None
    location_id: Optional[int] = None

    required_proficiency: str
    current_proficiency: str

    demand_count: int = 0
    available_candidates: int = 0

    gap_score: float = 0.0

    priority: str = "Medium"

    recommended_course: Optional[str] = None


class SkillGapCreate(SkillGapBase):
    pass


class SkillGapResponse(SkillGapBase, ORMBaseModel):
    id: int


# ============================================================
# COURSE
# ============================================================

class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None

    sector_id: Optional[int] = None

    qualification: Optional[str] = None

    duration_months: Optional[int] = None

    training_capacity: int = 0
    enrolled_students: int = 0

    placement_rate: float = 0.0
    alignment_score: float = 0.0

    demand_level: str = "Medium"
    status: str = "Active"


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase, ORMBaseModel):
    id: int
    last_updated: datetime


# ============================================================
# CURRICULUM
# ============================================================

class CurriculumBase(BaseModel):
    course_id: int

    version: str

    current_content: str

    industry_requirements: Optional[str] = None

    alignment_score: float = 0.0

    update_required: bool = False


class CurriculumCreate(CurriculumBase):
    pass


class CurriculumResponse(CurriculumBase, ORMBaseModel):
    id: int


# ============================================================
# EMPLOYER
# ============================================================

class EmployerBase(BaseModel):
    company_name: str

    industry: Optional[str] = None

    sector_id: Optional[int] = None

    location: Optional[str] = None

    company_size: Optional[str] = None


class EmployerCreate(EmployerBase):
    pass


class EmployerResponse(EmployerBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# EMPLOYER SURVEY
# ============================================================

class EmployerSurveyBase(BaseModel):
    employer_id: int

    job_role: str

    required_skills: str

    required_proficiency: Optional[str] = None

    experience_required: Optional[str] = None

    technology_used: Optional[str] = None

    expected_hiring: int = 0

    salary_min: Optional[float] = None
    salary_max: Optional[float] = None

    future_skill_demand: Optional[str] = None

    hiring_difficulty: Optional[str] = None


class EmployerSurveyCreate(EmployerSurveyBase):
    pass


class EmployerSurveyResponse(
    EmployerSurveyBase,
    ORMBaseModel,
):
    id: int
    created_at: datetime


# ============================================================
# TRAINER
# ============================================================

class TrainerBase(BaseModel):
    name: str

    institute: Optional[str] = None

    current_skills: Optional[str] = None

    industry_required_skills: Optional[str] = None

    skill_gap: Optional[str] = None

    certifications: Optional[str] = None

    upskilling_recommendation: Optional[str] = None

    capacity: int = 0


class TrainerCreate(TrainerBase):
    pass


class TrainerResponse(TrainerBase, ORMBaseModel):
    id: int
    created_at: datetime


# ============================================================
# INFRASTRUCTURE
# ============================================================

class InfrastructureBase(BaseModel):
    district: str

    course: str

    students: int = 0

    training_seats: int = 0

    computers_required: int = 0
    computers_available: int = 0

    gpu_required: int = 0
    gpu_available: int = 0

    labs_required: int = 0
    labs_available: int = 0

    trainers_required: int = 0
    trainers_available: int = 0

    internet_required: bool = True

    software_requirements: Optional[str] = None


class InfrastructureCreate(InfrastructureBase):
    pass


class InfrastructureResponse(
    InfrastructureBase,
    ORMBaseModel,
):
    id: int


# ============================================================
# DISTRICT TRAINING PLAN
# ============================================================

class DistrictTrainingPlanBase(BaseModel):
    district: str

    priority_industries: Optional[str] = None

    priority_job_roles: Optional[str] = None

    priority_skills: Optional[str] = None

    recommended_courses: Optional[str] = None

    student_capacity: int = 0

    trainer_capacity: int = 0

    equipment_requirements: Optional[str] = None

    institute_allocation: Optional[str] = None

    expected_placement: float = 0.0

    generated_by_ai: bool = False


class DistrictTrainingPlanCreate(
    DistrictTrainingPlanBase
):
    pass


class DistrictTrainingPlanResponse(
    DistrictTrainingPlanBase,
    ORMBaseModel,
):
    id: int
    created_at: datetime


# ============================================================
# CANDIDATE
# ============================================================

class CandidateBase(BaseModel):
    name: str

    location_id: Optional[int] = None

    education: Optional[str] = None

    skills: Optional[str] = None

    target_job: Optional[str] = None

    career_readiness_score: float = 0.0

    experience_years: float = 0.0

    certifications: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(
    CandidateBase,
    ORMBaseModel,
):
    id: int


# ============================================================
# PLACEMENT OUTCOME
# ============================================================

class PlacementOutcomeBase(BaseModel):
    candidate_id: int

    course_id: Optional[int] = None

    employer_name: Optional[str] = None

    placed: bool = False

    salary: Optional[float] = None

    skill_match_score: float = 0.0

    retention_months: int = 0

    employer_satisfaction: float = 0.0

    placement_date: Optional[datetime] = None


class PlacementOutcomeCreate(
    PlacementOutcomeBase
):
    pass


class PlacementOutcomeResponse(
    PlacementOutcomeBase,
    ORMBaseModel,
):
    id: int


# ============================================================
# AI RECOMMENDATION
# ============================================================

class AIRecommendationBase(BaseModel):
    title: str

    recommendation: str

    reason: str

    data_evidence: Optional[str] = None

    expected_impact: Optional[str] = None

    priority: str = "Medium"

    action: Optional[str] = None

    status: str = "Pending"

    confidence_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
    )


class AIRecommendationCreate(
    AIRecommendationBase
):
    pass


class AIRecommendationResponse(
    AIRecommendationBase,
    ORMBaseModel,
):
    id: int
    generated_at: datetime


# ============================================================
# EMPLOYER FEEDBACK
# ============================================================

class EmployerFeedbackBase(BaseModel):
    employer_id: int

    candidate_id: Optional[int] = None

    skill_match_score: float = 0.0

    satisfaction_score: float = 0.0

    feedback: Optional[str] = None

    recommended_skill_changes: Optional[str] = None


class EmployerFeedbackCreate(
    EmployerFeedbackBase
):
    pass


class EmployerFeedbackResponse(
    EmployerFeedbackBase,
    ORMBaseModel,
):
    id: int
    created_at: datetime


# ============================================================
# DATA SOURCE
# ============================================================

class DataSourceBase(BaseModel):
    name: str

    source_type: str

    status: str = "Active"

    record_count: int = 0

    reliability_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
    )

    last_updated: Optional[datetime] = None

    validation_status: str = "Pending"


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceResponse(
    DataSourceBase,
    ORMBaseModel,
):
    id: int


# ============================================================
# USER
# ============================================================

class UserBase(BaseModel):
    name: str

    email: str

    role: str

    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserResponse(
    UserBase,
    ORMBaseModel,
):
    id: int
    created_at: datetime


# ============================================================
# DASHBOARD KPI
# ============================================================

class DashboardKPI(BaseModel):
    label: str

    value: int | float | str

    change: str

    trend: str


# ============================================================
# DEMAND TREND
# ============================================================

class DemandTrend(BaseModel):
    month: str

    postings: int

    high_demand_roles: int

    emerging_skills: int


# ============================================================
# SECTOR DISTRIBUTION
# ============================================================

class SectorDistribution(BaseModel):
    name: str

    value: float


# ============================================================
# DASHBOARD ALERT
# ============================================================

class DashboardAlert(BaseModel):
    type: str

    text: str


# ============================================================
# API RESPONSE
# ============================================================

class APIResponse(BaseModel):
    success: bool = True

    message: str

    data: Optional[object] = None