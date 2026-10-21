from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('writing/', include('writing.urls')),
    path('vocabulary/', include('vocabulary.urls')),
    path('reading/', include('reading.urls')), # این خط به آدرس‌ها اضافه شد
]