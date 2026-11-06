"""
ResQAI — Disaster Report Authenticity & Validity Validator

Detects whether a citizen report is a genuine disaster emergency or
a prank, joke, metaphor, personal complaint, spam, prompt injection, or irrelevant text.
"""

import re
from typing import Optional, Tuple

# Common metaphorical phrases that misuse disaster terminology
METAPHOR_PATTERNS = [
    r"\bheart\s+(is\s+)?on\s+fire\b",
    r"\bmy\s+soul\s+is\s+on\s+fire\b",
    r"\bexam[s]?\s+(was|were|are|is)\s+a\s+disaster\b",
    r"\btest\s+(was|is)\s+a\s+disaster\b",
    r"\bgrades?\s+(are|were)\s+a\s+disaster\b",
    r"\binterview\s+(was|is)\s+a\s+disaster\b",
    r"\bdate\s+(was|is)\s+a\s+disaster\b",
    r"\bflooded\s+with\s+(work|emails?|messages?|tasks?|requests?|calls?)\b",
    r"\bdrowning\s+in\s+(debt|work|homework|paperwork|sorrow)\b",
    r"\bavalanche\s+of\s+(work|emails?|messages?|orders?)\b",
    r"\bon\s+fire\s+today\b",
    r"\bshe['\"]?s?\s+(a|an)\s+(walking\s+)?(earthquake|disaster|storm|tornado)\b",
    r"\bhe['\"]?s?\s+(a|an)\s+(walking\s+)?(earthquake|disaster|storm|tornado)\b",
    r"\brelationship\s+(is\s+a\s+disaster|on\s+fire|flooding)\b",
    r"\bmy\s+(life|day|week|month|year)\s+(is\s+a\s+disaster|on\s+fire)\b",
    r"\btraffic\s+is\s+a\s+(disaster|flood|nightmare)\b",
    r"\beconomy\s+(is|was)\s+(on\s+fire|flooding|a\s+disaster)\b",
    r"\bsoccer\s+(game|match)\s+(is|was)\s+a\s+disaster\b",
    r"\bparty\s+(was|is)\s+a\s+disaster\b",
    r"\bcooking\s+(caused|is|made)\s+(a\s+)?(disaster|fire|explosion)\b",
    r"\bwife['\"]?s?\s+cooking\b",
    r"\bhusbands?['\"]?s?\s+cooking\b",
    r"\bmom['\"]?s?\s+cooking\b",
]

# Personal / school / work daily complaints (non-emergencies)
COMPLAINT_PATTERNS = [
    r"\b(assignment[s]?|homework|college\s+submission|syllabus|curriculum|lecture[s]?)\b",
    r"\b(too\s+many\s+assignments|assignments\s+to\s+do)\b",
    r"\b(boss\s+yelled|office\s+work|meeting\s+delayed|salary\s+late|appraisal)\b",
    r"\b(traffic\s+jam|stuck\s+in\s+traffic|late\s+for\s+work)\b",
]

# Prank, joke, and informal chatter indicators
PRANK_PATTERNS = [
    r"\b(lol|lmao|rofl|haha|hahaha|hehe|jk|just\s+kidding)\b",
    r"\b(this\s+is\s+a\s+prank|it['\"]?s\s+a\s+prank|just\s+a\s+prank|practical\s+joke)\b",
    r"\b(trolling|fake\s+report|just\s+testing|test\s+test|testing\s+123)\b",
    r"\b(april\s+fool|april\s+fools)\b",
]

# Spam and marketing indicators
SPAM_PATTERNS = [
    r"\b(buy\s+cheap|click\s+this\s+link|free\s+gift|discount\s+code|limited\s+offer)\b",
    r"\b(subscribe\s+to|visit\s+our\s+website|earn\s+money|crypto|casino)\b",
    r"https?://\S+",
]

# Prompt injection attempts
PROMPT_INJECTION_PATTERNS = [
    r"\bignore\s+(all\s+)?previous\s+instructions\b",
    r"\bdisregard\s+(all\s+)?previous\b",
    r"\byou\s+are\s+now\s+in\s+developer\s+mode\b",
    r"\bmark\s+this\s+report\s+as\s+critical\b",
    r"\bact\s+as\s+(a\s+)?(different|new)\s+(ai|assistant|model)\b",
    r"\bpretend\s+(you\s+are|to\s+be)\b",
]

