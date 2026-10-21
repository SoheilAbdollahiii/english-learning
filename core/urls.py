from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from core import views # اضافه شد

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('dashboard/', views.dashboard, name='dashboard'), # اضافه شد
    path('writing/', include('writing.urls')),
]