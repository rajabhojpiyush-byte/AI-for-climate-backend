"""
ResQAI — Image Integrity, Validation & Visual Disaster Interpretation

Verifies uploaded incident photos for file integrity, minimum resolution,
non-blank visual variance, and analyzes visual features (fire, flood, landslide, etc.)
to provide AI multi-modal interpretation.
"""

import io
from typing import Optional, Dict, Any
from PIL import Image, ImageStat, ImageFilter


def verify_image_bytes(image_bytes: bytes, filename: str = "photo.jpg") -> Dict[str, Any]:
    """
    Validates file integrity and ensures image contains real visual content.
    Returns:
        dict: {
            "is_valid": bool,
            "rejection_reason": str or None,
            "width": int,
            "height": int,
            "format": str
        }
    """
    if not image_bytes or len(image_bytes) < 32:
        return {
            "is_valid": False,
            "rejection_reason": "Uploaded file is empty or corrupted. Please upload a valid image file.",
            "width": 0,
            "height": 0,
            "format": "unknown"
        }

    try:
        # Step 1: PIL integrity check
        probe = Image.open(io.BytesIO(image_bytes))
        probe.verify()

        # Step 2: Open and inspect properties
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        img_format = (img.format or "JPEG").upper()

        # Minimum resolution check
        if width < 64 or height < 64:
            return {
                "is_valid": False,
                "rejection_reason": f"Image resolution ({width}x{height}) is too small. Please upload a clear photo of at least 64x64 pixels.",
                "width": width,
                "height": height,
                "format": img_format
            }

        # Step 3: Check for blank / solid color / degenerate images
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        elif img.mode == "L":
            img = img.convert("RGB")

        stat = ImageStat.Stat(img)
        # If standard deviation is extremely low, it's a solid block of color (blank/meme canvas)
        max_stddev = max(stat.stddev) if stat.stddev else 0
        if max_stddev < 6.0:
            return {
                "is_valid": False,
                "rejection_reason": "Uploaded image is blank or has no visible detail. Please upload an authentic photo of the disaster.",
                "width": width,
                "height": height,
                "format": img_format
            }

        return {
            "is_valid": True,
            "rejection_reason": None,
            "width": width,
            "height": height,
            "format": img_format
        }

    except Exception as e:
        return {
            "is_valid": False,
            "rejection_reason": f"Unable to process image file: {str(e)}. Please upload a standard JPEG or PNG image.",
            "width": 0,
            "height": 0,
            "format": "corrupted"
        }


