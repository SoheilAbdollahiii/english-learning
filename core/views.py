from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from vocabulary.models import Word
from reading.models import Article

@login_required
def dashboard(request):
    # گرفتن تعداد لغات و مقالات از دیتابیس برای نمایش در داشبورد
    word_count = Word.objects.count()
    article_count = Article.objects.count()
    
    context = {
        'word_count': word_count,
        'article_count': article_count,
    }
    return render(request, 'dashboard.html', context)