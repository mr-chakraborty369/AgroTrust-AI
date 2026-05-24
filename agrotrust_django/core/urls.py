from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('login/', views.login_view, name='login'),
    path('login/admin/', views.admin_login_view, name='admin_login'),
    path('login/farmer/', views.farmer_login_view, name='farmer_login'),
    path('register/', views.register_view, name='register'),
    path('register/admin/', views.admin_register_view, name='admin_register'),
    path('logout/', views.logout_view, name='logout'),
    path('auth/google/', views.google_auth_view, name='google_auth'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # API endpoints
    path('api/analyze/', views.analyze_api, name='analyze_api'),
    path('api/payout/', views.payout_api, name='payout_api'),
]
