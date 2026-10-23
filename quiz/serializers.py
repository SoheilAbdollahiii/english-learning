from rest_framework import serializers
from .models import Question, QuizSession

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        # پاسخ صحیح را به کاربر نشان نمی‌دهیم تا تقلب نشود!
        fields = ['id', 'quiz_type', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'level', 'difficulty']

class QuizSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSession
        fields = '__all__'
        read_only_fields = ['user', 'score']