from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    ocr_reader = None
    yolo_model = None

    def ready(self):
        import sys
        # Skip loading models during admin operations (migrate, collectstatic, check)
        is_admin_cmd = any(cmd in sys.argv for cmd in ['migrate', 'collectstatic', 'check', 'makemigrations'])
        is_runserver_master = 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true'
        
        if not is_runserver_master and not is_admin_cmd:
            print("🚀 Loading AI models into Django RAM memory...")
            
            # pyrefly: ignore [missing-import]
            import easyocr
            # pyrefly: ignore [missing-import]
            from ultralytics import YOLO
            
            # Initialize CPU-bound EasyOCR Reader
            CoreConfig.ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            print("✅ EasyOCR Reader loaded in memory")
            
            # Load baseline YOLOv8 Nano model
            django_root_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "yolov8n.pt")
            legacy_path = "/Users/aniketbera/Desktop/AgroTrust-AI/server/yolov8n.pt"
            
            if os.path.exists(django_root_path):
                CoreConfig.yolo_model = YOLO(django_root_path)
            elif os.path.exists(legacy_path):
                CoreConfig.yolo_model = YOLO(legacy_path)
            else:
                CoreConfig.yolo_model = YOLO("yolov8n.pt")
                
            print("✅ YOLOv8 model loaded in memory")
            
            # Programmatically verify and create default superuser on first run
            try:
                from django.contrib.auth.models import User
                from core.models import Profile
                
                username = "superadmin"
                email = "superadmin@agrotrust.co"
                password = "admin123"
                
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password
                    )
                    # Automatically set up SuperAdmin profile
                    profile, created = Profile.objects.get_or_create(user=user)
                    profile.role = 'superadmin'
                    profile.coop_name = 'AgroTrust Cooperative'
                    profile.save()
                    print("🟣 Default SuperAdmin verified and created successfully!")
            except Exception as e:
                # Catch gracefully if tables aren't ready yet or database locked
                print(f"⚠️ Could not verify/create default superuser: {e}")
