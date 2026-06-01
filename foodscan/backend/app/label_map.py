import re

LABELS = {
    "rice": ["rice", "chawal", "steamed rice"],
    "roti_naan_bread": ["roti", "chapati", "naan", "bread", "flatbread"],
    "dal": ["dal", "daal", "lentils", "dal tadka", "dal makhani"],
    "paneer_curry": ["paneer", "paneer curry", "shahi paneer", "matar paneer"],
    "chicken_curry": ["chicken", "chicken curry", "butter chicken", "chicken masala"],
    "egg_dish": ["egg", "omelette", "boiled egg", "egg bhurji"],
    "noodles_pasta": ["noodles", "hakka noodles", "pasta", "macaroni"],
    "sandwich_burger": ["sandwich", "burger"],
    "salad_fruit": ["salad", "fruits", "fruit bowl"],
    "dessert": ["sweet", "dessert", "cake", "ice cream", "gulab jamun"],
}

SYN_TO_CANON = {}
for canon, syns in LABELS.items():
    for s in syns:
        SYN_TO_CANON[s.lower().strip()] = canon
    SYN_TO_CANON[canon.lower().strip()] = canon

def normalize_label(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"[^a-z0-9\s_]", "", t)
    return t

def to_canonical(user_text: str) -> tuple[str | None, bool]:
    norm = normalize_label(user_text)
    if norm in SYN_TO_CANON:
        return SYN_TO_CANON[norm], False
    return None, True
