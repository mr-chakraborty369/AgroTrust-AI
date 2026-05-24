from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import json

class Profile(models.Model):
    ROLE_CHOICES = (
        ('farmer', 'Farmer'),
        ('admin', 'Cooperative Admin'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='farmer')
    
    # Farmer specific fields
    farmer_id = models.CharField(max_length=30, blank=True, null=True, unique=True)
    passcode = models.CharField(max_length=6, blank=True, null=True) # 4-digit secure PIN
    
    # Admin specific fields
    coop_name = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class VerificationRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    filename = models.CharField(max_length=255)
    file_size_bytes = models.IntegerField()
    analysis_type = models.CharField(max_length=20, default='both')
    
    # Composite Quality Stats
    quality_score = models.FloatField(default=75.0)
    ocr_confidence = models.FloatField(default=0.0)
    trust_score = models.FloatField(default=0.0)
    payment_eligible = models.BooleanField(default=False)
    
    # OCR Parsed Metadata
    extracted_amount = models.FloatField(default=0.0)
    extracted_date = models.CharField(max_length=50, blank=True, null=True)
    extracted_seller_id = models.CharField(max_length=50, blank=True, null=True)
    extracted_invoice_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Complex arrays serialized as text JSON
    raw_ocr_lines = models.TextField(default='[]')
    detections = models.TextField(default='[]')
    
    # Base64 annotated visual grid
    annotated_image_base64 = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def get_ocr_lines(self):
        try:
            return json.loads(self.raw_ocr_lines)
        except:
            return []

    def get_detections(self):
        try:
            return json.loads(self.detections)
        except:
            return []

    def __str__(self):
        return f"Scan {self.id} - {self.filename} (Score: {self.trust_score})"


class DisbursementTransaction(models.Model):
    verification_record = models.OneToOneField(VerificationRecord, on_delete=models.CASCADE, related_name='transaction')
    transaction_id = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, default='SETTLED')
    
    # Financial metrics
    gross_amount = models.FloatField(default=0.0)
    fee_percent = models.FloatField(default=1.8)
    fee_amount = models.FloatField(default=0.0)
    net_settlement = models.FloatField(default=0.0)
    
    # System codes & audit hashing
    reference = models.CharField(max_length=50)
    immutable_hash = models.CharField(max_length=64)
    
    # Double-entry ledger fields
    debit_account = models.CharField(max_length=50)
    credit_account = models.CharField(max_length=50)
    narration = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tx {self.transaction_id} - Net: {self.net_settlement}"


# Signals to automatically create profile on default User creations
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)
