from pydantic import BaseModel, ConfigDict


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str


class CountryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    iso_code: str
    currency_code: str
