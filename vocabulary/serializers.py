from rest_framework import serializers
from .models import UserWord, Word


class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = "__all__"


class UserWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWord
        fields = ["id", "english_word", "translation", "level", "proficiency", "created_at", "updated_at"]
        read_only_fields = ["id", "proficiency", "created_at", "updated_at"]

    def validate_english_word(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("A word is required.")
        return value
