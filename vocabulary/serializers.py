from rest_framework import serializers
from .models import UserWord, Word


class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = "__all__"


class UserWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWord
        fields = ["id", "english_word", "translation", "level", "proficiency", "next_review_at", "last_reviewed_at", "review_interval_days", "review_count", "correct_count", "incorrect_count", "created_at", "updated_at"]
        read_only_fields = ["id", "proficiency", "next_review_at", "last_reviewed_at", "review_interval_days", "review_count", "correct_count", "incorrect_count", "created_at", "updated_at"]

    def validate_english_word(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("A word is required.")
        return value
