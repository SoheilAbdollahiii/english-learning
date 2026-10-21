from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .services import analyze_text_with_llm

@login_required
def submit_text(request):
    context = {}
    if request.method == 'POST':
        text = request.POST.get('text', '').strip()
        context['user_text'] = text
        
        if text:
            ai_result = analyze_text_with_llm(text)
            
            # بررسی اینکه آیا خطای سیستمی (مثل قطعی اینترنت یا نبودن کلید) داریم یا نه
            if isinstance(ai_result, dict) and "system_error" in ai_result:
                context['error_message'] = ai_result["system_error"]
            else:
                context['corrections'] = ai_result
                
    return render(request, 'writing/submit.html', context)