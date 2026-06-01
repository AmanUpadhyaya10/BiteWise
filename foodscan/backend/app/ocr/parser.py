import re

def extract_nutrition(text):
    data = {}

    kcal = re.search(r'(?:calories?|energy|kcal)[\s:]*(\d+(?:\.\d+)?)'
                     r'|(\d+(?:\.\d+)?)\s*kcal', text, re.IGNORECASE)
    protein = re.search(r'protein[\s:]*(\d+(?:\.\d+)?)\s*g'
                        r'|(\d+(?:\.\d+)?)\s*g\s*protein', text, re.IGNORECASE)
    carbs = re.search(r'carbo\w*[\s:]*(\d+(?:\.\d+)?)\s*g'
                      r'|(\d+(?:\.\d+)?)\s*g\s*carb', text, re.IGNORECASE)
    fat = re.search(r'(?:total\s+)?fat[\s:]*(\d+(?:\.\d+)?)\s*g'
                    r'|(\d+(?:\.\d+)?)\s*g\s*fat', text, re.IGNORECASE)

    def first_group(m):
        if not m:
            return None
        return float(m.group(1) or m.group(2))

    if kcal:
        data["calories"] = first_group(kcal)
    if protein:
        data["protein"] = first_group(protein)
    if carbs:
        data["carbs"] = first_group(carbs)
    if fat:
        data["fat"] = first_group(fat)

    return data