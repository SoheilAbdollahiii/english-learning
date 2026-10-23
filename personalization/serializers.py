from rest_framework import serializers
from .models import LearningPreference


class LearningPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningPreference
        fields = ["preferred_level", "daily_word_goal", "learning_goal", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate_daily_word_goal(self, value):
        if not 1 <= value <= 100:
            raise serializers.ValidationError("Daily word goal must be between 1 and 100.")
        return value