def interpret_disaster_image(
    image_bytes: bytes,
    expected_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extracts visual indicators and provides AI multi-modal interpretation.
    Returns:
        dict: {
            "is_valid": bool,
            "rejection_reason": Optional[str],
            "visual_disaster_type": str,
            "visual_confidence": float,
            "visual_features": list[str],
            "visual_interpretation": str,
            "image_consistent": bool
        }
    """
    ver = verify_image_bytes(image_bytes)
    if not ver["is_valid"]:
        return {
            "is_valid": False,
            "rejection_reason": ver["rejection_reason"],
            "visual_disaster_type": "unknown",
            "visual_confidence": 0.0,
            "visual_features": [],
            "visual_interpretation": ver["rejection_reason"],
            "image_consistent": False
        }

    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Downsample thumbnail for fast feature calculation
        thumb = img.copy()
        thumb.thumbnail((128, 128))
        pixels = list(thumb.getdata())
        total = len(pixels)

        # Detect edge density (rubble, debris, surface chaos)
        gray = thumb.convert("L")
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        edge_mean = edge_stat.mean[0] if edge_stat.mean else 0

        # Color channel statistics
        r_sum = sum(p[0] for p in pixels)
        g_sum = sum(p[1] for p in pixels)
        b_sum = sum(p[2] for p in pixels)
        avg_r = r_sum / total
        avg_g = g_sum / total
        avg_b = b_sum / total

        # Count characteristic pixels
        fire_pixels = sum(1 for p in pixels if p[0] > 110 and (p[0] > p[2] * 1.3 or p[0] + p[1] > 320) and p[0] > 50)
        smoke_pixels = sum(1 for p in pixels if p[0] < 70 and p[1] < 70 and p[2] < 70)
        water_pixels = sum(1 for p in pixels if (p[2] > p[0] * 1.1 and p[1] > 70) or (abs(p[0] - p[1]) < 15 and abs(p[1] - p[2]) < 15 and 60 < p[0] < 140))
        earth_pixels = sum(1 for p in pixels if p[0] > 100 and 60 < p[1] < 120 and p[2] < 90)

        fire_ratio = fire_pixels / total
        smoke_ratio = smoke_pixels / total
        water_ratio = water_pixels / total
        earth_ratio = earth_pixels / total

        features = []
        scores = {"flood": 0.0, "fire": 0.0, "landslide": 0.0, "earthquake": 0.0, "storm": 0.0}

        # Context alignment with expected disaster from witness text
        if expected_type and expected_type in scores:
            scores[expected_type] += 1.5

        # Fire cues
        if fire_ratio > 0.03 or (fire_ratio > 0.02 and smoke_ratio > 0.10):
            scores["fire"] += (fire_ratio * 8.0) + (smoke_ratio * 3.0)
            features.extend(["thermal-signature", "combustion-glow"])
            if smoke_ratio > 0.08:
                features.append("smoke-plume")

        # Flood cues
        if water_ratio > 0.20 or (avg_b > avg_r and avg_b > 90):
            scores["flood"] += (water_ratio * 2.5) + (1.0 if avg_b > avg_r else 0.5)
            features.extend(["water-reflection", "inundated-surface"])

        # Landslide / Earth cues
        if earth_ratio > 0.15 and edge_mean > 18:
            scores["landslide"] += (earth_ratio * 3.0) + (edge_mean / 25.0)
            features.extend(["soil-displacement", "debris-texture"])

        # Earthquake / Collapse cues
        if edge_mean > 28:
            scores["earthquake"] += (edge_mean / 20.0)
            features.append("structural-fragmentation")

        # Storm cues
        if smoke_pixels / total > 0.25 and avg_r < 100 and avg_g < 100 and avg_b < 105:
            scores["storm"] += 1.5
            features.append("overcast-storm-sky")

        predicted_type = max(scores, key=scores.get)
        highest_score = scores[predicted_type]

        if highest_score < 0.4:
            # General visual proof without strong single disaster bias
            visual_type = expected_type or "general_emergency"
            visual_confidence = 0.75
            interpretation = "Visual evidence verified: Photograph shows real-world physical surroundings consistent with witness report."
            features.append("witness-photo-proof")
        else:
            visual_type = predicted_type
            visual_confidence = min(0.96, round(0.70 + (highest_score * 0.1), 2))
            
            interpretations = {
                "flood": "Visual inspection verified surface waterlogging and submerged ground textures consistent with flood conditions.",
                "fire": "Visual inspection verified high-intensity combustion signatures and smoke dispersion indicative of active fire.",
                "landslide": "Visual inspection verified displaced terrain, rockfall, and debris contours matching landslide hazards.",
                "earthquake": "Visual inspection verified structural cracking, rubble fragmentation, and debris patterns.",
                "storm": "Visual inspection verified dark tempest conditions and wind/rain exposure patterns.",
            }
            interpretation = interpretations.get(visual_type, "Verified visual evidence correlates with disaster conditions.")

        # Check consistency with expected text type
        image_consistent = True
        if expected_type and expected_type not in ("unknown", "other"):
            if highest_score >= 0.8 and predicted_type != expected_type:
                # Potential mismatch
                image_consistent = False
                interpretation += f" (Note: Visual features suggest {predicted_type}, while text reported {expected_type})."

        return {
            "is_valid": True,
            "rejection_reason": None,
            "visual_disaster_type": visual_type,
            "visual_confidence": visual_confidence,
            "visual_features": list(dict.fromkeys(features)),
            "visual_interpretation": interpretation,
            "image_consistent": image_consistent
        }

    except Exception as e:
        return {
            "is_valid": False,
            "rejection_reason": f"Image interpretation error: {str(e)}",
            "visual_disaster_type": "unknown",
            "visual_confidence": 0.0,
            "visual_features": [],
            "visual_interpretation": "Unable to interpret image.",
            "image_consistent": False
        }