# Mundane everyday non-disaster questions and chatter
MUNDANE_PATTERNS = [
    r"\bwhat\s+time\s+does\s+(the\s+)?(train|bus|flight)\b",
    r"\bhow\s+are\s+you\b",
    r"\bwhat\s+is\s+the\s+recipe\b",
    r"\bwho\s+won\s+the\s+(match|game)\b",
    r"\bwhere\s+is\s+the\s+nearest\s+(restaurant|cinema|mall|hotel)\b",
    r"\bwhat\s+is\s+the\s+weather\s+like\b",
    r"\bhello+\s*(there|world)?\s*[!.]*$",
    r"\bgood\s+(morning|afternoon|evening|night)\s*[!.]*$",
]

# Clearly fictional / impossible scenarios
FICTIONAL_PATTERNS = [
    r"\b(alien[s]?|dragon[s]?|zombie[s]?|monster[s]?|vampire[s]?|wizard[s]?)\s+(attack|caus|destroy|burn|flood)\b",
    r"\b(50|100|500|1000)\s*-?\s*foot\s+(wave|tsunami|flood|fire|lava)\b",
    r"\bgod['\"]?s?\s+(wrath|punishment|anger)\s+caus(ed|ing)\b",
    r"\bthe\s+(whole|entire)\s+(city|world|country|planet)\s+(is\s+)?(destroyed|gone|underwater|on\s+fire)\b",
    r"\bapocalypse\b",
    r"\bend\s+of\s+the\s+world\b",
    r"\blava\s+(is\s+)?(consuming|destroying|covering)\s+the\s+(city|town|village)\b",
]

# Disaster patterns (flexible sub-word regex to support compounds and colloquial eyewitness terms)
DISASTER_PATTERNS = {
    "fire": [
        r"fire", r"wildfire", r"forestfire", r"bushfire", r"blaze", r"flame[s]?", r"burning",
        r"smoke", r"smolder", r"combustion", r"firefighter[s]?", r"explosion", r"blast",
        r"gas\s+leak", r"cylinder\s+blast", r"short\s+circuit\s+fire"
    ],
    "flood": [
        r"flood", r"flooded", r"flooding", r"flashflood", r"waterlogg?(ed|ing)?", r"submerge[ds]?",
        r"inundat(ed|ion)?", r"river\s+overflow", r"dam\s+overflow", r"dam\s+water", r"dam\s+gate",
        r"dam\s+burst", r"water\s+enter(ed|ing)?", r"water\s+inside", r"water\s+rising", r"rising\s+water",
        r"water\s+level", r"heavy\s+rain", r"torrential", r"cloudburst", r"downpour", r"continuous\s+rain",
        r"knee-deep|knee\s+deep", r"waist-deep|waist\s+deep", r"chest-deep|chest\s+deep",
        r"boat[s]?", r"canal\s+breach", r"river\s+breached", r"water\s+everywhere", r"drainage\s+overflow"
    ],
    "earthquake": [
        r"earthquake", r"quake", r"tremor[s]?", r"seismic", r"shaking", r"aftershock[s]?",
        r"building\s+collapse", r"collapsed|collapsing", r"wall\s+collapse", r"roof\s+collapse",
        r"bridge\s+collapse", r"house\s+collapse", r"under\s+rubble", r"cracks?\s+in\s+wall",
        r"cracks?\s+in\s+building", r"rubble", r"debris"
    ],
    "landslide": [
        r"landslide", r"mudslide", r"rockslide", r"rockfall", r"landslip", r"soil\s+collapse",
        r"debris\s+flow", r"mud", r"stones?\s+slid", r"small\s+stones", r"rock[s]?\s+falling",
        r"boulder[s]?", r"ghat\s+block", r"road\s+block", r"road\s+cut\s+off", r"highway\s+block"
    ],
    "storm": [
        r"cyclone", r"hurricane", r"typhoon", r"storm", r"gale", r"thunderstorm",
        r"tree[s]?\s+fall(ing|en)?", r"tree[s]?\s+fell", r"uprooted\s+tree[s]?", r"fallen\s+tree[s]?",
        r"roof[s]?\s+blown", r"tin\s+roof", r"heavy\s+downpour", r"strong\s+wind[s]?", r"high\s+wind[s]?",
        r"electric\s+pole", r"power\s+line[s]?", r"wires?\s+broken", r"lightning", r"hail(storm)?"
    ],
    "heatwave": [
        r"heatwave", r"heat\s+wave", r"extreme\s+heat", r"sunstroke", r"dehydration",
        r"scorching", r"\d+\s*degrees", r"hot\s+day"
    ],
}

