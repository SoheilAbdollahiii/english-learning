from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


User = get_user_model()


class CorePageRoutingTests(TestCase):
    def test_home_page_renders(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Build confidence.")
        self.assertContains(response, "Start learning")
        self.assertContains(response, "Save useful words")

    def test_login_page_renders_accessible_form(self):
        response = self.client.get(reverse("login"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'autocomplete="username"')
        self.assertContains(response, 'autocomplete="current-password"')

    def test_dashboard_redirects_anonymous_users_to_login(self):
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_authenticated_dashboard_and_writing_route_render(self):
        user = User.objects.create_user(username="learner", password="Strong-test-pass-123")
        self.client.force_login(user)

        dashboard = self.client.get(reverse("dashboard"))
        writing = self.client.get(reverse("writing_submit"))

        self.assertEqual(dashboard.status_code, 200)
        self.assertContains(dashboard, "Writing studio")
        self.assertContains(dashboard, "Open vocabulary")
        self.assertContains(dashboard, "Open reading")
        self.assertContains(dashboard, "Open learning app")
        self.assertEqual(writing.status_code, 200)
        self.assertContains(writing, "Make space for better English.")

    def test_writing_route_is_registered_at_expected_path(self):
        self.assertEqual(reverse("writing_submit"), "/writing/")


class LearnerRegistrationTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.api = APIClient()

    def test_registration_creates_user_and_returns_jwt_tokens(self):
        response = self.api.post(
            reverse("register_learner"),
            {
                "username": "new-learner",
                "email": "learner@example.com",
                "password": "Better-password-Unique-984!x",
                "password_confirm": "Better-password-Unique-984!x",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        user = User.objects.get(username="new-learner")
        self.assertTrue(user.check_password("Better-password-Unique-984!x"))

    def test_password_login_issues_tokens_through_rate_limited_endpoint(self):
        User.objects.create_user(username="existing-learner", password="Strong-test-pass-123")
        response = self.api.post(
            reverse("token_obtain_pair"),
            {"username": "existing-learner", "password": "Strong-test-pass-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_registration_rejects_mismatched_passwords(self):
        response = self.api.post(
            reverse("register_learner"),
            {
                "username": "new-learner",
                "password": "Better-password-Unique-984!x",
                "password_confirm": "a-different-password",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="new-learner").exists())

    def test_registration_rejects_duplicate_username_case_insensitively(self):
        User.objects.create_user(username="ExistingLearner", password="Strong-test-pass-123")
        response = self.api.post(
            reverse("register_learner"),
            {
                "username": "existinglearner",
                "password": "Better-password-Unique-984!x",
                "password_confirm": "Better-password-Unique-984!x",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class AccountDeletionTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.api = APIClient()
        self.user = User.objects.create_user(username="delete-me", password="Strong-test-pass-123")
        self.api.force_authenticate(user=self.user)

    def test_account_deletion_requires_exact_confirmation_and_current_password(self):
        response = self.api.delete(
            reverse("delete_account"),
            {"confirmation": "DELETE", "password": "incorrect-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

        missing_confirmation = self.api.delete(
            reverse("delete_account"),
            {"confirmation": "delete", "password": "Strong-test-pass-123"},
            format="json",
        )
        self.assertEqual(missing_confirmation.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_staff_accounts_cannot_be_deleted_through_learner_api(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        response = self.api.delete(
            reverse("delete_account"),
            {"confirmation": "DELETE", "password": "Strong-test-pass-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_account_deletion_removes_owned_words_but_not_other_users(self):
        from vocabulary.models import UserWord

        UserWord.objects.create(user=self.user, english_word="private-word")
        other = User.objects.create_user(username="keep-me", password="Strong-test-pass-123")
        other_word = UserWord.objects.create(user=other, english_word="other-private-word")
        user_id = self.user.pk

        response = self.api.delete(
            reverse("delete_account"),
            {"confirmation": "DELETE", "password": "Strong-test-pass-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=user_id).exists())
        self.assertFalse(UserWord.objects.filter(user_id=user_id).exists())
        self.assertTrue(User.objects.filter(pk=other.pk).exists())
        self.assertTrue(UserWord.objects.filter(pk=other_word.pk).exists())
