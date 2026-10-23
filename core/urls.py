from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from core import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # API مسیرهای
    path('writing/', include('writing.urls')),
    path('vocabulary/', include('vocabulary.urls')),
    path('reading/', include('reading.urls')),
    
    # JWT احراز هویت
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('quiz/', include('quiz.urls')),
    path('learning/', include('personalization.urls')),
]