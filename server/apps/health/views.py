"""
Health views: create/update measurements and retrieve results.

All endpoints require JWT authentication (enforced by global DRF settings).
"""
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BodyMeasurement, HealthResult
from .serializers import BodyMeasurementInputSerializer, MeasurementResponseSerializer
from . import services


def _calculate_and_save(measurement: BodyMeasurement) -> HealthResult:
    """Run all calculations and persist/update the HealthResult row."""
    h = float(measurement.height_cm)
    w = float(measurement.weight_kg)
    waist = float(measurement.waist_cm) if measurement.waist_cm else None
    age = measurement.age
    sex = measurement.sex

    bmi = services.calc_bmi(w, h)

    result_data = {
        "bmi": bmi,
        "ibw_kg": services.calc_ibw(h, sex),
        "wthr": services.calc_wthr(waist, h),
        "lbm_kg": services.calc_lbm(w, h, sex),
        "bfp": services.calc_bfp(bmi, age, sex),
    }

    result, _ = HealthResult.objects.update_or_create(
        measurement=measurement,
        defaults=result_data,
    )
    return result


class MeasurementView(APIView):
    """
    GET  /api/health/measurement/  — retrieve current user's measurement + results
    PUT  /api/health/measurement/  — create or update measurement, re-calculate
    """

    def get(self, request: Request) -> Response:
        try:
            measurement = request.user.measurement
        except BodyMeasurement.DoesNotExist:
            return Response(
                {"detail": "No measurements found. Please submit your data."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MeasurementResponseSerializer(measurement)
        return Response(serializer.data)

    def put(self, request: Request) -> Response:
        # Get existing measurement or prepare a new unsaved instance
        try:
            measurement = request.user.measurement
            is_new = False
        except BodyMeasurement.DoesNotExist:
            measurement = None
            is_new = True

        input_serializer = BodyMeasurementInputSerializer(
            instance=measurement,
            data=request.data,
            partial=False,
        )
        input_serializer.is_valid(raise_exception=True)

        # Save measurement (create or update)
        if is_new:
            measurement = input_serializer.save(user=request.user)
        else:
            measurement = input_serializer.save()

        # Run calculations and persist results
        _calculate_and_save(measurement)

        # Return full response with nested result
        measurement.refresh_from_db()
        response_serializer = MeasurementResponseSerializer(measurement)
        http_status = status.HTTP_201_CREATED if is_new else status.HTTP_200_OK
        return Response(response_serializer.data, status=http_status)
