from django.db import models


class Annotation(models.Model):
    image_name = models.CharField(max_length=100, unique=True)
    shape = models.CharField(max_length=50, blank=True)
    shape_confidence = models.FloatField(default=0.0)
    shape_source = models.CharField(max_length=50, blank=True)
    pattern = models.CharField(max_length=50, blank=True)
    pattern_confidence = models.FloatField(default=0.0)
    pattern_source = models.CharField(max_length=50, blank=True)
    colors = models.JSONField(default=list)
    size = models.CharField(max_length=20, blank=True)
    num_nails_detected = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.image_name
