from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    employee_id: str
    username: str

class TokenData(BaseModel):
    employee_id: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    employee_id: str
    password: str
    remember_me: Optional[bool] = False

# User Schemas
class UserBase(BaseModel):
    employee_id: str
    username: str
    role: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

# Configuration Schemas
class ReferenceConfigBase(BaseModel):
    firmware: str
    plc_version: str
    cpu: str
    ram: str
    storage: str
    communication_ports: List[str]
    installed_modules: List[str]
    sensor_count: int

class ReferenceConfigCreate(ReferenceConfigBase):
    machine_id: str

class ReferenceConfigOut(ReferenceConfigBase):
    id: int
    machine_id: str

    class Config:
        from_attributes = True

class CurrentConfigBase(BaseModel):
    firmware: str
    plc_version: str
    cpu: str
    ram: str
    storage: str
    communication_ports: List[str]
    installed_modules: List[str]
    sensor_count: int
    temperature: float
    power_status: str

class CurrentConfigCreate(CurrentConfigBase):
    machine_id: str

class CurrentConfigOut(CurrentConfigBase):
    id: int
    machine_id: str

    class Config:
        from_attributes = True

# Machine Schemas
class MachineBase(BaseModel):
    machine_id: str
    name: str
    manufacturer: str
    category: str
    model: str
    status: Optional[str] = "Disconnected"

class MachineCreate(MachineBase):
    reference_config: ReferenceConfigBase
    current_config: Optional[CurrentConfigBase] = None

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    reference_config: Optional[ReferenceConfigBase] = None
    current_config: Optional[CurrentConfigBase] = None

class MachineOut(MachineBase):
    id: int
    reference_config: Optional[ReferenceConfigOut] = None
    current_config: Optional[CurrentConfigOut] = None

    class Config:
        from_attributes = True

# Diagnostic Schemas
class DiagnosticRunRequest(BaseModel):
    machine_id: str

class DiagnosticResultOut(BaseModel):
    id: int
    machine_id: str
    timestamp: datetime
    status: str
    health_score: int
    details: Any
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DiagnosticResultUpdateNotes(BaseModel):
    notes: str

# Report Schemas
class ReportCreate(BaseModel):
    diagnostic_result_id: int
    title: str

class ReportUpdateMetadata(BaseModel):
    title: str

class ReportOut(BaseModel):
    id: int
    diagnostic_result_id: int
    title: str
    file_path: str
    generated_at: datetime
    engineer_id: Optional[int]
    metadata_json: Optional[Any] = None

    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogOut(BaseModel):
    id: int
    timestamp: datetime
    employee_id: str
    action: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

# Alert Schemas
class AlertOut(BaseModel):
    id: int
    machine_id: str
    timestamp: datetime
    health_score: int
    message: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
