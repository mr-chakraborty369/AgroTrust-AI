from django.contrib import admin
from .models import Profile, VerificationRecord, DisbursementTransaction

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'farmer_id', 'coop_name')
    list_filter = ('role',)
    search_fields = ('user__username', 'farmer_id', 'coop_name')

@admin.register(VerificationRecord)
class VerificationRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'filename', 'trust_score', 'payment_eligible', 'created_at')
    list_filter = ('payment_eligible', 'analysis_type')
    search_fields = ('user__username', 'filename', 'extracted_seller_id')

@admin.register(DisbursementTransaction)
class DisbursementTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'net_settlement', 'status', 'created_at')
    search_fields = ('transaction_id', 'reference', 'immutable_hash')
