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
