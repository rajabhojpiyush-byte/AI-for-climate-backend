def classify_text(text: str):
    """
    Classifies a disaster report based on its text.
    """

    text = text.lower()

    disaster_keywords = {
        "flood": [
            "flood",
            "flooded",
            "waterlogging",
            "water level",
            "heavy water"
        ],
        "fire": [
            "fire",
            "burning",
            "smoke",
            "flames",
            "blaze"
        ],
        "earthquake": [
            "earthquake",
            "tremor",
            "shaking",
            "earth tremor"
        ],
        "landslide": [
            "landslide",
            "mudslide",
            "rocks falling",
            "soil collapse"
        ],
        "storm": [
            "storm",
            "cyclone",
            "strong winds",
            "thunderstorm"
        ]
    }

    scores = {}

    for disaster_type, keywords in disaster_keywords.items():
        score = 0

        for keyword in keywords:
            if keyword in text:
                score += 1

        scores[disaster_type] = score

    predicted_type = max(scores, key=scores.get)
    highest_score = scores[predicted_type]

    if highest_score == 0:
        predicted_type = "unknown"
        confidence = 0.0
    else:
        total_matches = sum(scores.values())
        confidence = highest_score / total_matches

    return {
        "disaster_type": predicted_type,
        "confidence": round(confidence, 2)
    }
if __name__ == "__main__":
    report = "Heavy rain has caused severe flooding and waterlogging in the area."

    result = classify_text(report)

    print(result)