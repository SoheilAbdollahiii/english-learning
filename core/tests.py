from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


User = get_user_model()


class CorePageRoutingTests(TestCase):
    def test_home_page_renders(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Build confidence.")

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
        self.assertEqual(writing.status_code, 200)
        self.assertContains(writing, "Make space for better English.")

    def test_writing_route_is_registered_at_expected_path(self):
        self.assertEqual(reverse("writing_submit"), "/writing/")
