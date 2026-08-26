from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime, timezone

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Ward(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    zone: str
    lat: float
    lng: float
    population: int
    poverty_rate: float
    literacy_rate: float
    infra_score: int
    budget_allocated: float

class Complaint(SQLModel, table=True):
    id: str = Field(primary_key=True)
    transcript: str
    original_language: str
    category: str
    urgency: str
    health_impact: bool = Field(default=False)
    locality: str
    ward_id: str = Field(index=True)
    lat: float
    lng: float
    photo_url: Optional[str] = None
    created_at: str
    
    # Citizen Identity & Account Session Fields (Default system.seed to prevent seed spillover!)
    user_email: Optional[str] = Field(default="system.seed@indore.gov.in", index=True)
    citizen_name: Optional[str] = Field(default="Harsh Parmar")
    citizen_phone: Optional[str] = Field(default="+91 9826012345")
    citizen_id_hash: Optional[str] = Field(default="VOTER-IND-4821")
    landmark: Optional[str] = Field(default="Near Cat Road Square")
    verification_status: Optional[str] = Field(default="VERIFIED_CITIZEN")
    
    # AI Ministry & Department Auto-Routing Fields
    responsible_department: Optional[str] = Field(default="Indore Municipal Corporation (IMC) — Drainage & Sewerage Department")
    responsible_ministry: Optional[str] = Field(default="Ministry of Housing & Urban Affairs (MoHUA)")
    nodal_officer: Optional[str] = Field(default="Er. Rajesh Sharma (Chief Engineer)")
    current_status: Optional[str] = Field(default="PENDING_ADMIN_REVIEW")

class Cluster(SQLModel, table=True):
    id: str = Field(primary_key=True)
    label: str
    category: str
    severity: str
    locality: str
    lat: float
    lng: float
    complaint_count: int
    health_risk: bool = Field(default=False)
    demand_score: float
    poverty_score: float
    infra_gap_score: float
    budget_gap_score: float
    ppi_score: float
    sample_voices: List[str] = Field(default=[], sa_column=Column(JSON))

class Project(SQLModel, table=True):
    id: str = Field(primary_key=True)
    cluster_id: str
    title: str
    locality: str
    category: str
    responsible_department: Optional[str] = Field(default="IMC Drainage Department")
    responsible_ministry: Optional[str] = Field(default="MoHUA")
    estimated_budget_inr: float
    formatted_budget: str
    target_beneficiaries: int
    roi_score: int
    funding_scheme: str
    problem_justification: str
    scope_of_work: List[str] = Field(default=[], sa_column=Column(JSON))
    impact_metrics: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    community_upvotes: int = Field(default=0)
    status: str = Field(default="APPROVED_FOR_DPR")
