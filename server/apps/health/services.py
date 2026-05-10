"""
Pure calculation functions for health metrics.

All functions are stateless — they accept primitive numeric arguments and
return a single Python float/Decimal.  No database or request logic here.
"""
from decimal import Decimal, ROUND_HALF_UP


def _d(value: float, places: int = 2) -> Decimal:
    """Round a float to a Decimal with the given number of decimal places."""
    quantize_str = "0." + "0" * places
    return Decimal(str(value)).quantize(Decimal(quantize_str), rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# BMI — World Health Organization formula
# ---------------------------------------------------------------------------
def calc_bmi(weight_kg: float, height_cm: float) -> Decimal:
    """
    Body Mass Index.
    Formula: weight(kg) / height(m)²
    """
    height_m = height_cm / 100
    return _d(weight_kg / (height_m ** 2), 2)


def classify_bmi(bmi: Decimal) -> str:
    bmi_f = float(bmi)
    if bmi_f < 18.5:
        return "Underweight"
    if bmi_f < 25.0:
        return "Normal"
    if bmi_f < 30.0:
        return "Overweight"
    return "Obese"


# ---------------------------------------------------------------------------
# IBW — Devine formula (most widely used clinically)
# ---------------------------------------------------------------------------
def calc_ibw(height_cm: float, sex: str) -> Decimal:
    """
    Ideal Body Weight (Devine, 1974).
    Male:   50   + 2.3 × (height_inches − 60)
    Female: 45.5 + 2.3 × (height_inches − 60)
    """
    height_inches = height_cm / 2.54
    extra_inches = max(height_inches - 60, 0)  # formula is defined for ≥60 in
    base = 50.0 if sex == "M" else 45.5
    return _d(base + 2.3 * extra_inches, 2)


# ---------------------------------------------------------------------------
# Waist-to-Height Ratio
# ---------------------------------------------------------------------------
def calc_wthr(waist_cm: float | None, height_cm: float) -> Decimal | None:
    """
    WtHR = waist(cm) / height(cm).
    Returns None when waist is not provided.
    """
    if not waist_cm:
        return None
    return _d(waist_cm / height_cm, 3)


def classify_wthr(wthr: Decimal | None) -> str | None:
    if wthr is None:
        return None
    v = float(wthr)
    if v < 0.5:
        return "Healthy"
    if v < 0.6:
        return "Moderate Risk"
    return "High Risk"


# ---------------------------------------------------------------------------
# Lean Body Mass — Boer formula
# ---------------------------------------------------------------------------
def calc_lbm(weight_kg: float, height_cm: float, sex: str) -> Decimal:
    """
    Lean Body Mass (Boer, 1984).
    Male:   0.407 × W + 0.267 × H − 19.2
    Female: 0.252 × W + 0.473 × H − 48.3
    """
    if sex == "M":
        lbm = 0.407 * weight_kg + 0.267 * height_cm - 19.2
    else:
        lbm = 0.252 * weight_kg + 0.473 * height_cm - 48.3
    return _d(lbm, 2)


# ---------------------------------------------------------------------------
# Body Fat Percentage — Deurenberg formula
# ---------------------------------------------------------------------------
def calc_bfp(bmi: Decimal, age: int, sex: str) -> Decimal:
    """
    Body Fat Percentage (Deurenberg, 1991).
    BFP = 1.20 × BMI + 0.23 × age − 10.8 × sex_factor − 5.4
    sex_factor: 1 = Male, 0 = Female
    """
    sex_factor = 1 if sex == "M" else 0
    bfp = 1.20 * float(bmi) + 0.23 * age - 10.8 * sex_factor - 5.4
    # Clamp to valid physiological range (0–100%)
    bfp = max(0.0, min(bfp, 100.0))
    return _d(bfp, 1)


def classify_bfp(bfp: Decimal, sex: str) -> str:
    """Rough BFP classification (American Council on Exercise ranges)."""
    v = float(bfp)
    if sex == "M":
        if v < 6:
            return "Essential Fat"
        if v < 14:
            return "Athletic"
        if v < 18:
            return "Fitness"
        if v < 25:
            return "Average"
        return "Obese"
    else:
        if v < 14:
            return "Essential Fat"
        if v < 21:
            return "Athletic"
        if v < 25:
            return "Fitness"
        if v < 32:
            return "Average"
        return "Obese"
