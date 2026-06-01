import easyocr

reader = easyocr.Reader(['en'])

def extract_text_from_image(image_path):
    results = reader.readtext(image_path)

    extracted_text = " ".join([res[1] for res in results])

    return extracted_text.lower()