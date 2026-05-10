"""Custom user model — extends AbstractUser to allow future profile extensions."""
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Standard user; email is required and unique."""

    email = models.EmailField(unique=True)

    # Use email as the display identifier in admin
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.username
