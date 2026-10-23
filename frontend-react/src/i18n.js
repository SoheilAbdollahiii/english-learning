import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "AI Tutor",
      "tab_reading": "Reading",
      "tab_vocabulary": "Vocabulary",
      "reading_title": "Reading Comprehension",
      "reading_desc": "Enhance your reading skills with AI-curated articles.",
      "vocab_title": "Vocabulary Bank",
      "vocab_desc": "Master new words systematically.",
      "login": "Login to AI Tutor",
      "logout": "Logout",
      "username": "Username",
      "password": "Password",
      "start_reading": "Start Reading",
      "practice": "Practice",
      "no_articles": "No articles found.",
      "no_words": "No words found.",
      "invalid_login": "Invalid username or password",
      "tab_dashboard": "Dashboard",
      "light_mode": "Light Mode",
      "dark_mode": "Dark Mode",
      "dark_mode": "Dark Mode" , 
      "light_mode": "Light Mode"
    }
  },
  fa: {
    translation: {
      "app_title": "معلم هوش مصنوعی",
      "tab_reading": "درک مطلب",
      "tab_vocabulary": "بانک لغات",
      "reading_title": "تقویت درک مطلب",
      "reading_desc": "مهارت خواندن خود را با مقالات تنظیم شده توسط هوش مصنوعی تقویت کنید.",
      "vocab_title": "بانک لغات",
      "vocab_desc": "لغات جدید را به صورت ساختاریافته یاد بگیرید.",
      "login": "ورود به حساب کاربری",
      "logout": "خروج",
      "username": "نام کاربری",
      "password": "رمز عبور",
      "start_reading": "شروع مطالعه",
      "practice": "تمرین کلمه",
      "no_articles": "مقاله‌ای یافت نشد.",
      "no_words": "کلمه‌ای یافت نشد.",
      "invalid_login": "نام کاربری یا رمز عبور اشتباه است",
      "tab_dashboard": "داشبورد",
      "dark_mode": "حالت تاریک", 
      "light_mode": "حالت روشن",
      "dark_mode": "حالت تاریک",
      "light_mode": "حالت روشن"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // زبان پیش‌فرض
    interpolation: { escapeValue: false }
  });

export default i18n;