"""Health domain models: BodyMeasurement and HealthResult."""
from django.conf import settings
from django.db import models


class BodyMeasurement(models.Model):
    """Stores the user's most-recent body measurements (one row per user)."""

    SEX_CHOICES = [("M", "Male"), ("F", "Female")]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="measurement",
    )
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Height in centimetres (50–300).",
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Weight in kilograms (1–500).",
    )
    waist_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Waist circumference in centimetres (30–300). Optional — required for WtHR.",
    )
    age = models.PositiveSmallIntegerField(help_text="Age in years (1–120).")
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "body measurement"

    def __str__(self) -> str:
        return f"{self.user.username} — {self.height_cm} cm / {self.weight_kg} kg"


class HealthResult(models.Model):
    """Calculated health metrics derived from a BodyMeasurement."""

    measurement = models.OneToOneField(
        BodyMeasurement,
        on_delete=models.CASCADE,
        related_name="result",
    )
    bmi = models.DecimalField(max_digits=5, decimal_places=2)
    ibw_kg = models.DecimalField(max_digits=5, decimal_places=2)
    wthr = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    lbm_kg = models.DecimalField(max_digits=5, decimal_places=2)
    bfp = models.DecimalField(max_digits=4, decimal_places=1)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "health result"

    def __str__(self) -> str:
        return f"Results for {self.measurement.user.username}"
