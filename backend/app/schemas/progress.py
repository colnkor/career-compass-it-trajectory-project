from pydantic import BaseModel

class UserProgressBase(BaseModel):
  profession_id: int
  topic_id: int
  is_completed: bool


class UserProgressCreate(UserProgressBase):
  pass

class ProgressUpdateRequest(UserProgressCreate):
  pass