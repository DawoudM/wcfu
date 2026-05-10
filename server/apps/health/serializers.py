"""Health serializers: input validation and output formatting."""
from decimal import Decimal
from rest_framework import serializers

from .models import BodyMeasurement, HealthResult
from . import services


class BodyMeasurementInputSerializer(serializers.ModelSerializer):
    """Validates incoming measurement data from the client."""

    class Meta:
        model = BodyMeasurement
        fields = ("height_cm", "weight_kg", "waist_cm", "age", "sex")

    # ------------------------------------------------------------------
    # Field-level validation (mirrors frontend validators exactly)
    # ------------------------------------------------------------------
    def validate_height_cm(self, value: Decimal) -> Decimal:
        if not (50 <= value <= 300):
            raise serializers.ValidationError("Height must be between 50 and 300 cm.")
        return value

    def validate_weight_kg(self, value: Decimal) -> Decimal:
        if not (1 <= value <= 500):
            raise serializers.ValidationError("Weight must be between 1 and 500 kg.")
        return value

    def validate_waist_cm(self, value: Decimal | None) -> Decimal | None:
        if value is not None and not (30 <= value <= 300):
            raise serializers.ValidationError("Waist must be between 30 and 300 cm.")
        return value

    def validate_age(self, value: int) -> int:
        if not (1 <= value <= 120):
            raise serializers.ValidationError("Age must be between 1 and 120 years.")
        return value

    def validate_sex(self, value: str) -> str:
        if value not in ("M", "F"):
            raise serializers.ValidationError("Sex must be 'M' (Male) or 'F' (Female).")
        return value


class HealthResultSerializer(serializers.ModelSerializer):
    """Read-only serializer for computed health results + classifications."""

    bmi_classification = serializers.SerializerMethodField()
    wthr_classification = serializers.SerializerMethodField()
    bfp_classification = serializers.SerializerMethodField()

    class Meta:
        model = HealthResult
        fields = (
            "bmi", "bmi_classification",
            "ibw_kg",
            "wthr", "wthr_classification",
            "lbm_kg",
            "bfp", "bfp_classification",
            "calculated_at",
        )

    def get_bmi_classification(self, obj: HealthResult) -> str:
        return services.classify_bmi(obj.bmi)

    def get_wthr_classification(self, obj: HealthResult) -> str | None:
        return services.classify_wthr(obj.wthr)

    def get_bfp_classification(self, obj: HealthResult) -> str:
        sex = obj.measurement.sex
        return services.classify_bfp(obj.bfp, sex)


class MeasurementResponseSerializer(serializers.ModelSerializer):
    """Full response: input fields + computed results."""

    result = HealthResultSerializer(read_only=True)

    class Meta:
        model = BodyMeasurement
        fields = ("height_cm", "weight_kg", "waist_cm", "age", "sex", "updated_at", "result")
