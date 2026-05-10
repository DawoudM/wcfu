"""Health URL routes."""
from django.urls import path
from .views import MeasurementView

urlpatterns = [
    path("measurement/", MeasurementView.as_view(), name="health-measurement"),
]
