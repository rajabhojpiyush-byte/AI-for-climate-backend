from ai.nugen_client import analyze_disaster_report

report = """
Heavy rainfall has caused flooding.
Water has entered several houses and people
are trapped inside.
"""

result = analyze_disaster_report(report)

print("AI Analysis:")
print(result)