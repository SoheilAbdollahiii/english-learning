from django.contrib import admin
from .models import Article, ArticleProgress


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "level")
    list_filter = ("level",)
    search_fields = ("title", "content")


@admin.register(ArticleProgress)
class ArticleProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "completed", "updated_at")
    list_filter = ("completed",)
    search_fields = ("user__username", "article__title")
