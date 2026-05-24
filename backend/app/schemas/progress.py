from pydantic import BaseModel
from datetime import datetime

class UserProgressBase(BaseModel):
  profession_id: int
  topic_id: int
  is_completed: bool


class ProgressResponse(UserProgressBase):
  id: int
  completed_at: datetime | None = None
  updated_at: datetime

  model_config = {"from_attributes": True}


class UserProgressCreate(UserProgressBase):
  pass

class ProgressUpdateRequest(UserProgressCreate):
  pass