"""Static reference data and salary-band lookups used by the seed script.

Kept separate from seed.py so the "what does a realistic org look like"
data is easy to scan/tune independently of the generation logic.
"""

DEPARTMENTS = [
    ("Engineering", "ENG", 30),
    ("Sales", "SAL", 20),
    ("Customer Support", "SUP", 15),
    ("Marketing", "MKT", 10),
    ("Finance", "FIN", 8),
    ("Human Resources", "HR", 6),
    ("Legal", "LEG", 4),
    ("Operations", "OPS", 7),
]

COUNTRIES = [
    ("United States", "US", "USD", 25),
    ("India", "IN", "INR", 30),
    ("United Kingdom", "GB", "GBP", 10),
    ("Germany", "DE", "EUR", 8),
    ("Brazil", "BR", "BRL", 8),
    ("Canada", "CA", "CAD", 6),
    ("Australia", "AU", "AUD", 5),
    ("Singapore", "SG", "SGD", 4),
    ("France", "FR", "EUR", 4),
]

LEVELS = [
    ("L1", "Junior", 15),
    ("L2", "Mid", 30),
    ("L3", "Senior", 25),
    ("L4", "Staff", 15),
    ("L5", "Lead", 10),
    ("L6", "Manager", 5),
]

ROLE_TITLES_BY_DEPARTMENT = {
    "Engineering": ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "Engineering Manager"],
    "Sales": ["Sales Development Rep", "Account Executive", "Sales Manager"],
    "Customer Support": ["Support Associate", "Senior Support Associate", "Support Team Lead"],
    "Marketing": ["Marketing Associate", "Marketing Manager", "Content Strategist"],
    "Finance": ["Financial Analyst", "Senior Financial Analyst", "Finance Manager"],
    "Human Resources": ["HR Associate", "HR Business Partner", "HR Manager"],
    "Legal": ["Legal Counsel", "Senior Legal Counsel"],
    "Operations": ["Operations Associate", "Operations Manager"],
}

# Base annual salary (in local currency) per (level_code, country_iso) starting point,
# before gaussian noise and outlier/gap injection are applied.
BASE_SALARY_BY_LEVEL_AND_COUNTRY = {
    ("US", "L1"): 70000,
    ("US", "L2"): 95000,
    ("US", "L3"): 130000,
    ("US", "L4"): 165000,
    ("US", "L5"): 200000,
    ("US", "L6"): 240000,
    ("IN", "L1"): 700000,
    ("IN", "L2"): 1200000,
    ("IN", "L3"): 2000000,
    ("IN", "L4"): 3000000,
    ("IN", "L5"): 4200000,
    ("IN", "L6"): 5500000,
    ("GB", "L1"): 32000,
    ("GB", "L2"): 45000,
    ("GB", "L3"): 62000,
    ("GB", "L4"): 80000,
    ("GB", "L5"): 100000,
    ("GB", "L6"): 125000,
    ("DE", "L1"): 45000,
    ("DE", "L2"): 58000,
    ("DE", "L3"): 75000,
    ("DE", "L4"): 95000,
    ("DE", "L5"): 115000,
    ("DE", "L6"): 140000,
    ("BR", "L1"): 60000,
    ("BR", "L2"): 90000,
    ("BR", "L3"): 130000,
    ("BR", "L4"): 170000,
    ("BR", "L5"): 220000,
    ("BR", "L6"): 280000,
    ("CA", "L1"): 60000,
    ("CA", "L2"): 80000,
    ("CA", "L3"): 105000,
    ("CA", "L4"): 135000,
    ("CA", "L5"): 165000,
    ("CA", "L6"): 200000,
    ("AU", "L1"): 65000,
    ("AU", "L2"): 85000,
    ("AU", "L3"): 110000,
    ("AU", "L4"): 140000,
    ("AU", "L5"): 170000,
    ("AU", "L6"): 205000,
    ("SG", "L1"): 48000,
    ("SG", "L2"): 65000,
    ("SG", "L3"): 85000,
    ("SG", "L4"): 110000,
    ("SG", "L5"): 135000,
    ("SG", "L6"): 165000,
    ("FR", "L1"): 38000,
    ("FR", "L2"): 50000,
    ("FR", "L3"): 65000,
    ("FR", "L4"): 82000,
    ("FR", "L5"): 100000,
    ("FR", "L6"): 125000,
}

GENDERS_WEIGHTED = [("female", 48), ("male", 48), ("other", 4)]
