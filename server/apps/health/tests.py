"""Unit tests for health services and measurement API endpoint."""
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser
from apps.health.models import BodyMeasurement
from apps.health import services


class CalculationTests(TestCase):
    """Pure unit tests for calculation functions — no DB required."""

    def test_bmi_normal(self):
        bmi = services.calc_bmi(70, 175)
        self.assertAlmostEqual(float(bmi), 22.86, places=1)

    def test_bmi_classification(self):
        self.assertEqual(services.classify_bmi(Decimal("17")), "Underweight")
        self.assertEqual(services.classify_bmi(Decimal("22")), "Normal")
        self.assertEqual(services.classify_bmi(Decimal("27")), "Overweight")
        self.assertEqual(services.classify_bmi(Decimal("35")), "Obese")

    def test_ibw_male(self):
        ibw = services.calc_ibw(175, "M")  # 5'9" ≈ 72.6 kg
        self.assertGreater(float(ibw), 60)
        self.assertLess(float(ibw), 85)

    def test_ibw_female(self):
        ibw = services.calc_ibw(165, "F")
        self.assertGreater(float(ibw), 50)

    def test_wthr_healthy(self):
        wthr = services.calc_wthr(80, 175)
        self.assertAlmostEqual(float(wthr), 0.457, places=2)
        self.assertEqual(services.classify_wthr(wthr), "Healthy")

    def test_wthr_none_when_no_waist(self):
        self.assertIsNone(services.calc_wthr(None, 175))

    def test_lbm_male(self):
        lbm = services.calc_lbm(70, 175, "M")
        self.assertGreater(float(lbm), 40)

    def test_bfp_male(self):
        bmi = services.calc_bmi(70, 175)
        bfp = services.calc_bfp(bmi, 30, "M")
        self.assertGreater(float(bfp), 0)


class MeasurementAPITests(TestCase):
    """Integration tests for GET/PUT /api/health/measurement/."""

    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="healthuser", email="health@example.com", password="Pass1234!"
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        self.url = reverse("health-measurement")

    def test_get_returns_404_when_no_measurement(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_creates_measurement_and_results(self):
        data = {
            "height_cm": "175.00",
            "weight_kg": "70.00",
            "waist_cm": "80.00",
            "age": 30,
            "sex": "M",
        }
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("result", response.data)
        self.assertIn("bmi", response.data["result"])
        self.assertIn("ibw_kg", response.data["result"])
        self.assertIn("wthr", response.data["result"])
        self.assertIn("lbm_kg", response.data["result"])
        self.assertIn("bfp", response.data["result"])

    def test_put_updates_existing_measurement(self):
        data = {"height_cm": "175.00", "weight_kg": "70.00", "age": 30, "sex": "M"}
        self.client.put(self.url, data, format="json")
        data["weight_kg"] = "80.00"
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_height_rejected(self):
        data = {"height_cm": "10.00", "weight_kg": "70.00", "age": 30, "sex": "M"}
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("height_cm", response.data)

    def test_unauthenticated_request_rejected(self):
        self.client.credentials()  # remove token
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
