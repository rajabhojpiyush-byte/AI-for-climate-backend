severity_keywords = {
    "low": [
        "minor",
        "small",
        "slight"
    ],

    "medium": [
        "damage",
        "damaged",
        "blocked",
        "waterlogging"
    ],

    "high": [
        "flooded",
        "destroyed",
        "injured",
        "heavy damage"
    ],

    "critical": [
        "trapped",
        "collapsed",
        "deaths",
        "dead",
        "critical"
    ]
}


def calculate_severity(text: str):

    text = text.lower()

    scores = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0
    }

    for severity, keywords in severity_keywords.items():

        for keyword in keywords:

            if keyword in text:
                scores[severity] += 1

    highest_severity = max(scores, key=scores.get)
    highest_score = scores[highest_severity]

    if highest_score == 0:
        highest_severity = "low"
        confidence = 0.0

    else:
        total_matches = sum(scores.values())
        confidence = highest_score / total_matches

    return {
        "severity": highest_severity,
        "score": highest_score,
        "confidence": round(confidence, 2)
    }


if __name__ == "__main__":

    report = "People are trapped inside a collapsed building."

    result = calculate_severity(report)

    print(result)