EMERGENCY_WORDS = [
    r"emergency", r"rescue", r"evacuat(e|ed|ion|ing)?", r"casualt(y|ies)?", r"trapped", r"danger",
    r"disaster", r"catastrophe", r"hazard", r"injured", r"hospital", r"ambulance",
    r"people\s+running", r"running\s+everywhere", r"panic", r"screaming", r"destroyed",
    r"life\s+threat", r"stranding|stranded", r"take\s+shelter", r"send\s+help", r"urgent\s+help",
    r"help\s+needed", r"sos", r"surrounded\s+by\s+water", r"marooned", r"massive\s+destruction"
]


def _is_too_vague(text: str) -> bool:
    """
    Detect reports that mention disaster words in a purely abstract or generic way,
    with no actual incident description (no location hint, no action words, no people, etc.)
    """
    clean = text.strip().lower()
    # Too short to be a real report (less than 15 chars)
    if len(clean) < 15:
        return True

    # Reports that are ONLY abstract statements about disasters with no incident details
    pure_abstract = [
        r"^disasters?\s+(are|is|can\s+be)\s+\w+",
        r"^(floods?|fires?|earthquakes?|landslides?|storms?)\s+(are|is|can\s+be|causes?|destroy[s]?)\b",
        r"^(floods?|fires?|earthquakes?)\s+\w{0,10}\s*[.!?]*$",  # single-word disaster statements
    ]
    for pat in pure_abstract:
        if re.search(pat, clean):
            return True

    return False


def check_heuristics(text: str, has_image: bool = False) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Rule-based check on description text.
    Returns:
        (is_valid, disaster_type_or_none, reason_or_none)
    """
    if not text or not str(text).strip():
        return False, None, "Report description is empty. Please describe the emergency incident."

    clean = text.strip().lower()

    if len(clean) < 5:
        return False, None, "Report description is too brief. Please enter a valid disaster report with details."

    # Gibberish / nonsense check: e.g. "asdf asdf test test 123"
    if re.search(r"^(asdf|qwerty|test\s*123|12345)", clean) or not re.findall(r"[aeiou]", clean):
        return False, None, "Report description contains unintelligible text. Please enter a valid disaster report."

    # Check prompt injection
    for pat in PROMPT_INJECTION_PATTERNS:
        if re.search(pat, clean):
            return False, None, "System instruction attempts detected. Please enter a valid disaster report."

    # Check spam
    for pat in SPAM_PATTERNS:
        if re.search(pat, clean):
            return False, None, "Commercial or promotional content detected. Please enter a valid disaster report."

    # Check metaphors
    for pat in METAPHOR_PATTERNS:
        if re.search(pat, clean):
            return False, None, "Metaphorical or figurative expression detected. Please enter a valid disaster report describing a real incident."

    # Check pranks / jokes
    for pat in PRANK_PATTERNS:
        if re.search(pat, clean):
            return False, None, "Informal joke or prank phrasing detected. Please enter a valid disaster report."

    # Check mundane non-disaster queries
    for pat in MUNDANE_PATTERNS:
        if re.search(pat, clean):
            return False, None, "Everyday general inquiry detected. Please enter a valid disaster report."

    # Check clearly fictional scenarios
    for pat in FICTIONAL_PATTERNS:
        if re.search(pat, clean):
            return False, None, "Fictional or impossible scenario detected. Please enter a valid disaster report describing a real incident."

    # Contradiction check: e.g. "flood in the desert ... bone dry"
    if "flood" in clean and ("bone dry" in clean or "no rain for months" in clean or "desert" in clean and "no water" in clean):
        return False, None, "Contradictory environmental conditions detected. Please enter a valid disaster report."

    # Check disaster patterns
    matched_domains = []
    for domain, patterns in DISASTER_PATTERNS.items():
        if any(re.search(pat, clean) for pat in patterns):
            matched_domains.append(domain)

    has_emergency_keyword = any(re.search(pat, clean) for pat in EMERGENCY_WORDS)

    # Check non-emergency personal/school/office complaints (only reject if no disaster context)
    for pat in COMPLAINT_PATTERNS:
        if re.search(pat, clean) and not matched_domains and not has_emergency_keyword:
            return False, None, "Everyday personal/academic complaint detected. This portal is strictly for disaster reporting."

    # Check for purely abstract/generic disaster statements with no actual incident
    if _is_too_vague(clean) and not has_emergency_keyword:
        if has_image:
            return True, "other", None
        return False, None, "Report is too vague or abstract. Please describe a specific ongoing emergency incident."

    if not matched_domains and not has_emergency_keyword:
        if has_image:
            return True, "other", None
        return False, None, "No disaster or emergency context recognized. Please enter a valid disaster report describing the hazard."

    primary_type = matched_domains[0] if matched_domains else "other"
    return True, primary_type, None
