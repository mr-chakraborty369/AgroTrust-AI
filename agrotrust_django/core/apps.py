from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    ocr_reader = None
    yolo_model = None

    def ready(self):
        # Ensure models only load once inside Django dev server process
        if os.environ.get('RUN_MAIN') == 'true':
            print("🚀 Loading AI models into Django RAM memory...")
            
            # pyrefly: ignore [missing-import]
            import easyocr
            # pyrefly: ignore [missing-import]
            from ultralytics import YOLO
            
            # Initialize CPU-bound EasyOCR Reader
            CoreConfig.ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            print("✅ EasyOCR Reader loaded in memory")
            
            # Load baseline YOLOv8 Nano model (referencing unified Django app path first)
            django_root_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "yolov8n.pt")
            legacy_path = "/Users/aniketbera/Desktop/AgroTrust-AI/server/yolov8n.pt"
            
            if os.path.exists(django_root_path):
                CoreConfig.yolo_model = YOLO(django_root_path)
            elif os.path.exists(legacy_path):
                CoreConfig.yolo_model = YOLO(legacy_path)
            else:
                CoreConfig.yolo_model = YOLO("yolov8n.pt")
                
            print("✅ YOLOv8 model loaded in memory")
