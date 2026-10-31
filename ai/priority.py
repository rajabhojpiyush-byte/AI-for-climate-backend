priority_map = {
    "critical": {
        "priority": "urgent",
        "score": 100
    },

    "high": {
        "priority": "high",
        "score": 75
    },

    "medium": {
        "priority": "normal",
        "score": 50
    },

    "low": {
        "priority": "low",
        "score": 25
    }
}


def calculate_priority(severity: str):

    severity = severity.lower()

    if severity not in priority_map:
        return {
            "priority": "low",
            "score": 0
        }

    result = priority_map[severity]

    return {
        "priority": result["priority"],
        "score": result["score"]
    }


if __name__ == "__main__":

    severity = "critical"

    result = calculate_priority(severity)

    print(result)