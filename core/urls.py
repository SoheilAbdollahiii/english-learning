from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    # آدرس‌های آماده جنگو برای ورود و خروج
    path('accounts/', include('django.contrib.auth.urls')),
    # صفحه اصلی سایت
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('writing/', include('writing.urls')), 
]