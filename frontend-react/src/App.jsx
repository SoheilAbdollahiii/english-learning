import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

import { apiFetch, apiUrl } from './api'
import MistakeNotebook from './MistakeNotebook'

const THEMATIC_VOCABULARY_SETS = [
  {
    id: 'daily', icon: '💬', title: { en: 'Everyday conversations', fa: 'مکالمات روزمره و اصطلاحات طبیعی' },
    description: { en: 'Sound natural in small talk and daily interactions.', fa: 'برای گفت‌وگوهای کوتاه و تعامل‌های روزانه طبیعی‌تر صحبت کن.' },
    words: [
      ['actually', 'در واقع', 'B1'],
      ['by the way', 'راستی', 'A1'],
      ['sounds good', 'خوبه، موافقم', 'A1'],
      ['no worries', 'اشکالی نداره', 'A1'],
      ['hang out', 'وقت گذراندن با دوستان', 'B1'],
      ['figure out', 'فهمیدن، راه‌حل پیدا کردن', 'B1'],
      ['catch up', 'از حال هم باخبر شدن', 'B1'],
      ['make sense', 'منطقی بودن', 'B1'],
      ['I guess', 'فکر می‌کنم، احتمالاً', 'A1'],
      ['to be honest', 'راستش را بخواهی', 'B1'],
      ['that depends', 'بستگی دارد', 'B1'],
      ['fair enough', 'قبول، منطقی است', 'B1'],
      ['never mind', 'بی‌خیال، مهم نیست', 'A1'],
      ['give me a second', 'یک لحظه به من وقت بده', 'A1'],
      ['I\'m on my way', 'در راه هستم', 'A1'],
      ['what do you mean?', 'منظورت چیست؟', 'A1'],
      ['keep in touch', 'در تماس ماندن', 'B1'],
      ['long story short', 'خلاصه بگویم', 'C1'],
      ['as far as I know', 'تا جایی که می‌دانم', 'B1'],
      ['it\'s up to you', 'تصمیم با توست', 'B1']
    ],
  },
  {
    id: 'travel', icon: '✈️', title: { en: 'Travel, airport & hotel', fa: 'سفر، فرودگاه و هتل' },
    description: { en: 'Handle check-in, directions, bookings and travel problems.', fa: 'از پذیرش و مسیر پرسیدن تا رزرو و مشکلات سفر را مدیریت کن.' },
    words: [
      ['boarding pass', 'کارت پرواز', 'A1'],
      ['departure', 'حرکت، زمان پرواز', 'A1'],
      ['arrival', 'ورود', 'A1'],
      ['luggage', 'بار و چمدان', 'A1'],
      ['reservation', 'رزرو', 'A1'],
      ['check in', 'پذیرش شدن', 'A1'],
      ['delayed', 'با تأخیر', 'B1'],
      ['aisle seat', 'صندلی کنار راهرو', 'B1'],
      ['connecting flight', 'پرواز اتصالی', 'B1'],
      ['baggage claim', 'محل تحویل بار', 'B1'],
      ['carry-on bag', 'کیف دستی داخل کابین', 'B1'],
      ['customs declaration', 'اظهارنامهٔ گمرکی', 'C1'],
      ['round-trip ticket', 'بلیط رفت‌وبرگشت', 'B1'],
      ['one-way ticket', 'بلیط یک‌طرفه', 'A1'],
      ['vacancy', 'اتاق خالی، ظرفیت موجود', 'B1'],
      ['late checkout', 'تحویل دیرتر اتاق', 'B1'],
      ['fully booked', 'کاملاً رزروشده', 'B1'],
      ['local currency', 'ارز محلی', 'B1'],
      ['travel insurance', 'بیمهٔ مسافرتی', 'B1'],
      ['miss a connection', 'از دست دادن پرواز اتصالی', 'C1']
    ],
  },
  {
    id: 'work', icon: '💼', title: { en: 'Work, meetings & interviews', fa: 'کار، جلسات و مصاحبه' },
    description: { en: 'Use clear, professional English with colleagues and recruiters.', fa: 'در محیط کار، جلسه‌ها و مصاحبه‌ها حرفه‌ای و روشن صحبت کن.' },
    words: [
      ['deadline', 'مهلت نهایی', 'B1'],
      ['colleague', 'همکار', 'B1'],
      ['agenda', 'دستور جلسه', 'B1'],
      ['feedback', 'بازخورد', 'B1'],
      ['follow up', 'پیگیری کردن', 'B1'],
      ['come up with', 'ارائه دادن، به ذهن رسیدن', 'B1'],
      ['negotiate', 'مذاکره کردن', 'C1'],
      ['strengths', 'نقاط قوت', 'B1'],
      ['job opening', 'فرصت شغلی', 'B1'],
      ['workload', 'حجم کار', 'B1'],
      ['meet a deadline', 'به مهلت پایبند بودن', 'B1'],
      ['career progression', 'پیشرفت شغلی', 'C1'],
      ['salary expectations', 'انتظارات حقوقی', 'B1'],
      ['transferable skills', 'مهارت‌های قابل انتقال', 'C1'],
      ['performance review', 'ارزیابی عملکرد', 'B1'],
      ['take the initiative', 'پیش‌قدم شدن', 'C1'],
      ['delegate a task', 'واگذاری یک وظیفه', 'C1'],
      ['work remotely', 'دورکاری کردن', 'B1'],
      ['notice period', 'مدت اعلام قبلی ترک کار', 'C1'],
      ['professional development', 'توسعهٔ حرفه‌ای', 'C1']
    ],
  },
  {
    id: 'academic', icon: '🎓', title: { en: 'University & language exams', fa: 'دانشگاه و آزمون‌های زبان' },
    description: { en: 'Build vocabulary for lectures, essays, research and exams.', fa: 'واژگان کاربردی برای کلاس، مقاله، پژوهش و آزمون‌ها یاد بگیر.' },
    words: [
      ['assignment', 'تکلیف', 'B1'],
      ['lecture', 'سخنرانی، کلاس دانشگاه', 'B1'],
      ['research', 'پژوهش', 'B1'],
      ['evidence', 'مدرک، شواهد', 'B1'],
      ['analyse', 'تحلیل کردن', 'B1'],
      ['significant', 'قابل‌توجه، مهم', 'C1'],
      ['hypothesis', 'فرضیه', 'C1'],
      ['evaluate', 'ارزیابی کردن', 'C1'],
      ['thesis statement', 'جملهٔ محوری مقاله', 'C1'],
      ['literature review', 'مرور منابع پژوهشی', 'C1'],
      ['methodology', 'روش‌شناسی', 'C1'],
      ['citation', 'ارجاع علمی', 'B1'],
      ['plagiarism', 'سرقت علمی', 'C1'],
      ['peer review', 'داوری همتا', 'C1'],
      ['draw a conclusion', 'نتیجه‌گیری کردن', 'B1'],
      ['academic transcript', 'ریز نمرات دانشگاهی', 'B1'],
      ['multiple-choice question', 'سؤال چندگزینه‌ای', 'B1'],
      ['time management', 'مدیریت زمان', 'B1'],
      ['coherent argument', 'استدلال منسجم', 'C1'],
      ['supporting detail', 'جزئیات پشتیبان', 'B1']
    ],
  },
  {
    id: 'phrasal', icon: '🧩', title: { en: 'Phrasal verbs & collocations', fa: 'افعال عبارتی و ترکیب‌های رایج' },
    description: { en: 'Learn useful word combinations instead of isolated words.', fa: 'به‌جای حفظ واژه‌های جدا، ترکیب‌های طبیعی و پرکاربرد یاد بگیر.' },
    words: [
      ['give up', 'تسلیم شدن، دست کشیدن', 'A1'],
      ['look after', 'مراقبت کردن از', 'A1'],
      ['put off', 'به تعویق انداختن', 'B1'],
      ['run out of', 'تمام کردن، تمام شدنِ', 'B1'],
      ['take responsibility', 'مسئولیت پذیرفتن', 'B1'],
      ['pay attention', 'توجه کردن', 'A1'],
      ['reach a decision', 'به تصمیم رسیدن', 'C1'],
      ['highly unlikely', 'بسیار بعید', 'C1'],
      ['carry out', 'انجام دادن، اجرا کردن', 'B1'],
      ['bring up', 'مطرح کردن، بزرگ کردن', 'B1'],
      ['turn down', 'رد کردن', 'B1'],
      ['look into', 'بررسی کردن', 'B1'],
      ['set up', 'راه‌اندازی کردن', 'B1'],
      ['break down', 'از کار افتادن، تجزیه کردن', 'B1'],
      ['come across', 'اتفاقی برخورد کردن', 'B1'],
      ['take into account', 'در نظر گرفتن', 'C1'],
      ['pose a threat', 'تهدیدی ایجاد کردن', 'C1'],
      ['meet expectations', 'انتظارات را برآورده کردن', 'B1'],
      ['strongly recommend', 'قویاً توصیه کردن', 'B1'],
      ['widely available', 'به‌طور گسترده در دسترس', 'C1']
    ],
  },
  {
    id: 'food', icon: '🍽️', title: { en: 'Food, cooking & restaurants', fa: 'غذا، آشپزی و رستوران' },
    description: { en: 'Order food, describe flavors and discuss meals confidently.', fa: 'با اعتمادبه‌نفس غذا سفارش بده و دربارهٔ طعم و روش پخت صحبت کن.' },
    words: [
      ['ingredients', 'مواد اولیه', 'A1'],
      ['recipe', 'دستور پخت', 'A1'],
      ['appetizer', 'پیش‌غذا', 'B1'],
      ['main course', 'غذای اصلی', 'A1'],
      ['side dish', 'مخلفات غذا', 'B1'],
      ['well-done', 'کاملاً پخته', 'B1'],
      ['medium-rare', 'نیم‌پز رو به خام', 'C1'],
      ['dietary restriction', 'محدودیت غذایی', 'C1'],
      ['food allergy', 'حساسیت غذایی', 'B1'],
      ['takeaway', 'غذای بیرون‌بر', 'A1'],
      ['bill, please', 'صورتحساب لطفاً', 'A1'],
      ['season with salt', 'با نمک مزه‌دار کردن', 'B1'],
      ['chop finely', 'ریز خرد کردن', 'B1'],
      ['bring to a boil', 'به جوش آوردن', 'B1'],
      ['rich in flavor', 'پرطعم', 'C1'],
      ['freshly squeezed', 'تازه آب‌گرفته', 'B1'],
      ['reservation for two', 'رزرو برای دو نفر', 'A1'],
      ['service charge', 'هزینهٔ خدمات', 'C1'],
      ['locally sourced', 'تهیه‌شده از منابع محلی', 'C1'],
      ['nutritional value', 'ارزش غذایی', 'B1']
    ],
  },
  {
    id: 'health', icon: '🩺', title: { en: 'Health, symptoms & healthcare', fa: 'سلامت، علائم و خدمات درمانی' },
    description: { en: 'Describe symptoms and understand common healthcare conversations.', fa: 'علائم را توضیح بده و مکالمات معمول درمانی را بهتر درک کن.' },
    words: [
      ['appointment', 'وقت ملاقات', 'A1'],
      ['symptom', 'نشانهٔ بیماری', 'B1'],
      ['prescription', 'نسخهٔ پزشک', 'B1'],
      ['pharmacy', 'داروخانه', 'A1'],
      ['sore throat', 'گلودرد', 'A1'],
      ['dizzy', 'سرگیجه‌دار', 'B1'],
      ['side effect', 'عارضهٔ جانبی', 'B1'],
      ['medical history', 'سابقهٔ پزشکی', 'C1'],
      ['blood pressure', 'فشار خون', 'B1'],
      ['allergic reaction', 'واکنش آلرژیک', 'C1'],
      ['take a deep breath', 'نفس عمیق کشیدن', 'A1'],
      ['chronic condition', 'بیماری مزمن', 'C1'],
      ['follow medical advice', 'توصیهٔ پزشکی را دنبال کردن', 'B1'],
      ['emergency room', 'اورژانس بیمارستان', 'A1'],
      ['recover from an illness', 'از بیماری بهبود یافتن', 'B1'],
      ['physical examination', 'معاینهٔ جسمی', 'C1'],
      ['pain relief', 'تسکین درد', 'B1'],
      ['balanced diet', 'رژیم غذایی متعادل', 'B1'],
      ['mental well-being', 'سلامت روان', 'C1'],
      ['seek medical attention', 'مراجعهٔ پزشکی کردن', 'C1']
    ],
  },
  {
    id: 'shopping', icon: '🛍️', title: { en: 'Shopping, clothes & returns', fa: 'خرید، پوشاک و مرجوعی' },
    description: { en: 'Compare products, ask about sizes and handle returns or refunds.', fa: 'محصولات را مقایسه کن، سایز بپرس و مرجوعی یا بازپرداخت را پیگیری کن.' },
    words: [
      ['fitting room', 'اتاق پرو', 'A1'],
      ['receipt', 'رسید خرید', 'A1'],
      ['refund', 'بازپرداخت', 'B1'],
      ['exchange', 'تعویض کالا', 'B1'],
      ['discount', 'تخفیف', 'A1'],
      ['out of stock', 'ناموجود', 'B1'],
      ['in stock', 'موجود', 'B1'],
      ['true to size', 'مطابق سایزبندی استاندارد', 'C1'],
      ['loose fit', 'قوارهٔ آزاد', 'B1'],
      ['tight-fitting', 'چسبان', 'B1'],
      ['durable', 'بادوام', 'B1'],
      ['warranty', 'ضمانت‌نامه', 'B1'],
      ['price tag', 'برچسب قیمت', 'A1'],
      ['impulse purchase', 'خرید ناگهانی و بدون برنامه', 'C1'],
      ['value for money', 'ارزش متناسب با قیمت', 'C1'],
      ['online checkout', 'مرحلهٔ نهایی خرید آنلاین', 'B1'],
      ['delivery fee', 'هزینهٔ ارسال', 'A1'],
      ['return policy', 'قوانین مرجوعی', 'B1'],
      ['compare prices', 'مقایسهٔ قیمت‌ها', 'A1'],
      ['defective item', 'کالای معیوب', 'C1']
    ],
  },
  {
    id: 'home', icon: '🏠', title: { en: 'Home, chores & accommodation', fa: 'خانه، کارهای روزمره و محل سکونت' },
    description: { en: 'Talk about housing, repairs, household tasks and renting.', fa: 'دربارهٔ خانه، تعمیرات، کارهای منزل و اجاره صحبت کن.' },
    words: [
      ['rent', 'اجاره', 'A1'],
      ['landlord', 'صاحب‌خانه', 'B1'],
      ['tenant', 'مستأجر', 'B1'],
      ['utility bill', 'قبض خدماتی', 'B1'],
      ['household chores', 'کارهای خانه', 'B1'],
      ['do the laundry', 'لباس شستن', 'A1'],
      ['vacuum cleaner', 'جاروبرقی', 'A1'],
      ['furnished apartment', 'آپارتمان مبله', 'B1'],
      ['security deposit', 'ودیعهٔ ضمانت', 'C1'],
      ['lease agreement', 'قرارداد اجاره', 'C1'],
      ['maintenance request', 'درخواست تعمیر و نگهداری', 'C1'],
      ['spacious living room', 'اتاق نشیمن جادار', 'B1'],
      ['commute to work', 'رفت‌وآمد به محل کار', 'B1'],
      ['neighborhood', 'محله', 'A1'],
      ['move in', 'اسباب‌کشی به داخل خانه', 'B1'],
      ['move out', 'تخلیه کردن خانه', 'B1'],
      ['energy-efficient', 'کم‌مصرف از نظر انرژی', 'C1'],
      ['water pressure', 'فشار آب', 'B1'],
      ['sort out the mess', 'مرتب کردن به‌هم‌ریختگی', 'B1'],
      ['property viewing', 'بازدید از ملک', 'C1']
    ],
  },
  {
    id: 'relationships', icon: '🤝', title: { en: 'Relationships & social life', fa: 'روابط، دوستی و زندگی اجتماعی' },
    description: { en: 'Build connections, make plans and navigate social situations.', fa: 'ارتباط بساز، قرار بگذار و موقعیت‌های اجتماعی را مدیریت کن.' },
    words: [
      ['get along with', 'با کسی کنار آمدن', 'B1'],
      ['make friends', 'دوست پیدا کردن', 'A1'],
      ['mutual friend', 'دوست مشترک', 'B1'],
      ['keep a promise', 'به قول عمل کردن', 'B1'],
      ['make up', 'آشتی کردن', 'B1'],
      ['fall out with', 'با کسی به اختلاف خوردن', 'C1'],
      ['get to know', 'بیشتر شناختن', 'A1'],
      ['have something in common', 'وجه اشتراک داشتن', 'B1'],
      ['lend a hand', 'کمک کردن', 'B1'],
      ['rely on', 'تکیه کردن به', 'B1'],
      ['set boundaries', 'حد و مرز تعیین کردن', 'C1'],
      ['misunderstanding', 'سوءتفاهم', 'B1'],
      ['make an apology', 'عذرخواهی کردن', 'B1'],
      ['show appreciation', 'قدردانی نشان دادن', 'C1'],
      ['social gathering', 'دورهمی اجتماعی', 'B1'],
      ['break the ice', 'یخ جمع را شکستن', 'C1'],
      ['stay in touch', 'در ارتباط ماندن', 'B1'],
      ['drift apart', 'به‌تدریج از هم دور شدن', 'C1'],
      ['offer support', 'حمایت کردن', 'B1'],
      ['resolve a conflict', 'حل‌وفصل اختلاف', 'C1']
    ],
  },
  {
    id: 'emotions', icon: '💭', title: { en: 'Emotions, personality & opinions', fa: 'احساسات، شخصیت و بیان نظر' },
    description: { en: 'Express feelings, personality traits and nuanced opinions.', fa: 'احساسات، ویژگی‌های شخصیتی و نظرهای دقیق‌تر را بیان کن.' },
    words: [
      ['relieved', 'آسوده‌خاطر', 'B1'],
      ['overwhelmed', 'درمانده، تحت فشار', 'B1'],
      ['frustrated', 'کلافه، ناکام', 'B1'],
      ['confident', 'بااعتمادبه‌نفس', 'A1'],
      ['embarrassed', 'خجالت‌زده', 'B1'],
      ['curious', 'کنجکاو', 'A1'],
      ['disappointed', 'ناامید', 'B1'],
      ['proud of', 'مفتخر به', 'A1'],
      ['take something personally', 'چیزی را به خود گرفتن', 'C1'],
      ['keep an open mind', 'ذهنی باز داشتن', 'C1'],
      ['strongly opposed to', 'به‌شدت مخالفِ', 'C1'],
      ['from my perspective', 'از دیدگاه من', 'C1'],
      ['I see your point', 'منظورت را درک می‌کنم', 'B1'],
      ['have mixed feelings', 'احساسات متناقض داشتن', 'C1'],
      ['come to terms with', 'با چیزی کنار آمدن', 'C1'],
      ['self-aware', 'خودآگاه', 'C1'],
      ['easy-going', 'خونسرد و راحت‌گیر', 'B1'],
      ['stubborn', 'لجباز', 'B1'],
      ['empathetic', 'همدل', 'C1'],
      ['constructive criticism', 'انتقاد سازنده', 'C1']
    ],
  },
  {
    id: 'technology', icon: '💻', title: { en: 'Technology & digital life', fa: 'فناوری و زندگی دیجیتال' },
    description: { en: 'Discuss devices, apps, privacy and everyday technical issues.', fa: 'دربارهٔ دستگاه‌ها، برنامه‌ها، حریم خصوصی و مشکلات فنی صحبت کن.' },
    words: [
      ['update software', 'نرم‌افزار را به‌روزرسانی کردن', 'A1'],
      ['wireless connection', 'اتصال بی‌سیم', 'B1'],
      ['battery life', 'عمر باتری', 'B1'],
      ['user-friendly', 'کاربرپسند', 'B1'],
      ['log in', 'وارد حساب شدن', 'A1'],
      ['sign up', 'ثبت‌نام کردن', 'A1'],
      ['back up files', 'از فایل‌ها نسخهٔ پشتیبان گرفتن', 'B1'],
      ['data breach', 'نقض امنیت داده', 'C1'],
      ['privacy settings', 'تنظیمات حریم خصوصی', 'B1'],
      ['two-factor authentication', 'احراز هویت دومرحله‌ای', 'C1'],
      ['cloud storage', 'ذخیره‌سازی ابری', 'B1'],
      ['operating system', 'سیستم‌عامل', 'B1'],
      ['troubleshoot an issue', 'عیب‌یابی مشکل', 'C1'],
      ['compatibility', 'سازگاری', 'C1'],
      ['screen resolution', 'وضوح صفحه‌نمایش', 'B1'],
      ['subscription plan', 'طرح اشتراک', 'B1'],
      ['automated process', 'فرایند خودکار', 'C1'],
      ['digital footprint', 'ردپای دیجیتال', 'C1'],
      ['enable notifications', 'اعلان‌ها را فعال کردن', 'B1'],
      ['restore factory settings', 'بازگرداندن تنظیمات کارخانه', 'C1']
    ],
  },
  {
    id: 'business', icon: '📈', title: { en: 'Business, strategy & entrepreneurship', fa: 'کسب‌وکار، راهبرد و کارآفرینی' },
    description: { en: 'Discuss markets, business plans, growth and commercial decisions.', fa: 'دربارهٔ بازار، طرح کسب‌وکار، رشد و تصمیم‌های تجاری صحبت کن.' },
    words: [
      ['business model', 'مدل کسب‌وکار', 'B1'],
      ['target audience', 'مخاطب هدف', 'B1'],
      ['market research', 'تحقیقات بازار', 'B1'],
      ['value proposition', 'ارزش پیشنهادی', 'C1'],
      ['revenue stream', 'منبع درآمد', 'C1'],
      ['profit margin', 'حاشیهٔ سود', 'C1'],
      ['cash flow', 'جریان نقدی', 'C1'],
      ['competitive advantage', 'مزیت رقابتی', 'C1'],
      ['launch a product', 'عرضهٔ محصول', 'B1'],
      ['scale up', 'گسترش دادن', 'C1'],
      ['break-even point', 'نقطهٔ سربه‌سر', 'C1'],
      ['stakeholder', 'ذی‌نفع', 'C1'],
      ['strategic planning', 'برنامه‌ریزی راهبردی', 'C1'],
      ['market share', 'سهم بازار', 'C1'],
      ['customer acquisition', 'جذب مشتری', 'C1'],
      ['business proposal', 'پیشنهاد تجاری', 'B1'],
      ['operational costs', 'هزینه‌های عملیاتی', 'C1'],
      ['risk assessment', 'ارزیابی ریسک', 'C1'],
      ['return on investment', 'بازده سرمایه‌گذاری', 'C1'],
      ['proof of concept', 'اثبات امکان‌پذیری ایده', 'C1']
    ],
  },
  {
    id: 'finance', icon: '💳', title: { en: 'Money, banking & personal finance', fa: 'پول، بانک و امور مالی شخصی' },
    description: { en: 'Handle banking, budgeting, payments and financial conversations.', fa: 'امور بانکی، بودجه‌بندی، پرداخت و گفت‌وگوهای مالی را مدیریت کن.' },
    words: [
      ['bank account', 'حساب بانکی', 'A1'],
      ['withdraw cash', 'پول نقد برداشت کردن', 'A1'],
      ['make a deposit', 'واریز کردن', 'B1'],
      ['exchange rate', 'نرخ تبدیل ارز', 'B1'],
      ['monthly budget', 'بودجهٔ ماهانه', 'B1'],
      ['living expenses', 'هزینه‌های زندگی', 'B1'],
      ['interest rate', 'نرخ بهره', 'B1'],
      ['credit score', 'امتیاز اعتباری', 'C1'],
      ['direct debit', 'برداشت مستقیم از حساب', 'C1'],
      ['overdraft', 'اضافه‌برداشت', 'C1'],
      ['transaction fee', 'کارمزد تراکنش', 'B1'],
      ['payment deadline', 'مهلت پرداخت', 'B1'],
      ['outstanding balance', 'ماندهٔ بدهی پرداخت‌نشده', 'C1'],
      ['fixed interest rate', 'نرخ بهرهٔ ثابت', 'C1'],
      ['financial statement', 'صورت مالی', 'C1'],
      ['save up for', 'پس‌انداز کردن برای', 'B1'],
      ['pay in installments', 'قسطی پرداخت کردن', 'B1'],
      ['unexpected expense', 'هزینهٔ پیش‌بینی‌نشده', 'B1'],
      ['build an emergency fund', 'صندوق اضطراری ایجاد کردن', 'C1'],
      ['financial literacy', 'سواد مالی', 'C1']
    ],
  },
  {
    id: 'customer', icon: '🎧', title: { en: 'Customer service & complaints', fa: 'خدمات مشتری و رسیدگی به شکایت' },
    description: { en: 'Resolve problems politely and communicate with support teams.', fa: 'مشکلات را مؤدبانه حل کن و با تیم‌های پشتیبانی ارتباط بگیر.' },
    words: [
      ['How can I help you?', 'چطور می‌توانم کمک کنم؟', 'A1'],
      ['I understand your concern', 'نگرانی شما را درک می‌کنم', 'B1'],
      ['place an order', 'ثبت سفارش کردن', 'A1'],
      ['tracking number', 'شمارهٔ رهگیری', 'B1'],
      ['technical support', 'پشتیبانی فنی', 'B1'],
      ['escalate an issue', 'ارجاع مشکل به سطح بالاتر', 'C1'],
      ['resolve a complaint', 'رسیدگی به شکایت', 'C1'],
      ['replacement item', 'کالای جایگزین', 'B1'],
      ['processing time', 'مدت زمان پردازش', 'B1'],
      ['service outage', 'اختلال در سرویس', 'C1'],
      ['terms and conditions', 'شرایط و ضوابط', 'B1'],
      ['customer satisfaction', 'رضایت مشتری', 'B1'],
      ['apologize for the inconvenience', 'عذرخواهی بابت زحمت ایجادشده', 'C1'],
      ['follow-up email', 'ایمیل پیگیری', 'B1'],
      ['provide documentation', 'ارائهٔ مستندات', 'C1'],
      ['eligible for a refund', 'واجد شرایط بازپرداخت', 'C1'],
      ['response time', 'زمان پاسخ‌گویی', 'B1'],
      ['service representative', 'کارشناس خدمات مشتری', 'B1'],
      ['root cause', 'علت ریشه‌ای', 'C1'],
      ['prevent recurrence', 'جلوگیری از تکرار', 'C1']
    ],
  },
  {
    id: 'meetings', icon: '🗣️', title: { en: 'Meetings, presentations & negotiation', fa: 'جلسات، ارائه و مذاکره' },
    description: { en: 'Contribute to meetings, present ideas and negotiate effectively.', fa: 'در جلسه مشارکت کن، ایده ارائه بده و مؤثر مذاکره کن.' },
    words: [
      ['Could you clarify that?', 'ممکن است آن را روشن‌تر توضیح دهید؟', 'B1'],
      ['let\'s get started', 'بیایید شروع کنیم', 'A1'],
      ['on the same page', 'هم‌نظر و هم‌اطلاع بودن', 'B1'],
      ['key takeaway', 'نکتهٔ اصلی و قابل‌استفاده', 'C1'],
      ['action item', 'اقدام مشخص پس از جلسه', 'B1'],
      ['circle back', 'بعداً به موضوع برگشتن', 'C1'],
      ['raise a concern', 'نگرانی‌ای را مطرح کردن', 'B1'],
      ['table a proposal', 'پیشنهاد را برای بررسی بعدی گذاشتن', 'C1'],
      ['reach a consensus', 'به توافق جمعی رسیدن', 'C1'],
      ['opening remarks', 'سخنان آغازین', 'C1'],
      ['visual aid', 'ابزار بصری کمکی', 'B1'],
      ['address the audience', 'با مخاطبان صحبت کردن', 'B1'],
      ['take questions', 'به سؤال‌ها پاسخ دادن', 'A1'],
      ['summarize the findings', 'یافته‌ها را خلاصه کردن', 'C1'],
      ['negotiate terms', 'دربارهٔ شرایط مذاکره کردن', 'C1'],
      ['mutually beneficial', 'سودمند برای هر دو طرف', 'C1'],
      ['concession', 'امتیاز در مذاکره', 'C1'],
      ['meeting minutes', 'صورت‌جلسه', 'C1'],
      ['time is running short', 'وقت دارد تمام می‌شود', 'B1'],
      ['I would like to build on that', 'می‌خواهم نکتهٔ شما را ادامه دهم', 'C1']
    ],
  },
  {
    id: 'projects', icon: '🗂️', title: { en: 'Project management & teamwork', fa: 'مدیریت پروژه و کار تیمی' },
    description: { en: 'Plan tasks, manage risks and coordinate teams.', fa: 'وظایف را برنامه‌ریزی کن، ریسک‌ها را مدیریت کن و تیم را هماهنگ نگه دار.' },
    words: [
      ['project scope', 'دامنهٔ پروژه', 'C1'],
      ['milestone', 'نقطهٔ عطف پروژه', 'B1'],
      ['deliverable', 'خروجی قابل‌تحویل', 'C1'],
      ['resource allocation', 'تخصیص منابع', 'C1'],
      ['risk mitigation', 'کاهش ریسک', 'C1'],
      ['dependency', 'وابستگی', 'B1'],
      ['project timeline', 'زمان‌بندی پروژه', 'B1'],
      ['status update', 'گزارش وضعیت', 'B1'],
      ['assign ownership', 'تعیین مسئولیت', 'C1'],
      ['blocker', 'مانع پیشرفت', 'B1'],
      ['contingency plan', 'برنامهٔ جایگزین اضطراری', 'C1'],
      ['scope creep', 'گسترش کنترل‌نشدهٔ دامنهٔ پروژه', 'C1'],
      ['cross-functional team', 'تیم میان‌وظیفه‌ای', 'C1'],
      ['capacity planning', 'برنامه‌ریزی ظرفیت', 'C1'],
      ['track progress', 'پیگیری پیشرفت', 'B1'],
      ['prioritize tasks', 'اولویت‌بندی وظایف', 'B1'],
      ['handover notes', 'یادداشت‌های تحویل کار', 'B1'],
      ['lessons learned', 'درس‌های آموخته‌شده', 'C1'],
      ['resource constraint', 'محدودیت منابع', 'C1'],
      ['continuous improvement', 'بهبود مستمر', 'C1']
    ],
  },
  {
    id: 'science', icon: '🔬', title: { en: 'Science, research & environment', fa: 'علوم، پژوهش و محیط‌زیست' },
    description: { en: 'Understand scientific findings and discuss environmental issues.', fa: 'یافته‌های علمی را درک کن و دربارهٔ مسائل زیست‌محیطی گفت‌وگو کن.' },
    words: [
      ['climate change', 'تغییرات اقلیمی', 'B1'],
      ['renewable energy', 'انرژی تجدیدپذیر', 'B1'],
      ['carbon emissions', 'انتشار کربن', 'C1'],
      ['biodiversity', 'تنوع زیستی', 'C1'],
      ['data collection', 'جمع‌آوری داده', 'B1'],
      ['experimental design', 'طراحی آزمایش', 'C1'],
      ['control group', 'گروه کنترل', 'C1'],
      ['research findings', 'یافته‌های پژوهش', 'B1'],
      ['peer-reviewed study', 'مطالعهٔ داوری‌شده', 'C1'],
      ['sample size', 'حجم نمونه', 'C1'],
      ['correlation', 'همبستگی', 'C1'],
      ['causal relationship', 'رابطهٔ علّی', 'C1'],
      ['statistically significant', 'از نظر آماری معنادار', 'C1'],
      ['fossil fuels', 'سوخت‌های فسیلی', 'B1'],
      ['conservation efforts', 'تلاش‌های حفاظت', 'C1'],
      ['natural habitat', 'زیستگاه طبیعی', 'B1'],
      ['waste management', 'مدیریت پسماند', 'C1'],
      ['water scarcity', 'کمبود آب', 'C1'],
      ['sustainable development', 'توسعهٔ پایدار', 'C1'],
      ['draw on evidence', 'بر شواهد تکیه کردن', 'C1']
    ],
  },
  {
    id: 'law', icon: '⚖️', title: { en: 'Law, government & public services', fa: 'حقوق، دولت و خدمات عمومی' },
    description: { en: 'Navigate common legal, civic and administrative language.', fa: 'واژگان رایج حقوقی، شهروندی و اداری را بهتر درک کن.' },
    words: [
      ['application form', 'فرم درخواست', 'A1'],
      ['proof of address', 'مدرک اثبات نشانی', 'B1'],
      ['identity document', 'مدرک هویتی', 'B1'],
      ['public service', 'خدمات عمومی', 'B1'],
      ['legal advice', 'مشاورهٔ حقوقی', 'B1'],
      ['terms of service', 'شرایط استفاده از خدمات', 'B1'],
      ['contractual obligation', 'تعهد قراردادی', 'C1'],
      ['comply with regulations', 'رعایت مقررات کردن', 'C1'],
      ['valid identification', 'مدرک شناسایی معتبر', 'B1'],
      ['submit an appeal', 'ثبت درخواست تجدیدنظر', 'C1'],
      ['official record', 'سابقهٔ رسمی', 'B1'],
      ['power of attorney', 'وکالت‌نامه', 'C1'],
      ['data protection law', 'قانون حفاظت از داده', 'C1'],
      ['consumer rights', 'حقوق مصرف‌کننده', 'B1'],
      ['legal proceedings', 'روند رسیدگی قضایی', 'C1'],
      ['due process', 'روند قانونی منصفانه', 'C1'],
      ['government agency', 'نهاد دولتی', 'B1'],
      ['issue a permit', 'مجوز صادر کردن', 'C1'],
      ['proof of eligibility', 'مدرک احراز شرایط', 'C1'],
      ['confidential information', 'اطلاعات محرمانه', 'B1']
    ],
  },
  {
    id: 'media', icon: '📰', title: { en: 'Media, communication & news', fa: 'رسانه، ارتباطات و اخبار' },
    description: { en: 'Discuss news, online content, credibility and public communication.', fa: 'دربارهٔ خبر، محتوای آنلاین، اعتبار و ارتباطات عمومی صحبت کن.' },
    words: [
      ['breaking news', 'خبر فوری', 'B1'],
      ['news outlet', 'رسانهٔ خبری', 'B1'],
      ['headline', 'تیتر خبر', 'A1'],
      ['press release', 'بیانیهٔ مطبوعاتی', 'C1'],
      ['source credibility', 'اعتبار منبع', 'C1'],
      ['fact-check', 'راستی‌آزمایی کردن', 'B1'],
      ['misleading information', 'اطلاعات گمراه‌کننده', 'C1'],
      ['public opinion', 'افکار عمومی', 'B1'],
      ['media coverage', 'پوشش رسانه‌ای', 'C1'],
      ['on record', 'با اجازهٔ انتشار رسمی', 'C1'],
      ['anonymous source', 'منبع ناشناس', 'C1'],
      ['editorial policy', 'سیاست تحریریه', 'C1'],
      ['viral content', 'محتوای فراگیر و پربازدید', 'B1'],
      ['audience engagement', 'تعامل مخاطب', 'C1'],
      ['broadcast live', 'پخش زنده کردن', 'B1'],
      ['misinformation', 'اطلاعات نادرست', 'C1'],
      ['press conference', 'کنفرانس خبری', 'B1'],
      ['public statement', 'بیانیهٔ عمومی', 'B1'],
      ['raise awareness', 'افزایش آگاهی', 'B1'],
      ['media literacy', 'سواد رسانه‌ای', 'C1']
    ],
  },
  {
    id: 'culture', icon: '🎭', title: { en: 'Culture, entertainment & arts', fa: 'فرهنگ، سرگرمی و هنر' },
    description: { en: 'Review films, books, performances and cultural experiences.', fa: 'دربارهٔ فیلم، کتاب، اجرا و تجربه‌های فرهنگی نظر بده.' },
    words: [
      ['plot', 'خط داستانی', 'B1'],
      ['main character', 'شخصیت اصلی', 'A1'],
      ['soundtrack', 'موسیقی متن', 'B1'],
      ['based on a true story', 'بر اساس داستان واقعی', 'B1'],
      ['thought-provoking', 'برانگیزانندهٔ تفکر', 'C1'],
      ['visually stunning', 'از نظر بصری خیره‌کننده', 'C1'],
      ['standing ovation', 'تشویق ایستاده', 'C1'],
      ['box-office hit', 'اثر پرفروش', 'B1'],
      ['critical acclaim', 'تحسین منتقدان', 'C1'],
      ['live performance', 'اجرای زنده', 'B1'],
      ['work of fiction', 'اثر داستانی', 'C1'],
      ['cultural heritage', 'میراث فرهنگی', 'C1'],
      ['art exhibition', 'نمایشگاه هنری', 'B1'],
      ['subtle humor', 'طنز ظریف', 'C1'],
      ['character development', 'پرداخت شخصیت', 'C1'],
      ['adaptation', 'اقتباس', 'C1'],
      ['audience reaction', 'واکنش مخاطبان', 'B1'],
      ['immersive experience', 'تجربهٔ فراگیر', 'C1'],
      ['highly entertaining', 'بسیار سرگرم‌کننده', 'B1'],
      ['leave a lasting impression', 'تأثیر ماندگار گذاشتن', 'C1']
    ],
  },
  {
    id: 'sports', icon: '🏃', title: { en: 'Sports, fitness & wellbeing', fa: 'ورزش، تناسب اندام و تندرستی' },
    description: { en: 'Talk about training, performance, routines and healthy habits.', fa: 'دربارهٔ تمرین، عملکرد، برنامهٔ ورزشی و عادت‌های سالم صحبت کن.' },
    words: [
      ['warm up', 'بدن را گرم کردن', 'A1'],
      ['cool down', 'بدن را سرد کردن', 'B1'],
      ['work out', 'تمرین ورزشی کردن', 'A1'],
      ['keep fit', 'تناسب اندام را حفظ کردن', 'A1'],
      ['personal best', 'بهترین رکورد شخصی', 'B1'],
      ['muscle strain', 'کشیدگی عضله', 'C1'],
      ['stamina', 'استقامت', 'B1'],
      ['strength training', 'تمرین قدرتی', 'B1'],
      ['cardiovascular health', 'سلامت قلب و عروق', 'C1'],
      ['set a goal', 'هدف تعیین کردن', 'A1'],
      ['stick to a routine', 'به برنامه پایبند ماندن', 'B1'],
      ['recovery period', 'دورهٔ ریکاوری', 'B1'],
      ['range of motion', 'دامنهٔ حرکتی', 'C1'],
      ['competitive edge', 'برتری رقابتی', 'C1'],
      ['team spirit', 'روحیهٔ تیمی', 'B1'],
      ['sportsmanship', 'روحیهٔ جوانمردی ورزشی', 'C1'],
      ['push your limits', 'از محدودیت‌های خود فراتر رفتن', 'B1'],
      ['build endurance', 'استقامت را افزایش دادن', 'B1'],
      ['hydration', 'آب‌رسانی به بدن', 'C1'],
      ['injury prevention', 'پیشگیری از آسیب', 'C1']
    ],
  },
  {
    id: 'emergency', icon: '🚨', title: { en: 'Emergencies, safety & directions', fa: 'موقعیت اضطراری، ایمنی و مسیرها' },
    description: { en: 'Ask for help, give directions and understand urgent instructions.', fa: 'کمک بخواه، مسیر را توضیح بده و دستورهای فوری را درک کن.' },
    words: [
      ['Call an ambulance', 'با آمبولانس تماس بگیر', 'A1'],
      ['fire extinguisher', 'کپسول آتش‌نشانی', 'B1'],
      ['emergency exit', 'خروج اضطراری', 'A1'],
      ['first aid', 'کمک‌های اولیه', 'B1'],
      ['lost and found', 'اشیای گمشده', 'A1'],
      ['keep your distance', 'فاصله‌ات را حفظ کن', 'A1'],
      ['evacuation route', 'مسیر تخلیه', 'C1'],
      ['road closure', 'بسته بودن جاده', 'B1'],
      ['detour', 'مسیر جایگزین', 'B1'],
      ['slippery surface', 'سطح لغزنده', 'B1'],
      ['report an incident', 'گزارش حادثه دادن', 'C1'],
      ['safety precaution', 'اقدام احتیاطی ایمنی', 'C1'],
      ['hazardous material', 'مادهٔ خطرناک', 'C1'],
      ['shelter in place', 'در محل امن بمانید', 'C1'],
      ['emergency contact', 'شمارهٔ تماس اضطراری', 'B1'],
      ['power outage', 'قطع برق', 'B1'],
      ['seek shelter', 'پناه گرفتن', 'B1'],
      ['follow instructions', 'دستورها را دنبال کردن', 'A1'],
      ['nearest intersection', 'نزدیک‌ترین تقاطع', 'B1'],
      ['life-threatening', 'تهدیدکنندهٔ جان', 'C1']
    ],
  },
  {
    id: 'immigration', icon: '🛂', title: { en: 'Moving abroad & settling in', fa: 'مهاجرت و زندگی در کشور جدید' },
    description: { en: 'Manage paperwork, housing, daily services and settling into a new country.', fa: 'مدارک، مسکن، خدمات روزمره و جا افتادن در کشور جدید را مدیریت کن.' },
    words: [
      ['residence permit', 'اجازهٔ اقامت', 'B1'],
      ['work permit', 'مجوز کار', 'B1'],
      ['visa application', 'درخواست ویزا', 'A1'],
      ['supporting documents', 'مدارک پشتیبان', 'B1'],
      ['proof of funds', 'مدرک تمکن مالی', 'C1'],
      ['application status', 'وضعیت درخواست', 'B1'],
      ['renew a permit', 'تمدید مجوز', 'B1'],
      ['appointment confirmation', 'تأیید وقت ملاقات', 'B1'],
      ['certified translation', 'ترجمهٔ رسمی', 'C1'],
      ['settle in', 'جا افتادن در محیط جدید', 'B1'],
      ['cultural adjustment', 'سازگاری فرهنگی', 'C1'],
      ['language barrier', 'مانع زبانی', 'B1'],
      ['public transport pass', 'کارت حمل‌ونقل عمومی', 'A1'],
      ['register with a doctor', 'ثبت‌نام نزد پزشک', 'B1'],
      ['open a local account', 'افتتاح حساب محلی', 'B1'],
      ['proof of employment', 'مدرک اشتغال', 'C1'],
      ['permanent residency', 'اقامت دائم', 'C1'],
      ['temporary accommodation', 'محل اقامت موقت', 'B1'],
      ['official correspondence', 'مکاتبات رسمی', 'C1'],
      ['integration support', 'حمایت برای ادغام اجتماعی', 'C1']
    ],
  },
  {
    id: 'ielts', icon: '📝', title: { en: 'IELTS, TOEFL & academic writing', fa: 'آیلتس، تافل و نگارش آکادمیک' },
    description: { en: 'Practice high-utility academic language for exam tasks and essays.', fa: 'عبارت‌های آکادمیک کاربردی برای سؤال‌ها و مقاله‌های آزمون تمرین کن.' },
    words: [
      ['to begin with', 'برای شروع', 'B1'],
      ['in contrast', 'در مقابل', 'B1'],
      ['as a result', 'در نتیجه', 'A1'],
      ['for instance', 'برای مثال', 'B1'],
      ['it is widely believed', 'به‌طور گسترده باور بر این است', 'C1'],
      ['the evidence suggests', 'شواهد نشان می‌دهد', 'C1'],
      ['a growing number of', 'تعداد رو به افزایشی از', 'B1'],
      ['plays a crucial role', 'نقش حیاتی ایفا می‌کند', 'C1'],
      ['from an economic perspective', 'از دیدگاه اقتصادی', 'C1'],
      ['this essay will examine', 'این مقاله بررسی خواهد کرد', 'C1'],
      ['to a certain extent', 'تا حدی', 'C1'],
      ['there is a tendency to', 'گرایشی وجود دارد به اینکه', 'C1'],
      ['a key contributing factor', 'عامل مؤثر اصلی', 'C1'],
      ['the issue remains controversial', 'این موضوع همچنان بحث‌برانگیز است', 'C1'],
      ['draw a distinction between', 'بین دو چیز تمایز قائل شدن', 'C1'],
      ['support this argument', 'از این استدلال حمایت کردن', 'B1'],
      ['counterargument', 'استدلال مخالف', 'C1'],
      ['overall trend', 'روند کلی', 'B1'],
      ['account for a proportion', 'بخشی را تشکیل دادن', 'C1'],
      ['reach a balanced conclusion', 'به نتیجه‌گیری متعادل رسیدن', 'C1']
    ],
  },
  {
    id: 'software', icon: '🧑‍💻', title: { en: 'Software development & data', fa: 'توسعهٔ نرم‌افزار و داده' },
    description: { en: 'Communicate about code, releases, APIs and data analysis.', fa: 'دربارهٔ کدنویسی، انتشار نسخه، API و تحلیل داده ارتباط مؤثر برقرار کن.' },
    words: [
      ['source code', 'کد منبع', 'B1'],
      ['version control', 'کنترل نسخه', 'C1'],
      ['pull request', 'درخواست ادغام تغییرات کد', 'C1'],
      ['code review', 'بازبینی کد', 'B1'],
      ['bug report', 'گزارش خطا', 'B1'],
      ['reproduce an issue', 'بازآفرینی یک خطا', 'C1'],
      ['backward compatibility', 'سازگاری با نسخه‌های قبلی', 'C1'],
      ['release candidate', 'نسخهٔ نامزد انتشار', 'C1'],
      ['deployment pipeline', 'خط لولهٔ استقرار', 'C1'],
      ['application programming interface', 'رابط برنامه‌نویسی کاربردی', 'C1'],
      ['database schema', 'ساختار پایگاه داده', 'C1'],
      ['query performance', 'کارایی پرس‌وجو', 'C1'],
      ['data visualization', 'بصری‌سازی داده', 'B1'],
      ['machine learning model', 'مدل یادگیری ماشین', 'C1'],
      ['edge case', 'حالت مرزی و کم‌رخداد', 'C1'],
      ['unit test', 'آزمون واحد', 'B1'],
      ['integration test', 'آزمون یکپارچه‌سازی', 'C1'],
      ['technical debt', 'بدهی فنی', 'C1'],
      ['system outage', 'اختلال در سامانه', 'B1'],
      ['root cause analysis', 'تحلیل علت ریشه‌ای', 'C1']
    ],
  },
  {
    id: 'marketing', icon: '📣', title: { en: 'Marketing, sales & branding', fa: 'بازاریابی، فروش و برندینگ' },
    description: { en: 'Discuss positioning, campaigns, customer needs and sales performance.', fa: 'دربارهٔ جایگاه‌یابی، کمپین، نیاز مشتری و عملکرد فروش صحبت کن.' },
    words: [
      ['brand awareness', 'آگاهی از برند', 'B1'],
      ['conversion rate', 'نرخ تبدیل', 'C1'],
      ['sales funnel', 'قیف فروش', 'C1'],
      ['lead generation', 'تولید سرنخ فروش', 'C1'],
      ['customer retention', 'حفظ مشتری', 'C1'],
      ['brand identity', 'هویت برند', 'B1'],
      ['value for customers', 'ارزش برای مشتریان', 'B1'],
      ['target market', 'بازار هدف', 'B1'],
      ['launch a campaign', 'راه‌اندازی کمپین', 'B1'],
      ['market positioning', 'جایگاه‌یابی در بازار', 'C1'],
      ['organic traffic', 'ترافیک ارگانیک', 'C1'],
      ['click-through rate', 'نرخ کلیک', 'C1'],
      ['customer journey', 'مسیر تجربهٔ مشتری', 'C1'],
      ['unique selling point', 'مزیت فروش منحصربه‌فرد', 'C1'],
      ['brand loyalty', 'وفاداری به برند', 'B1'],
      ['sales forecast', 'پیش‌بینی فروش', 'C1'],
      ['product differentiation', 'تمایز محصول', 'C1'],
      ['returning customer', 'مشتری بازگشتی', 'B1'],
      ['promotional offer', 'پیشنهاد تبلیغاتی', 'B1'],
      ['market segmentation', 'بخش‌بندی بازار', 'C1']
    ],
  },
  {
    id: 'logistics', icon: '📦', title: { en: 'Logistics, supply chain & operations', fa: 'لجستیک، زنجیرهٔ تأمین و عملیات' },
    description: { en: 'Coordinate shipments, inventory, suppliers and operational workflows.', fa: 'ارسال، موجودی، تأمین‌کنندگان و جریان کار عملیاتی را هماهنگ کن.' },
    words: [
      ['purchase order', 'سفارش خرید', 'C1'],
      ['delivery schedule', 'برنامهٔ تحویل', 'B1'],
      ['stock levels', 'سطح موجودی', 'B1'],
      ['supply chain', 'زنجیرهٔ تأمین', 'C1'],
      ['lead time', 'زمان تأمین یا تحویل', 'C1'],
      ['warehouse capacity', 'ظرفیت انبار', 'C1'],
      ['shipping label', 'برچسب ارسال', 'A1'],
      ['customs clearance', 'ترخیص گمرکی', 'C1'],
      ['freight forwarder', 'کارگزار حمل بار', 'C1'],
      ['inventory management', 'مدیریت موجودی', 'C1'],
      ['quality control', 'کنترل کیفیت', 'B1'],
      ['order fulfillment', 'پردازش و تکمیل سفارش', 'C1'],
      ['supplier agreement', 'توافق با تأمین‌کننده', 'C1'],
      ['delayed shipment', 'محمولهٔ با تأخیر', 'B1'],
      ['track a consignment', 'رهگیری محموله', 'C1'],
      ['minimum order quantity', 'حداقل مقدار سفارش', 'C1'],
      ['storage facility', 'تأسیسات انبارداری', 'C1'],
      ['operational efficiency', 'کارایی عملیاتی', 'C1'],
      ['shortage of supplies', 'کمبود اقلام موردنیاز', 'B1'],
      ['return merchandise authorization', 'مجوز مرجوعی کالا', 'C1']
    ],
  },
  {
    id: 'education', icon: '📚', title: { en: 'Teaching, learning & classroom English', fa: 'تدریس، یادگیری و زبان کلاس' },
    description: { en: 'Give instructions, discuss learning strategies and support students.', fa: 'دستورالعمل بده، دربارهٔ روش یادگیری صحبت کن و از زبان‌آموزان حمایت کن.' },
    words: [
      ['learning objective', 'هدف یادگیری', 'B1'],
      ['lesson plan', 'طرح درس', 'B1'],
      ['class participation', 'مشارکت در کلاس', 'B1'],
      ['group assignment', 'تکلیف گروهی', 'A1'],
      ['give feedback', 'بازخورد دادن', 'A1'],
      ['learning outcome', 'دستاورد یادگیری', 'C1'],
      ['assessment criteria', 'معیارهای ارزیابی', 'C1'],
      ['formative assessment', 'ارزشیابی تکوینی', 'C1'],
      ['summative assessment', 'ارزشیابی پایانی', 'C1'],
      ['learning difficulty', 'دشواری یادگیری', 'B1'],
      ['critical thinking', 'تفکر انتقادی', 'C1'],
      ['independent study', 'مطالعهٔ مستقل', 'B1'],
      ['take notes', 'یادداشت‌برداری کردن', 'A1'],
      ['revise for an exam', 'برای امتحان مرور کردن', 'B1'],
      ['submit an assignment', 'تحویل تکلیف دادن', 'A1'],
      ['meet the criteria', 'معیارها را برآورده کردن', 'B1'],
      ['scaffold learning', 'یادگیری را مرحله‌به‌مرحله پشتیبانی کردن', 'C1'],
      ['learner autonomy', 'خودمختاری زبان‌آموز', 'C1'],
      ['classroom management', 'مدیریت کلاس', 'C1'],
      ['knowledge retention', 'ماندگاری دانش', 'C1']
    ],
  },
  {
    id: 'hospitality', icon: '🛎️', title: { en: 'Hospitality, events & tourism', fa: 'مهمان‌داری، رویداد و گردشگری' },
    description: { en: 'Welcome guests, manage bookings and describe local attractions.', fa: 'از مهمان استقبال کن، رزروها را مدیریت کن و جاذبه‌های محلی را معرفی کن.' },
    words: [
      ['front desk', 'پذیرش', 'A1'],
      ['guest amenities', 'امکانات مهمان', 'B1'],
      ['room service', 'خدمات اتاق', 'A1'],
      ['check-out time', 'زمان تخلیهٔ اتاق', 'A1'],
      ['guided tour', 'تور همراه راهنما', 'A1'],
      ['tourist attraction', 'جاذبهٔ گردشگری', 'A1'],
      ['peak season', 'فصل اوج سفر', 'B1'],
      ['off the beaten track', 'دور از مسیرهای معمول گردشگری', 'C1'],
      ['cancellation fee', 'هزینهٔ لغو رزرو', 'B1'],
      ['group booking', 'رزرو گروهی', 'B1'],
      ['event venue', 'محل برگزاری رویداد', 'B1'],
      ['catering service', 'خدمات پذیرایی', 'B1'],
      ['dietary requirements', 'نیازهای غذایی', 'C1'],
      ['itinerary', 'برنامهٔ سفر', 'B1'],
      ['local landmark', 'مکان شاخص محلی', 'B1'],
      ['sightseeing', 'بازدید از جاذبه‌ها', 'A1'],
      ['complimentary breakfast', 'صبحانهٔ رایگان', 'B1'],
      ['occupancy rate', 'نرخ اشغال', 'C1'],
      ['guest satisfaction', 'رضایت مهمان', 'B1'],
      ['cultural excursion', 'گشت‌وگذار فرهنگی', 'C1']
    ],
  }
]

export default function App() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    return ['dashboard', 'reading', 'vocabulary', 'writing', 'conversation', 'quiz'].includes(requestedTab) ? requestedTab : 'dashboard'
  })
  const [words, setWords] = useState([])
  const [articles, setArticles] = useState([])
  const [interactiveStories, setInteractiveStories] = useState([])
  const [activeStoryId, setActiveStoryId] = useState(null)
  const [activeStoryNodeId, setActiveStoryNodeId] = useState(null)
  const [storyVisitedNodes, setStoryVisitedNodes] = useState([])
  const [storySelectedOption, setStorySelectedOption] = useState('')
  const [storyAnswerFeedback, setStoryAnswerFeedback] = useState(null)
  const [storyAnswerBusy, setStoryAnswerBusy] = useState(false)
  const [storyError, setStoryError] = useState('')
  const [readingLookup, setReadingLookup] = useState(null)
  const [readingLookupBusy, setReadingLookupBusy] = useState(false)
  const [readingLookupSavingTerm, setReadingLookupSavingTerm] = useState('')
  const [readingLookupError, setReadingLookupError] = useState('')
  const [readingLookupSaved, setReadingLookupSaved] = useState(false)
  const readingLookupRequestRef = useRef(0)
  const [writings, setWritings] = useState([])
  const [personalWords, setPersonalWords] = useState([])
  const [dueReviewCount, setDueReviewCount] = useState(0)
  const [activeReviewWord, setActiveReviewWord] = useState(null)
  const [reviewAnswerVisible, setReviewAnswerVisible] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [readingProgress, setReadingProgress] = useState([])
  const [quizHistory, setQuizHistory] = useState([])
  const [quizStats, setQuizStats] = useState({ current_streak: 0, quiz_sessions_total: 0, daily_activity: [] })
  const [gamification, setGamification] = useState({ total_xp: 0, current_streak: 0, longest_streak: 0, badges: [] })
  const [dailyChallengeInfo, setDailyChallengeInfo] = useState({ completed: false, question_count: 10, duration_seconds: 300, xp_awarded: 0 })
  const [dailyChallengeLoading, setDailyChallengeLoading] = useState(false)
  const [dailyChallengeMode, setDailyChallengeMode] = useState(false)
  const [preferences, setPreferences] = useState({ preferred_level: 'B1', daily_word_goal: 10, learning_goal: 'general' })
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [readingQuery, setReadingQuery] = useState('')
  const [readingLevel, setReadingLevel] = useState('all')
  const [vocabQuery, setVocabQuery] = useState('')
  const [vocabLevel, setVocabLevel] = useState('all')
  const [selectedVocabularySet, setSelectedVocabularySet] = useState('all')
  const [selectedVocabularyWord, setSelectedVocabularyWord] = useState(null)
  const [vocabularyDictionary, setVocabularyDictionary] = useState(null)
  const [vocabularyDictionaryLoading, setVocabularyDictionaryLoading] = useState(false)
  const [vocabularyDictionaryError, setVocabularyDictionaryError] = useState('')
  const [vocabularyExampleTranslations, setVocabularyExampleTranslations] = useState({})
  const [vocabularyRelatedWords, setVocabularyRelatedWords] = useState({ synonyms: [], antonyms: [], collocations: [] })
  const [loading, setLoading] = useState(() => !!localStorage.getItem('access_token'))
  
  const [writingText, setWritingText] = useState('')
  const [submittingWriting, setSubmittingWriting] = useState(false)
  const [writingNotice, setWritingNotice] = useState(null)

  // کوئیز
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [quizStartedAt, setQuizStartedAt] = useState(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizType, setQuizType] = useState('vocabulary')
  const [quizLevel, setQuizLevel] = useState('B1')
  const [quizQuestionCount, setQuizQuestionCount] = useState(5)
  const [quizCustomQuestionCount, setQuizCustomQuestionCount] = useState(10)
  const [quizDifficulty, setQuizDifficulty] = useState('all')
  const [quizShuffle, setQuizShuffle] = useState(true)
  const [quizAnswerMode, setQuizAnswerMode] = useState('end')
  const [quizTimerMode, setQuizTimerMode] = useState('none')
  const [quizTotalDuration, setQuizTotalDuration] = useState(300)
  const [quizPerQuestionDuration, setQuizPerQuestionDuration] = useState(30)
  const [quizQuestionTimeLeft, setQuizQuestionTimeLeft] = useState(30)
  const [quizImmediateFeedback, setQuizImmediateFeedback] = useState({})
  const [quizTimeLeft, setQuizTimeLeft] = useState(300)
  const [quizTimeExpired, setQuizTimeExpired] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizNotice, setQuizNotice] = useState('')
  const [quizAdaptiveMode, setQuizAdaptiveMode] = useState(false)
  const [quizTargetCount, setQuizTargetCount] = useState(5)
  const [quizAdaptiveProgress, setQuizAdaptiveProgress] = useState(null)
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('english-learning-theme') === 'dark')
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const streak = gamification.current_streak || 0
  const chartData = useMemo(() => {
    const daysFa = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const currentDays = i18n.language === 'fa' ? daysFa : daysEn
    const activityByDate = new Map((quizStats.daily_activity || []).map((item) => [item.date, item.count]))
    const data = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      data.push({ name: currentDays[day.getDay()], activity: activityByDate.get(dayKey) || 0 })
    }
    return data
  }, [i18n.language, quizStats.daily_activity])

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'fa' ? 'fa' : 'en'
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr'
    localStorage.setItem('english-learning-language', i18n.language)
  }, [i18n.language])

  useEffect(() => {
    localStorage.setItem('english-learning-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (quizAdaptiveMode || quizTimerMode === 'none' || !quizQuestions.length || quizSubmitted || quizTimeExpired) return undefined
    const timer = window.setTimeout(() => {
      if (quizTimerMode === 'total') {
        if (quizTimeLeft <= 1) {
          setQuizTimeLeft(0)
          setQuizTimeExpired(true)
        } else {
          setQuizTimeLeft((left) => left - 1)
        }
      } else if (quizQuestionTimeLeft <= 1) {
        if (currentQuestionIndex >= quizQuestions.length - 1) {
          setQuizQuestionTimeLeft(0)
          setQuizTimeExpired(true)
        } else {
          setCurrentQuestionIndex((index) => Math.min(quizQuestions.length - 1, index + 1))
          setQuizQuestionTimeLeft(quizPerQuestionDuration)
        }
      } else {
        setQuizQuestionTimeLeft((left) => left - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [quizAdaptiveMode, quizTimerMode, quizQuestions.length, quizSubmitted, quizTimeExpired, quizTimeLeft, quizQuestionTimeLeft, currentQuestionIndex, quizPerQuestionDuration])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(apiUrl('/api/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        setLoading(true)
        setIsLoggedIn(true)
      } else {
        alert(t('invalid_login'))
      }
    } catch (err) {
      console.error('Login failed', err)
      alert(t('login_failed'))
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      alert(t('password_mismatch'))
      return
    }
    try {
      const res = await fetch(apiUrl('/api/register/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password_confirm: passwordConfirm })
      })
      const data = await res.json()
      if (!res.ok) {
        const details = Object.values(data || {}).flat().filter((value) => typeof value === 'string')
        alert(details[0] || t('registration_failed'))
        return
      }
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setLoading(true)
      setIsLoggedIn(true)
    } catch (err) {
      console.error('Registration failed', err)
      alert(t('registration_failed'))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
  }

  const changeTab = (tab) => {
    if (tab !== activeTab) setLoading(true)
    setActiveTab(tab)
  }

  const toggleLanguage = () => {
    setVocabularyExampleTranslations({})
    const nextLanguage = i18n.language === 'en' ? 'fa' : 'en'
    localStorage.setItem('english-learning-language', nextLanguage)
    i18n.changeLanguage(nextLanguage)
  }

  useEffect(() => {
    if (!isLoggedIn) return

    const loadTabData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'dashboard') {
          const [wordsRes, personalRes, articlesRes, writingsRes, preferencesRes, progressRes, historyRes, statsRes, reviewRes, gamificationRes] = await Promise.all([
            apiFetch(apiUrl('/vocabulary/api/words/')),
            apiFetch(apiUrl('/vocabulary/api/my-words/')),
            apiFetch(apiUrl('/reading/api/articles/')),
            apiFetch(apiUrl('/writing/api/writings/')),
            apiFetch(apiUrl('/learning/api/preferences/')),
            apiFetch(apiUrl('/reading/api/progress/')),
            apiFetch(apiUrl('/quiz/api/history/')),
            apiFetch(apiUrl('/quiz/api/stats/')),
            apiFetch(apiUrl('/vocabulary/api/review/queue/')),
            apiFetch(apiUrl('/quiz/api/gamification/'))
          ])
          const [wordsData, personalData, articlesData, writingsData, preferencesData, progressData, historyData, statsData, reviewData, gamificationData] = await Promise.all([
            wordsRes.json(), personalRes.json(), articlesRes.json(), writingsRes.json(),
            preferencesRes.json(), progressRes.json(), historyRes.json(), statsRes.json(), reviewRes.json(), gamificationRes.json()
          ])
          setWords(Array.isArray(wordsData) ? wordsData : [])
          setPersonalWords(Array.isArray(personalData) ? personalData : [])
          setArticles(Array.isArray(articlesData) ? articlesData : [])
          setWritings(Array.isArray(writingsData) ? writingsData : [])
          if (preferencesRes.ok) {
            setPreferences(preferencesData)
            setReadingLevel(preferencesData.preferred_level)
            setVocabLevel(preferencesData.preferred_level)
            setQuizLevel(preferencesData.preferred_level)
          }
          setReadingProgress(Array.isArray(progressData) ? progressData : [])
          setQuizHistory(Array.isArray(historyData) ? historyData : [])
          if (statsRes.ok) setQuizStats(statsData)
          setDueReviewCount(reviewRes.ok ? Number(reviewData.count) || 0 : 0)
          if (gamificationRes.ok) {
            setGamification(gamificationData.gamification || { total_xp: 0, current_streak: 0, longest_streak: 0, badges: [] })
            setDailyChallengeInfo(gamificationData.daily_challenge || { completed: false, question_count: 10, duration_seconds: 300, xp_awarded: 0 })
          }
        } else if (activeTab === 'reading') {
          const [articlesRes, progressRes, storiesRes] = await Promise.all([
            apiFetch(apiUrl('/reading/api/articles/')),
            apiFetch(apiUrl('/reading/api/progress/')),
            apiFetch(apiUrl('/reading/api/stories/'))
          ])
          const [articlesData, progressData, storiesData] = await Promise.all([articlesRes.json(), progressRes.json(), storiesRes.json()])
          setArticles(Array.isArray(articlesData) ? articlesData : [])
          setReadingProgress(Array.isArray(progressData) ? progressData : [])
          setInteractiveStories(storiesRes.ok && Array.isArray(storiesData) ? storiesData : [])
        } else if (activeTab === 'vocabulary') {
          const [wordsRes, personalRes, reviewRes] = await Promise.all([
            apiFetch(apiUrl('/vocabulary/api/words/')),
            apiFetch(apiUrl('/vocabulary/api/my-words/')),
            apiFetch(apiUrl('/vocabulary/api/review/queue/'))
          ])
          const [wordsData, personalData, reviewData] = await Promise.all([
            wordsRes.json(), personalRes.json(), reviewRes.json()
          ])
          setWords(Array.isArray(wordsData) ? wordsData : [])
          setPersonalWords(Array.isArray(personalData) ? personalData : [])
          setDueReviewCount(reviewRes.ok ? Number(reviewData.count) || 0 : 0)
          setActiveReviewWord(null)
          setReviewAnswerVisible(false)
        } else if (activeTab === 'writing') {
          const res = await apiFetch(apiUrl('/writing/api/writings/'))
          const data = await res.json()
          setWritings(Array.isArray(data) ? data : [])
        } else if (activeTab === 'quiz') {
          const res = await apiFetch(apiUrl('/quiz/api/history/'))
          const data = await res.json()
          setQuizHistory(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Could not load learning data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTabData()
  }, [activeTab, isLoggedIn])


  const startDailyChallenge = async () => {
    if (dailyChallengeLoading || dailyChallengeInfo.completed) return
    setDailyChallengeLoading(true)
    setQuizError('')
    try {
      const response = await apiFetch(apiUrl('/quiz/api/daily-challenge/'))
      const data = await response.json()
      if (!response.ok) {
        setQuizError(data.detail || t('daily_challenge_load_failed'))
        changeTab('quiz')
        return
      }
      setGamification(data.gamification || gamification)
      setDailyChallengeInfo({
        date: data.date,
        completed: data.completed,
        question_count: data.question_count,
        duration_seconds: data.duration_seconds,
        xp_awarded: data.xp_awarded || 0,
      })
      if (data.completed) {
        setQuizError(t('daily_challenge_already_done'))
        changeTab('quiz')
        return
      }
      setQuizStartedAt(Date.now() - ((data.elapsed_seconds || 0) * 1000))
      setDailyChallengeMode(true)
      setQuizType('mixed')
      setQuizLevel('all')
      setQuizQuestionCount(data.question_count)
      setQuizTargetCount(data.question_count)
      setQuizQuestions(data.questions || [])
      setQuizAnswers({})
      setQuizImmediateFeedback({})
      setQuizResult(null)
      setQuizSubmitted(false)
      setCurrentQuestionIndex(0)
      setQuizTimeExpired(false)
      setQuizTotalDuration(data.duration_seconds)
      setQuizTimeLeft(data.remaining_seconds ?? data.duration_seconds)
      setQuizTimerMode('total')
      setQuizAnswerMode('end')
      setQuizAdaptiveMode(false)
      setQuizNotice(t('daily_challenge_started'))
      changeTab('quiz')
    } catch (error) {
      console.error('Could not load daily challenge:', error)
      setQuizError(t('daily_challenge_load_failed'))
      changeTab('quiz')
    } finally {
      setDailyChallengeLoading(false)
    }
  }

  const loadNextAdaptiveQuestion = async () => {
    if (loadingQuiz || quizQuestions.length >= quizTargetCount) return
    setLoadingQuiz(true)
    setQuizError('')
    try {
      const level = quizLevel || preferences.preferred_level || 'B1'
      const response = await apiFetch(apiUrl(`/quiz/api/adaptive/next/?skill=${quizType}&level=${level}`))
      const data = await response.json()
      if (!response.ok) {
        setQuizError(data.detail || t('quiz_load_failed'))
        return
      }
      setQuizQuestions((current) => [...current, data.question])
      setCurrentQuestionIndex((current) => current + 1)
      setQuizAdaptiveProgress(data.progress || null)
      setQuizQuestionTimeLeft(quizPerQuestionDuration)
    } catch (error) {
      console.error('Could not load next adaptive question:', error)
      setQuizError(t('quiz_load_failed'))
    } finally {
      setLoadingQuiz(false)
    }
  }

  const startQuiz = async (type = 'vocabulary') => {
    setQuizStartedAt(Date.now())
    setDailyChallengeMode(false)
    setQuizType(type)
    const level = quizLevel || preferences.preferred_level || 'B1'
    const count = quizQuestionCount === 0 ? quizCustomQuestionCount : quizQuestionCount
    setQuizQuestions([])
    setQuizTargetCount(count)
    setQuizAdaptiveProgress(null)
    setQuizTimeLeft(quizTotalDuration)
    setQuizQuestionTimeLeft(quizPerQuestionDuration)
    setQuizImmediateFeedback({})
    setQuizTimeExpired(false)
    setQuizError('')
    setQuizNotice('')
    setLoadingQuiz(true)
    setQuizSubmitted(false)
    setQuizResult(null)
    setCurrentQuestionIndex(0)
    setQuizAnswers({})

    try {
      if (quizAdaptiveMode) {
        const res = await apiFetch(apiUrl(`/quiz/api/adaptive/next/?skill=${type}&level=${level}`))
        const data = await res.json()
        if (!res.ok) {
          setQuizQuestions([])
          setQuizError(data.detail || t('quiz_load_failed'))
          return
        }
        setQuizQuestions([data.question])
        setQuizAdaptiveProgress(data.progress || null)
        setQuizTimerMode('none')
        return
      }
      const res = await apiFetch(apiUrl(`/quiz/api/questions/?type=${type}&level=${level}&count=${count}&difficulty=${quizDifficulty}&shuffle=${quizShuffle}`))
      const data = await res.json()
      if (res.ok) {
        const loadedQuestions = Array.isArray(data) ? data : []
        setQuizQuestions(loadedQuestions)
        if (loadedQuestions.length < count) setQuizNotice(t('quiz_fewer_questions', { requested: count, available: loadedQuestions.length }))
      } else {
        setQuizQuestions([])
        setQuizError(data.detail || t('quiz_load_failed'))
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err)
      setQuizError(t('quiz_load_failed'))
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleAnswerSelect = async (questionId, optionKey) => {
    if ((quizAdaptiveMode || quizAnswerMode === 'each') && quizImmediateFeedback[questionId]) return
    setQuizAnswers((current) => ({ ...current, [questionId]: optionKey }))
    setQuizError('')
    if (quizAdaptiveMode || quizAnswerMode === 'each') {
      setLoadingQuiz(true)
      try {
        const response = await apiFetch(apiUrl('/quiz/api/check-answer/'), {
          method: 'POST',
          body: JSON.stringify({ question_id: questionId, answer: optionKey, adaptive: quizAdaptiveMode }),
        })
        const feedback = await response.json()
        if (!response.ok) {
          setQuizError(feedback.detail || t('quiz_feedback_failed'))
          return
        }
        setQuizImmediateFeedback((current) => ({ ...current, [questionId]: feedback }))
        if (feedback.adaptive_progress) setQuizAdaptiveProgress(feedback.adaptive_progress)
      } catch (error) {
        console.error('Could not check quiz answer:', error)
        setQuizError(t('quiz_feedback_failed'))
      } finally {
        setLoadingQuiz(false)
      }
    }
  }

  const submitQuizFinal = async (finalAnswers = quizAnswers, { allowPartial = false } = {}) => {
    if (loadingQuiz) return
    const answeredCount = Object.keys(finalAnswers).length
    if (answeredCount === 0) {
      setQuizError(t('quiz_answer_required'))
      return
    }
    if (!allowPartial && answeredCount < quizQuestions.length) {
      setQuizError(t('quiz_all_answered'))
      return
    }

    setLoadingQuiz(true)
    setQuizError('')
    try {
      const res = await apiFetch(apiUrl(dailyChallengeMode ? '/quiz/api/daily-challenge/submit/' : '/quiz/api/submit/'), {
        method: 'POST',
        body: JSON.stringify(dailyChallengeMode
          ? { answers: finalAnswers }
          : {
              quiz_type: quizType,
              level: quizLevel,
              answers: finalAnswers,
              duration_seconds: quizStartedAt ? Math.max(0, Math.floor((Date.now() - quizStartedAt) / 1000)) : 0,
            }),
      })
      const resultData = await res.json().catch(() => ({}))
      if (!res.ok) {
        setQuizError(resultData.detail || resultData.answers || t('quiz_submit_failed'))
        return
      }

      const normalizedResult = dailyChallengeMode
        ? { ...resultData, score: resultData.correct_answers, total: resultData.total }
        : resultData
      setQuizResult(normalizedResult)
      if (dailyChallengeMode) {
        setGamification(resultData.gamification || gamification)
        setDailyChallengeInfo((current) => ({ ...current, completed: true, xp_awarded: resultData.xp_awarded || 0 }))
      }
      setQuizSubmitted(true)
      setQuizTimeExpired(false)

      try {
        const [historyRes, statsRes, gamificationRes] = await Promise.all([
          apiFetch(apiUrl('/quiz/api/history/')),
          apiFetch(apiUrl('/quiz/api/stats/')),
          apiFetch(apiUrl('/quiz/api/gamification/')),
        ])
        const [historyData, statsData, gamificationData] = await Promise.all([
          historyRes.json(), statsRes.json(), gamificationRes.json(),
        ])
        if (historyRes.ok) setQuizHistory(Array.isArray(historyData) ? historyData : [])
        if (statsRes.ok) setQuizStats(statsData)
        if (gamificationRes.ok && gamificationData.gamification) {
          setGamification(gamificationData.gamification)
          setDailyChallengeInfo(gamificationData.daily_challenge || { completed: false, question_count: 10, duration_seconds: 300, xp_awarded: 0 })
        }
      } catch (refreshError) {
        // The submitted result is already saved; a history refresh failure must not hide it.
        console.error('Quiz was submitted, but refreshing quiz history failed:', refreshError)
      }
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setQuizError(t('quiz_submit_failed'))
    } finally {
      setLoadingQuiz(false)
    }
  };

  const handleWordClick = async (word, sentence = word) => {
    const cleanedTerm = word.replace(/^[^a-zA-Z'-]+|[^a-zA-Z'-]+$/g, '').trim().toLowerCase()
    const cleanedSentence = sentence.trim().slice(0, 400)
    if (!cleanedTerm || !cleanedSentence) return
    const requestId = ++readingLookupRequestRef.current
    setReadingLookup({ term: cleanedTerm, sentence: cleanedSentence, data: null })
    setReadingLookupBusy(true)
    setReadingLookupError('')
    setReadingLookupSaved(false)
    try {
      const res = await apiFetch(apiUrl('/reading/api/lookup/'), {
        method: 'POST',
        body: JSON.stringify({ term: cleanedTerm, sentence: cleanedSentence })
      })
      const data = await res.json()
      if (requestId !== readingLookupRequestRef.current) return
      if (!res.ok) {
        setReadingLookupError(data.detail || t('reading_lookup_failed'))
        return
      }
      if (!data.sentence_translation) {
        const browserTranslation = await translateEnglishToPersian(cleanedSentence)
        if (requestId !== readingLookupRequestRef.current) return
        if (browserTranslation) {
          data.sentence_translation = browserTranslation
          data.translation_available = true
        }
      }
      if (data.term && !data.translation) {
        const browserWordTranslation = await translateEnglishToPersian(data.term)
        if (requestId !== readingLookupRequestRef.current) return
        if (browserWordTranslation) data.translation = browserWordTranslation
      }
      setReadingLookup((current) => current ? { ...current, data } : current)
    } catch (err) {
      if (requestId !== readingLookupRequestRef.current) return
      console.error('Could not look up reading text:', err)
      setReadingLookupError(t('reading_lookup_failed'))
    } finally {
      if (requestId === readingLookupRequestRef.current) setReadingLookupBusy(false)
    }
  }

  const handleSentenceClick = async (sentence) => {
    const cleanedSentence = sentence.trim().slice(0, 400)
    if (!cleanedSentence || !/[a-zA-Z]/.test(cleanedSentence)) return
    const requestId = ++readingLookupRequestRef.current
    // Sentence-only mode must not silently select or save its first word.
    setReadingLookup({ term: '', sentence: cleanedSentence, data: null })
    setReadingLookupBusy(true)
    setReadingLookupError('')
    setReadingLookupSaved(false)
    try {
      const res = await apiFetch(apiUrl('/reading/api/lookup/'), {
        method: 'POST',
        body: JSON.stringify({ term: '', sentence: cleanedSentence })
      })
      const data = await res.json()
      if (requestId !== readingLookupRequestRef.current) return
      if (!res.ok) {
        setReadingLookupError(data.detail || t('reading_lookup_failed'))
        return
      }
      if (!data.sentence_translation) {
        const browserTranslation = await translateEnglishToPersian(cleanedSentence)
        if (requestId !== readingLookupRequestRef.current) return
        if (browserTranslation) {
          data.sentence_translation = browserTranslation
          data.translation_available = true
        }
      }
      if (data.term && !data.translation) {
        const browserWordTranslation = await translateEnglishToPersian(data.term)
        if (requestId !== readingLookupRequestRef.current) return
        if (browserWordTranslation) data.translation = browserWordTranslation
      }
      setReadingLookup((current) => current ? { ...current, data } : current)
    } catch (err) {
      if (requestId !== readingLookupRequestRef.current) return
      console.error('Could not translate reading sentence:', err)
      setReadingLookupError(t('reading_lookup_failed'))
    } finally {
      if (requestId === readingLookupRequestRef.current) setReadingLookupBusy(false)
    }
  }

  const saveLookupWord = async () => {
    if (!readingLookup?.term || !readingLookup?.data) return
    const lookupRequestId = readingLookupRequestRef.current
    const savingTerm = readingLookup.term
    setReadingLookupSavingTerm(savingTerm)
    setReadingLookupError('')
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/my-words/'), {
        method: 'POST',
        body: JSON.stringify({
          english_word: readingLookup.term,
          translation: readingLookup.data.translation || '',
          example: readingLookup.data.example || '',
          level: preferences.preferred_level || 'B1'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (lookupRequestId === readingLookupRequestRef.current) setReadingLookupError(data.detail || t('word_save_failed'))
        return
      }
      setPersonalWords((current) => [data, ...current.filter((item) => item.id !== data.id)])
      if (lookupRequestId === readingLookupRequestRef.current) setReadingLookupSaved(true)
      loadReviewQueue()
    } catch (err) {
      console.error('Could not save reading lookup:', savingTerm, err)
      if (lookupRequestId === readingLookupRequestRef.current) setReadingLookupError(t('word_save_failed'))
    } finally {
      setReadingLookupSavingTerm((current) => current === savingTerm ? '' : current)
    }
  }

  const speakLookupTerm = () => {
    if (!readingLookup?.term || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setReadingLookupError(t('reading_audio_unavailable'))
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(readingLookup.term)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  const closeReadingLookup = () => {
    readingLookupRequestRef.current += 1
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setReadingLookup(null)
    setReadingLookupBusy(false)
    setReadingLookupError('')
    setReadingLookupSaved(false)
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setPreferencesSaving(true)
    try {
      const res = await apiFetch(apiUrl('/learning/api/preferences/'), {
        method: 'PATCH',
        body: JSON.stringify(preferences)
      })
      const data = await res.json()
      if (res.ok) {
        setPreferences(data)
        setReadingLevel(data.preferred_level)
        setVocabLevel(data.preferred_level)
        alert(t('preferences_saved'))
      } else {
        alert(t('preferences_failed'))
      }
    } catch (err) {
      console.error('Could not save learning preferences:', err)
      alert(t('preferences_failed'))
    } finally {
      setPreferencesSaving(false)
    }
  }

  const markArticleRead = async (articleId, completed) => {
    try {
      const res = await apiFetch(apiUrl('/reading/api/progress/'), {
        method: 'POST',
        body: JSON.stringify({ article_id: articleId, completed })
      })
      const data = await res.json()
      if (res.ok) {
        setReadingProgress((current) => [data, ...current.filter((item) => item.article_id !== articleId)])
      }
    } catch (err) {
      console.error('Could not save reading progress:', err)
    }
  }

  const startInteractiveStory = (story) => {
    setActiveStoryId(story.id)
    setActiveStoryNodeId(story.start_node)
    setStoryVisitedNodes([story.start_node])
    setStorySelectedOption('')
    setStoryAnswerFeedback(null)
    setStoryError('')
  }

  const resetInteractiveStory = () => {
    setActiveStoryId(null)
    setActiveStoryNodeId(null)
    setStoryVisitedNodes([])
    setStorySelectedOption('')
    setStoryAnswerFeedback(null)
    setStoryError('')
  }

  const chooseStoryPath = (nextNodeId) => {
    if (!activeStory?.nodes?.[nextNodeId]) return
    setActiveStoryNodeId(nextNodeId)
    setStoryVisitedNodes((current) => current.includes(nextNodeId) ? current : [...current, nextNodeId])
    setStorySelectedOption('')
    setStoryAnswerFeedback(null)
    setStoryError('')
  }

  const submitStoryAnswer = async () => {
    if (!activeStory || !activeStoryNodeId || storySelectedOption === '') return
    setStoryAnswerBusy(true)
    setStoryError('')
    try {
      const response = await apiFetch(apiUrl('/reading/api/stories/check-answer/'), {
        method: 'POST',
        body: JSON.stringify({ story_id: activeStory.id, node_id: activeStoryNodeId, option_index: Number(storySelectedOption) })
      })
      const data = await response.json()
      if (!response.ok) {
        setStoryError(data.detail || t('story_answer_failed'))
        return
      }
      setStoryAnswerFeedback(data)
    } catch (error) {
      console.error('Could not check story answer:', error)
      setStoryError(t('story_answer_failed'))
    } finally {
      setStoryAnswerBusy(false)
    }
  }

  const saveCuratedWord = async (word) => {
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/my-words/'), {
        method: 'POST',
        body: JSON.stringify({ english_word: word.english_word, translation: word.translation || '', level: word.level || preferences.preferred_level || 'B1' })
      })
      const data = await res.json()
      if (res.ok) {
        setPersonalWords((current) => [data, ...current.filter((item) => item.id !== data.id)])
        loadReviewQueue()
        alert(t('word_saved', { word: data.english_word }))
      } else {
        alert(t('word_save_failed'))
      }
    } catch (err) {
      console.error('Could not save curated word:', err)
      alert(t('word_save_failed'))
    }
  }

  const startWordReview = (word) => {
    if (!word?.id) return
    setActiveReviewWord(word)
    setReviewAnswerVisible(false)
  }

  const loadReviewQueue = async () => {
    setReviewBusy(true)
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/review/queue/'))
      const data = await res.json()
      if (res.ok && Array.isArray(data.results)) {
        setDueReviewCount(Number(data.count) || 0)
        return data.results
      }
      return []
    } catch (err) {
      console.error('Could not load due vocabulary reviews:', err)
      return []
    } finally {
      setReviewBusy(false)
    }
  }

  const beginDailyReview = async () => {
    const dueWords = await loadReviewQueue()
    if (dueWords.length > 0) startWordReview(dueWords[0])
  }

  const speakReviewWord = () => {
    if (!activeReviewWord?.english_word || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(activeReviewWord.english_word)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  const submitWordReview = async (quality) => {
    if (!activeReviewWord) return
    setReviewBusy(true)
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${activeReviewWord.id}/review/`), {
        method: 'POST',
        body: JSON.stringify({ quality })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.detail || t('review_failed'))
        return
      }

      setPersonalWords((current) => current.map((item) => item.id === data.id ? data : item))
      const queueRes = await apiFetch(apiUrl('/vocabulary/api/review/queue/'))
      const queueData = await queueRes.json()
      const remaining = queueRes.ok && Array.isArray(queueData.results) ? queueData.results : []
      setDueReviewCount(queueRes.ok ? Number(queueData.count) || 0 : remaining.length)
      setActiveReviewWord(remaining[0] || null)
      setReviewAnswerVisible(false)
    } catch (err) {
      console.error('Could not save vocabulary review:', err)
      alert(t('review_failed'))
    } finally {
      setReviewBusy(false)
    }
  }

  const updateWordTranslation = async (word, translation) => {
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${word.id}/`), {
        method: 'PATCH',
        body: JSON.stringify({ translation })
      })
      const data = await res.json()
      if (res.ok) setPersonalWords((current) => current.map((item) => item.id === data.id ? data : item))
    } catch (err) {
      console.error('Could not update word translation:', err)
    }
  }

  const deletePersonalWord = async (word) => {
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${word.id}/`), { method: 'DELETE' })
      if (res.ok) setPersonalWords((current) => current.filter((item) => item.id !== word.id))
    } catch (err) {
      console.error('Could not delete saved word:', err)
    }
  };

  const dailyLearningSeconds = quizHistory.reduce((total, session) => {
    const createdAt = session.created_at ? new Date(session.created_at) : null
    if (!createdAt || Number.isNaN(createdAt.getTime()) || createdAt.toDateString() !== new Date().toDateString()) return total
    return total + Math.max(0, Number(session.duration_seconds) || 0)
  }, 0)
  const dailyLearningMinutes = Math.floor(dailyLearningSeconds / 60)
  const dailyMinutesGoal = 15
  const dailyGoalPercent = Math.min(100, Math.round((dailyLearningSeconds / (dailyMinutesGoal * 60)) * 100))
  const estimatedReviewMinutes = Math.ceil(dueReviewCount * 0.5)
  const difficultReviewWords = [...personalWords]
    .filter((word) => Number(word.incorrect_count) > 0)
    .sort((left, right) => (Number(right.incorrect_count) - Number(left.incorrect_count)) || (Number(left.proficiency) - Number(right.proficiency)))
    .slice(0, 3)
  const goalTab = ({ general: 'vocabulary', travel: 'reading', work: 'writing', exam: 'quiz' })[preferences.learning_goal] || 'vocabulary'
  const goalPromptKey = `writing_prompt_${preferences.learning_goal || 'general'}`

  const activeStory = interactiveStories.find((story) => story.id === activeStoryId) || null
  const activeStoryNode = activeStory?.nodes?.[activeStoryNodeId] || null
  const storyProgressPercent = activeStory && storyVisitedNodes.length
    ? activeStoryNode?.ending
      ? 100
      : Math.min(90, Math.round((storyVisitedNodes.length / 4) * 100))
    : 0

  const filteredArticles = articles.filter((article) => {
    const matchesQuery = `${article.title} ${article.content}`.toLowerCase().includes(readingQuery.trim().toLowerCase())
    return matchesQuery && (readingLevel === 'all' || article.level === readingLevel)
  })

  const activeVocabularySet = THEMATIC_VOCABULARY_SETS.find((set) => set.id === selectedVocabularySet) || null
  const thematicVocabularyItems = (activeVocabularySet ? [activeVocabularySet] : THEMATIC_VOCABULARY_SETS)
    .flatMap((set) => set.words.map(([english_word, translation, level]) => ({
      english_word, translation, level, proficiency: 0, example: '', isPersonal: false, isThematic: true,
      key: `thematic-${set.id}-${english_word}`,
    })))
  const vocabularyItems = [
    ...personalWords.map((word) => ({ ...word, isPersonal: true, key: `personal-${word.id}` })),
    ...words
      .filter((word) => !personalWords.some((saved) => saved.english_word.toLowerCase() === word.english_word.toLowerCase()))
      .map((word) => ({ ...word, isPersonal: false, key: `curated-${word.id}` })),
    ...thematicVocabularyItems.filter((thematicWord) =>
      !personalWords.some((saved) => saved.english_word.toLowerCase() === thematicWord.english_word.toLowerCase())
      && !words.some((word) => word.english_word.toLowerCase() === thematicWord.english_word.toLowerCase())
    ),
  ].filter((word) => {
    const matchesQuery = `${word.english_word} ${word.translation || ''}`.toLowerCase().includes(vocabQuery.trim().toLowerCase())
    const matchesSet = !activeVocabularySet || activeVocabularySet.words.some(([term]) => term.toLowerCase() === word.english_word.toLowerCase())
    return matchesQuery && matchesSet && (vocabLevel === 'all' || word.level === vocabLevel)
  })

  useEffect(() => {
    if (!selectedVocabularyWord?.english_word) return undefined
    let cancelled = false
    const word = selectedVocabularyWord.english_word.trim().toLowerCase()

    const loadDictionaryEntry = async () => {
      let dictionaryEntry = null
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        if (response.ok) {
          const payload = await response.json()
          dictionaryEntry = Array.isArray(payload) && payload.length ? payload[0] : null
        }
      } catch {
        // Try the independent Datamuse source if the dictionary request fails.
      }

      const datamuse = async (params) => {
        const url = new URL('https://api.datamuse.com/words')
        url.search = new URLSearchParams({ ...params, max: '12' }).toString()
        const response = await fetch(url.toString())
        if (!response.ok) return []
        const payload = await response.json()
        return Array.isArray(payload) ? payload : []
      }
      const [definitions, synonyms, antonyms, followers, predecessors] = await Promise.allSettled([
        datamuse({ sp: word, md: 'dp' }),
        datamuse({ rel_syn: word }),
        datamuse({ rel_ant: word }),
        datamuse({ rel_bga: word }),
        datamuse({ rel_bgb: word }),
      ])
      const exactDefinition = definitions.status === 'fulfilled'
        ? definitions.value.find((item) => item.word?.toLowerCase() === word && Array.isArray(item.defs))
        : null
      if (!dictionaryEntry?.meanings?.length && exactDefinition?.defs?.length) {
        const grouped = new Map()
        exactDefinition.defs.forEach((item) => {
          const [partOfSpeech, ...definitionParts] = String(item).split('\t')
          const definition = definitionParts.join('\t').trim()
          if (!definition) return
          const part = partOfSpeech || 'meaning'
          if (!grouped.has(part)) grouped.set(part, [])
          grouped.get(part).push({ definition })
        })
        if (grouped.size) {
          dictionaryEntry = {
            word,
            meanings: [...grouped.entries()].map(([partOfSpeech, items]) => ({ partOfSpeech, definitions: items })),
            phonetics: [],
            source: 'datamuse',
          }
        }
      }
      const followingWords = followers.status === 'fulfilled' ? followers.value.map((item) => item.word).filter(Boolean) : []
      const precedingWords = predecessors.status === 'fulfilled' ? predecessors.value.map((item) => item.word).filter(Boolean) : []
      const related = {
        synonyms: synonyms.status === 'fulfilled' ? synonyms.value.map((item) => item.word).filter(Boolean).slice(0, 8) : [],
        antonyms: antonyms.status === 'fulfilled' ? antonyms.value.map((item) => item.word).filter(Boolean).slice(0, 8) : [],
        collocations: [...new Set([
          ...followingWords.map((item) => `${word} ${item}`),
          ...precedingWords.map((item) => `${item} ${word}`),
        ])].slice(0, 10),
      }
      if (dictionaryEntry?.meanings?.length) {
        dictionaryEntry.meanings = dictionaryEntry.meanings.map((meaning) => ({
          ...meaning,
          synonyms: [...new Set([...(meaning.synonyms || []), ...related.synonyms])],
          antonyms: [...new Set([...(meaning.antonyms || []), ...related.antonyms])],
        }))
      }
      if (!cancelled) {
        setVocabularyDictionary(dictionaryEntry)
        setVocabularyRelatedWords(related)
        if (!dictionaryEntry?.meanings?.length) {
          setVocabularyDictionaryError(i18n.language === 'fa'
            ? 'تعریف آنلاین برای این واژه پیدا نشد؛ معنی و مثال ذخیره‌شده همچنان در دسترس است.'
            : 'No online definition was found. The saved meaning and example are still available.')
        }
      }
    }

    loadDictionaryEntry()
      .catch(() => {
        if (!cancelled) setVocabularyDictionaryError(i18n.language === 'fa'
          ? 'منابع فرهنگ لغت موقتاً پاسخ نمی‌دهند؛ معنی و مثال ذخیره‌شده همچنان در دسترس است.'
          : 'Dictionary sources are temporarily unavailable. The saved meaning and example are still available.')
      })
      .finally(() => { if (!cancelled) setVocabularyDictionaryLoading(false) })
    return () => { cancelled = true }
  }, [selectedVocabularyWord?.english_word, i18n.language])

  useEffect(() => {
    let cancelled = false
    const dictionaryText = (vocabularyDictionary?.meanings || [])
      .flatMap((meaning) => meaning.definitions || [])
      .flatMap((definition) => [definition.definition, definition.example])
      .filter((text, index, all) => text && all.indexOf(text) === index)
      .slice(0, 14)
    if (i18n.language !== 'fa' || dictionaryText.length === 0) return undefined
    const translateDictionaryText = async () => {
      const translations = await Promise.all(dictionaryText.map(async (text) => [text, await translateEnglishToPersian(text)]))
      if (!cancelled) setVocabularyExampleTranslations(Object.fromEntries(translations.filter(([, translation]) => translation)))
    }
    translateDictionaryText()
    return () => { cancelled = true }
  }, [vocabularyDictionary, i18n.language])

  const speakVocabularyWord = (word) => {
    if (!word?.english_word || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word.english_word)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  const handleWritingSubmit = async (e) => {
    e.preventDefault();
    if (!writingText.trim()) return;

    setWritingNotice(null);
    setSubmittingWriting(true);
    try {
      const res = await apiFetch(apiUrl('/writing/api/writings/'), {
        method: 'POST',
        body: JSON.stringify({ original_text: writingText })
      });

      if (res.ok) {
        const newSubmission = await res.json();
        setWritings([newSubmission, ...writings]);
        setWritingText('');
        if (newSubmission.ai_status === 'corrected' && newSubmission.corrected_text) setWritingNotice({ type: 'success', key: 'writing_analyzed' });
        else if (newSubmission.ai_status === 'unavailable') {
          const errorMessageKey = ({
            missing_api_key: 'writing_ai_missing_key',
            invalid_api_key: 'writing_ai_invalid_key',
            model_permission_denied: 'writing_ai_model_permission_denied',
            rate_limited: 'writing_ai_rate_limited',
            invalid_model_or_request: 'writing_ai_model_error',
            network_error: 'writing_ai_network_error',
          })[newSubmission.ai_error_code] || 'writing_ai_provider_error';
          setWritingNotice({ type: 'warning', key: errorMessageKey });
        }
        else setWritingNotice({ type: 'warning', key: 'writing_saved' });
      } else {
        setWritingNotice({ type: 'error', key: 'writing_failed' });
      }
    } catch (err) {
      console.error('Error submitting writing:', err);
      setWritingNotice({ type: 'error', key: 'writing_failed' });
    } finally {
      setSubmittingWriting(false);
    }
  };

  const handleDeleteWritingHistory = async () => {
    if (!writings.length || !window.confirm(t('confirm_delete_writing_history'))) return;

    try {
      const res = await apiFetch(apiUrl('/writing/api/writings/'), { method: 'DELETE' });
      if (res.ok) {
        setWritings([]);
        alert(t('writing_history_deleted'));
      } else {
        alert(t('writing_history_delete_failed'));
      }
    } catch (err) {
      console.error('Error deleting writing history:', err);
      alert(t('writing_history_delete_failed'));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
        <div className={`max-w-md w-full space-y-8 p-8 rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isRegistering ? t('create_account') : t('login')}</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="space-y-4">
              <input type="text" required autoComplete="username" aria-label={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('username')} />
              {isRegistering && <input type="email" autoComplete="email" aria-label={t("email_optional")} value={email} onChange={(e) => setEmail(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('email_optional')} />}
              <input type="password" required autoComplete={isRegistering ? 'new-password' : 'current-password'} aria-label={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('password')} />
              {isRegistering && <input type="password" required autoComplete="new-password" aria-label={t("password_confirm")} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('password_confirm')} />}
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              {isRegistering ? t('register') : t('login')}
            </button>
          </form>
          <button type="button" onClick={() => setIsRegistering((current) => !current)} className="w-full text-sm font-bold text-indigo-600 hover:text-indigo-800">
            {isRegistering ? t('already_have_account') : t('no_account')}
          </button>
          <div className="flex gap-2 pt-4">
            <button onClick={toggleLanguage} title={t('language_toggle')} aria-label={t('language_toggle')} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {i18n.language === 'en' ? '🇮🇷 فارسی' : '🇬🇧 English'}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} title={t(darkMode ? 'light_mode' : 'dark_mode')} aria-label={t('theme_toggle')} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
      <nav className={`shadow-sm border-b sticky top-0 z-10 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between min-h-16 items-center gap-3 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className={`font-extrabold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('app_title')}</span>
              </div>
              
              <div className="order-3 flex w-full max-w-full gap-3 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6">
                <button onClick={() => changeTab('dashboard')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_dashboard')}
                </button>
                <button onClick={() => changeTab('reading')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'reading' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_reading')}
                </button>
                <button onClick={() => changeTab('vocabulary')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'vocabulary' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_vocabulary')}
                </button>
                <button onClick={() => changeTab('writing')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'writing' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_writing')}
                </button>
                <button onClick={() => changeTab('conversation')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'conversation' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_conversation')}
                </button>
                <button onClick={() => changeTab('quiz')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'quiz' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_quiz')}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} title={t('language_toggle')} aria-label={t('language_toggle')} className="text-lg hover:scale-110 transition-transform p-1">
                  {i18n.language === 'en' ? '🇮🇷' : '🇬🇧'}
                </button>
                <button onClick={() => setDarkMode(!darkMode)} title={t(darkMode ? 'light_mode' : 'dark_mode')} aria-label={t('theme_toggle')} className="text-lg hover:scale-110 transition-transform p-1">
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors">
                  {t('logout')}
                </button>
              </div>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center">
          <h1 className={`text-4xl font-black mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {activeTab === 'reading' ? t('reading_title') : activeTab === 'vocabulary' ? t('vocab_title') : activeTab === 'writing' ? t('writing_title') : activeTab === 'conversation' ? t('conversation_title') : activeTab === 'quiz' ? t('quiz_title') : t('dashboard_title')}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`rounded-2xl p-6 shadow-sm border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`h-6 rounded w-3/4 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-20 rounded w-full mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <section className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${darkMode ? 'bg-indigo-950/40 border-indigo-900' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{t('daily_learning_goal')}</p>
                    <h2 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('daily_learning_headline')}</h2>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('daily_learning_subtitle', { minutes: dailyMinutesGoal })}</p>
                  </div>
                  <button onClick={() => changeTab(goalTab)} className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">{t('continue_learning')} →</button>
                </section>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('vocab_title')}</h3>
                    <p className="text-5xl font-black text-indigo-500">{personalWords.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('tab_reading')}</h3>
                    <p className="text-5xl font-black text-green-500">{articles.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('daily_streak')}</h3>
                    <p className="text-5xl font-black text-orange-500">{streak} ⚡</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-3">{t('daily_goal_progress')}</h3>
                    <div className="flex items-baseline gap-1"><p className="text-2xl font-black text-indigo-500">{dailyLearningMinutes}</p><span className="text-sm text-gray-500">/ {dailyMinutesGoal} {t('minutes_short')}</span></div>
                    <div className={`w-full rounded-full h-2.5 mt-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} role="progressbar" aria-label={t('daily_goal_progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyGoalPercent}>
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${dailyGoalPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('daily_goal_quiz_time_note')} · {dailyGoalPercent}%</p>
                  </div>
                </div>

                <section className={`rounded-2xl border p-6 space-y-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{t('daily_challenge_title')} ✨</h3>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('daily_challenge_desc', { count: dailyChallengeInfo.question_count || 10, minutes: Math.round((dailyChallengeInfo.duration_seconds || 300) / 60) })}</p>
                    </div>
                    <div className="rounded-xl bg-amber-100 px-4 py-2 text-amber-800 font-black">⭐ {gamification.total_xp} XP</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}><p className="text-xs text-gray-500">{t('daily_streak')}</p><p className="text-2xl font-black">🔥 {gamification.current_streak}</p></div>
                    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}><p className="text-xs text-gray-500">{t('longest_streak')}</p><p className="text-2xl font-black">{gamification.longest_streak}</p></div>
                    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}><p className="text-xs text-gray-500">{t('grammar_mastery')}</p><p className="text-2xl font-black">{gamification.grammar_correct}/20</p></div>
                    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}><p className="text-xs text-gray-500">{t('vocabulary_mastery')}</p><p className="text-2xl font-black">{gamification.vocabulary_correct}/20</p></div>
                  </div>
                  {gamification.badges?.length > 0 && <div><h4 className="font-bold mb-2">{t('your_badges')}</h4><div className="flex flex-wrap gap-2">{gamification.badges.map((badge) => <span key={badge.id} title={t(`badge_desc_${badge.id}`)} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">🏅 {t(`badge_${badge.id}`)}</span>)}</div></div>}
                  {dailyChallengeInfo.completed ? (
                    <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">{t('daily_challenge_complete_today', { xp: dailyChallengeInfo.xp_awarded || 0 })}</div>
                  ) : (
                    <button type="button" disabled={dailyChallengeLoading} onClick={startDailyChallenge} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{dailyChallengeLoading ? t('loading') : t('start_daily_challenge')}</button>
                  )}
                </section>

                <section aria-labelledby="today-review-title" className={`p-5 md:p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 id="today-review-title" className="text-lg font-extrabold">{t('spaced_review')}</h3>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('due_count', { count: dueReviewCount })}</p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('estimated_review_time', { minutes: estimatedReviewMinutes })}</p>
                    </div>
                    <button type="button" onClick={() => changeTab('vocabulary')} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2">{t('open_review')}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-900/60' : 'bg-indigo-50/70'}`}>
                      <p className="text-sm font-bold">{t('difficult_words')}</p>
                      {difficultReviewWords.length ? (
                        <ul className="mt-2 space-y-2">
                          {difficultReviewWords.map((word) => (
                            <li key={word.id} className="flex items-center justify-between gap-3 text-sm">
                              <span dir="ltr" className="font-semibold truncate">{word.english_word}</span>
                              <span className="shrink-0 text-rose-500">{t('mistake_count', { count: word.incorrect_count })}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('no_difficult_words')}</p>}
                    </div>
                    <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-900/60' : 'bg-amber-50/70'}`}>
                      <p className="text-sm font-bold">{t('most_missed_words')}</p>
                      {difficultReviewWords.length ? (
                        <ul className="mt-2 space-y-2">
                          {difficultReviewWords.map((word) => (
                            <li key={word.id} className="flex items-center justify-between gap-3 text-sm">
                              <span dir="ltr" className="font-semibold truncate">{word.english_word}</span>
                              <span className="shrink-0 text-rose-500">{Number(word.incorrect_count) || 0}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('no_missed_words')}</p>}
                    </div>
                  </div>
                </section>

                <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="max-w-3xl">
                    <h3 className="text-lg font-extrabold">{t('personalized_next_step')}</h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t(`goal_next_${preferences.learning_goal || 'general'}`)}</p>
                    <p className="mt-2 text-xs font-bold text-indigo-500">{t('preferred_level')}: {preferences.preferred_level}</p>
                  </div>
                  <button type="button" onClick={() => changeTab(goalTab)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2">{t('open_recommended_activity')}</button>
                </div>

                <form onSubmit={savePreferences} className={`p-6 rounded-2xl shadow-sm border space-y-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div>
                    <h3 className="text-lg font-bold">{t('learning_preferences')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('learning_preferences_desc')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('preferred_level')}</span>
                      <select value={preferences.preferred_level} onChange={(event) => setPreferences((current) => ({ ...current, preferred_level: event.target.value }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <option value="A1">A1 — Beginner</option><option value="B1">B1 — Intermediate</option><option value="C1">C1 — Advanced</option>
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('daily_word_goal')}</span>
                      <input type="number" min="1" max="100" value={preferences.daily_word_goal} onChange={(event) => setPreferences((current) => ({ ...current, daily_word_goal: Number(event.target.value) }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                    </label>
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('learning_goal')}</span>
                      <select value={preferences.learning_goal} onChange={(event) => setPreferences((current) => ({ ...current, learning_goal: event.target.value }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <option value="general">{t('goal_general')}</option><option value="travel">{t('goal_travel')}</option><option value="work">{t('goal_work')}</option><option value="exam">{t('goal_exam')}</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" disabled={preferencesSaving} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{preferencesSaving ? t('saving') : t('save_preferences')}</button>
                </form>

                <div className={`p-6 rounded-2xl shadow-sm border h-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('quiz_activity_last_7_days')}
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{backgroundColor: darkMode ? '#1f2937' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Area type="monotone" dataKey="activity" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {readingLookup && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeReadingLookup() }}>
                <section role="dialog" aria-modal="true" aria-labelledby="reading-lookup-title" className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border shadow-2xl ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
                  <header className="flex items-start justify-between gap-4 border-b border-gray-200/20 p-5 sm:p-6">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">{t('reading_lookup_eyebrow')}</p>
                      <h2 id="reading-lookup-title" className="mt-1 text-2xl font-black" dir={readingLookup.term ? 'ltr' : (i18n.language === 'fa' ? 'rtl' : 'ltr')}>{readingLookup.term || t('reading_sentence_translation')}</h2>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{!readingLookup.term ? t('reading_sentence_translation') : readingLookup.data?.term_type === 'phrase' ? t('reading_phrase') : t('reading_word')}</p>
                    </div>
                    <button onClick={closeReadingLookup} aria-label={t('close')} className={`rounded-xl p-2 text-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>×</button>
                  </header>
                  <div className="space-y-5 p-5 sm:p-6">
                    {readingLookupBusy && !readingLookup.data ? <div className="flex items-center gap-3 py-8 text-sm"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />{readingLookup.term ? t('reading_lookup_loading') : t('reading_sentence_loading')}</div> : null}
                    {readingLookup.data && (
                      <>
                        {readingLookup.term && (
                          <section className={`rounded-2xl p-4 ${darkMode ? 'bg-indigo-950/40' : 'bg-indigo-50'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{t('reading_meaning_context')}</p>
                                {readingLookup.data.translation ? <p className="mt-2 text-lg font-extrabold">{readingLookup.data.translation}</p> : <p className="mt-2 text-sm text-amber-500">{t('reading_word_translation_unavailable')}</p>}
                                <p className="mt-2 text-sm leading-6" dir="ltr">{readingLookup.data.definition}</p>
                                {readingLookup.data.part_of_speech ? <p className="mt-1 text-xs opacity-70">{readingLookup.data.part_of_speech}</p> : null}
                              </div>
                              <button onClick={speakLookupTerm} className="flex shrink-0 items-center gap-2 rounded-xl border border-indigo-400/40 px-3 py-2 text-sm font-bold hover:bg-indigo-500/10"><span aria-hidden="true">🔊</span>{t('reading_listen')}</button>
                            </div>
                          </section>
                        )}
                        {readingLookup.term && (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <section className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800/70' : 'border-gray-200 bg-gray-50'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-extrabold">{t('word_pronunciation')}</h3>
                                <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-black text-indigo-500">{readingLookup.data.level || 'B1'}</span>
                              </div>
                              <p className="mt-2 text-lg font-semibold" dir="ltr">{readingLookup.data.phonetic || t('pronunciation_hint')}</p>
                              <p className="mt-1 text-xs opacity-70">{t('word_level_label')}</p>
                            </section>
                            <section className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800/70' : 'border-gray-200 bg-gray-50'}`}>
                              <h3 className="font-extrabold">{t('word_meanings')}</h3>
                              {(readingLookup.data.meanings || []).length ? (readingLookup.data.meanings || []).slice(0, 4).map((meaning, index) => (
                                <div key={`${meaning.part_of_speech}-${index}`} className="mt-2 text-sm leading-6">
                                  {meaning.part_of_speech ? <span className="font-bold text-indigo-500">{meaning.part_of_speech}: </span> : null}
                                  <span dir="ltr">{meaning.definition}</span>
                                  {meaning.example ? <p className="mt-1 opacity-75" dir="ltr">“{meaning.example}”</p> : null}
                                </div>
                              )) : <p className="mt-2 text-sm opacity-70">{readingLookup.data.definition}</p>}
                            </section>
                          </div>
                        )}
                        {readingLookup.term && ['synonyms', 'antonyms', 'collocations'].map((key) => {
                          const items = readingLookup.data[key] || []
                          if (!items.length) return null
                          return <section key={key} className="space-y-2">
                            <h3 className="font-extrabold">{t(key === 'synonyms' ? 'word_synonyms' : key === 'antonyms' ? 'word_antonyms' : 'word_collocations')}</h3>
                            <div className="flex flex-wrap gap-2">
                              {items.map((item) => (
                                // eslint-disable-next-line react-hooks/refs -- This callback only runs after a user click.
                                <button key={item} type="button" onClick={() => { void handleWordClick(item) }} className={`rounded-full border px-3 py-2 text-sm font-semibold transition hover:border-indigo-500 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} dir="ltr">{item}</button>
                              ))}
                            </div>
                          </section>
                        })}
                        <section className="space-y-2">
                          <h3 className="font-extrabold">{t('reading_sentence_translation')}</h3>
                          <p className={`rounded-xl border p-3 text-sm leading-7 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`} dir="ltr">{readingLookup.sentence}</p>
                          {readingLookup.data.sentence_translation ? <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm leading-7" dir="rtl">{readingLookup.data.sentence_translation}</p> : <p className="text-sm text-amber-500">{t('reading_translation_unavailable')}</p>}
                        </section>
                        {(readingLookup.data.example || readingLookup.data.example_translation) && (
                          <section className="space-y-2">
                            <h3 className="font-extrabold">{t('reading_another_example')}</h3>
                            {readingLookup.data.example && <p className="text-sm leading-6" dir="ltr">{readingLookup.data.example}</p>}
                            {readingLookup.data.example_translation && <p className="text-sm leading-6 opacity-80" dir="rtl">{readingLookup.data.example_translation}</p>}
                          </section>
                        )}
                        {readingLookup.data.related_phrases?.length > 0 && (
                          <section>
                            <h3 className="mb-2 font-extrabold">{t('reading_useful_phrases')}</h3>
                            <div className="flex flex-wrap gap-2">
                              {readingLookup.data.related_phrases.map((phrase) => (
                                <button key={phrase.phrase} disabled={readingLookupBusy || readingLookupSavingTerm === readingLookup.term} onClick={() => handleWordClick(phrase.phrase, readingLookup.sentence)} className={`rounded-full border px-3 py-2 text-left text-sm transition hover:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-indigo-50'}`}>
                                  <span className="font-bold" dir="ltr">{phrase.phrase}</span><span className="mx-2 opacity-60">·</span><span dir="rtl">{phrase.translation}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        )}
                        <div className="flex flex-wrap items-center gap-3 border-t border-gray-200/20 pt-4">
                          {readingLookup.term && <button onClick={saveLookupWord} disabled={readingLookupBusy || readingLookupSavingTerm === readingLookup.term || readingLookupSaved || !readingLookup.data?.translation} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{readingLookupSaved ? `✓ ${t('reading_saved')}` : readingLookupSavingTerm === readingLookup.term ? t('reading_saving') : t('reading_save_word')}</button>}
                          <button onClick={closeReadingLookup} className={`rounded-xl border px-5 py-3 text-sm font-bold ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>{t('close')}</button>
                        </div>
                      </>
                    )}
                    {readingLookupError && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-500">{readingLookupError}</p>}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'reading' && (
              <div className="space-y-5">
                <section className={`overflow-hidden rounded-3xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 px-6 py-6 text-white sm:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">{t('story_mode_eyebrow')}</p>
                        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{t('story_mode_title')}</h2>
                        <p className="mt-2 max-w-2xl text-sm text-indigo-100">{t('story_mode_desc')}</p>
                      </div>
                      {activeStory && <button onClick={resetInteractiveStory} className="rounded-xl border border-white/40 px-4 py-2 text-sm font-bold hover:bg-white/10">{t('story_back_to_library')}</button>}
                    </div>
                  </div>
                  {activeStory && activeStoryNode ? (
                    <div className="space-y-5 p-5 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-extrabold">{activeStory.title}</h3>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{activeStory.level} · {t(`story_genre_${activeStory.genre}`)} · {t('story_minutes', { count: activeStory.estimated_minutes })}</p>
                        </div>
                        <button onClick={() => startInteractiveStory(activeStory)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>{t('story_restart')}</button>
                      </div>
                      <div>
                        <div className={`mb-2 flex justify-between text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}><span>{t('story_progress')}</span><span>{storyProgressPercent}%</span></div>
                        <div className={`h-2 overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${storyProgressPercent}%` }} /></div>
                      </div>
                      <article className={`rounded-2xl border p-5 sm:p-6 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-indigo-100 bg-indigo-50/40'}`}>
                        <InteractiveText text={activeStoryNode.text} onWordClick={handleWordClick} onSentenceClick={handleSentenceClick} darkMode={darkMode} />
                      </article>
                      {activeStoryNode.ending ? (
                        <div className={`rounded-2xl border p-5 ${darkMode ? 'border-emerald-900 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50'}`}>
                          <p className="font-extrabold text-emerald-600">{t('story_the_end')}</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('story_ending_desc')}</p>
                          <button onClick={resetInteractiveStory} className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">{t('story_choose_another')}</button>
                        </div>
                      ) : (
                        <>
                          {activeStoryNode.question && (
                            <div className={`rounded-2xl border p-5 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-500">{t('story_comprehension_check')}</p>
                              <h4 className="mb-4 text-lg font-extrabold">{activeStoryNode.question.prompt}</h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {activeStoryNode.question.options.map((option, index) => (
                                  <button key={option} onClick={() => { setStorySelectedOption(String(index)); setStoryAnswerFeedback(null) }} className={`rounded-xl border p-3 text-left text-sm transition-colors ${storySelectedOption === String(index) ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`} aria-pressed={storySelectedOption === String(index)}>
                                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{String.fromCharCode(65 + index)}</span>{option}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button onClick={submitStoryAnswer} disabled={storySelectedOption === '' || storyAnswerBusy} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{storyAnswerBusy ? t('story_checking') : t('story_check_answer')}</button>
                                {storyAnswerFeedback && (
                                  <p role="status" className={`text-sm font-semibold ${storyAnswerFeedback.correct ? 'text-emerald-500' : 'text-amber-500'}`}>{storyAnswerFeedback.correct ? t('story_answer_correct') : t('story_answer_incorrect')} {storyAnswerFeedback.explanation}</p>
                                )}
                                {storyError && <p role="alert" className="text-sm font-semibold text-red-500">{storyError}</p>}
                              </div>
                            </div>
                          )}
                          {(!activeStoryNode.question || storyAnswerFeedback?.correct) && activeStoryNode.choices?.length > 0 && (
                            <div>
                              <h4 className="mb-3 font-extrabold">{t('story_what_next')}</h4>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {activeStoryNode.choices.map((choice) => (
                                  <button key={choice.next_node} onClick={() => chooseStoryPath(choice.next_node)} className={`rounded-2xl border p-4 text-left font-bold transition hover:-translate-y-0.5 hover:border-indigo-400 ${darkMode ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-200 bg-white hover:bg-indigo-50'}`}>
                                    <span className="mr-2 text-indigo-500">↗</span>{choice.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-8">
                      {interactiveStories.map((story) => (
                        <article key={story.id} className={`flex flex-col rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-700">{story.level}</span>
                            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('story_minutes', { count: story.estimated_minutes })}</span>
                          </div>
                          <h3 className="text-lg font-extrabold">{story.title}</h3>
                          <p className={`mt-2 flex-grow text-sm leading-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{story.description}</p>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">{t(`story_genre_${story.genre}`)}</span>
                            <button onClick={() => startInteractiveStory(story)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">{t('story_start')}</button>
                          </div>
                        </article>
                      ))}
                      {interactiveStories.length === 0 && <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('story_loading_empty')}</p>}
                    </div>
                  )}
                </section>
                <div className={`grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <input value={readingQuery} onChange={(event) => setReadingQuery(event.target.value)} placeholder={t('search_articles')} className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                  <select value={readingLevel} onChange={(event) => setReadingLevel(event.target.value)} aria-label={t('filter_by_level')} className={`rounded-xl border px-3 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option value="all">{t('all_levels')}</option><option value="A1">A1</option><option value="B1">B1</option><option value="C1">C1</option>
                  </select>
                </div>
                {filteredArticles.length === 0 ? <EmptyState message={t('no_articles')} darkMode={darkMode} /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article) => (
                    <article key={article.id} className={`rounded-2xl shadow-sm border flex flex-col overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="h-2 bg-indigo-500"></div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{article.title}</h2>
                          <span className="shrink-0 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{article.level}</span>
                        </div>
                        <div className="mb-6 flex-grow text-sm">
                          <InteractiveText text={article.content} onWordClick={handleWordClick} onSentenceClick={handleSentenceClick} darkMode={darkMode} />
                        </div>
                        <div className="mt-auto border-t pt-4 dark:border-gray-700">
                          {readingProgress.some((item) => item.article_id === article.id && item.completed) ? (
                            <button onClick={() => markArticleRead(article.id, false)} className="w-full rounded-xl border border-green-500 px-4 py-2 text-sm font-bold text-green-600">{t('mark_unread')}</button>
                          ) : (
                            <button onClick={() => markArticleRead(article.id, true)} className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">{t('mark_read')}</button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'vocabulary' && (
              <div className="space-y-5">
                <section className={`relative overflow-hidden p-5 md:p-7 rounded-3xl border ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 border-indigo-900' : 'bg-gradient-to-br from-white via-indigo-50 to-violet-100 border-indigo-100'}`}>
                  <div className="absolute -top-10 -right-8 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-extrabold tracking-wide text-indigo-500 mb-3">
                        <span aria-hidden="true">✦</span> {t('flashcards_badge')}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black">{t('flashcards_title')}</h3>
                      <p className={`text-sm mt-2 leading-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('spaced_review_desc')}</p>
                    </div>
                    <div className={`min-w-28 rounded-2xl border p-4 text-center ${darkMode ? 'border-indigo-800 bg-gray-900/70' : 'border-indigo-200 bg-white/80'}`}>
                      <div className="text-3xl font-black text-indigo-500 tabular-nums">{dueReviewCount}</div>
                      <div className={`mt-1 text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('due_today')}</div>
                    </div>
                  </div>
                  <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[t('flashcard_step_reveal'), t('flashcard_step_rate'), t('flashcard_step_repeat')].map((step, index) => (
                      <div key={step} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-gray-900/60 text-gray-200' : 'bg-white/70 text-gray-700'}`}>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-black text-indigo-500">{index + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  {activeReviewWord ? (
                    <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h4 className="text-2xl font-black" dir="ltr">{activeReviewWord.english_word}</h4>
                        <button type="button" onClick={speakReviewWord} className="rounded-lg border px-3 py-2 text-sm font-bold hover:border-indigo-500" aria-label={t('listen_word')}>🔊 {t('listen_word')}</button>
                      </div>
                      {!reviewAnswerVisible ? (
                        <button type="button" onClick={() => setReviewAnswerVisible(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2">{t('reveal_answer')}</button>
                      ) : (
                        <>
                          <p className="text-indigo-500 font-bold mb-3">{activeReviewWord.translation || t('translation_missing')}</p>
                          {activeReviewWord.example ? <p className={`mb-4 rounded-lg border px-3 py-2 text-sm leading-6 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} dir="ltr">{activeReviewWord.example}</p> : null}
                          <div className="flex flex-wrap gap-3">
                            <button type="button" disabled={reviewBusy} onClick={() => submitWordReview('easy')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 disabled:opacity-50">{t('review_easy')}</button>
                            <button type="button" disabled={reviewBusy} onClick={() => submitWordReview('hard')} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 disabled:opacity-50">{t('review_hard')}</button>
                            <button type="button" disabled={reviewBusy} onClick={() => submitWordReview('forgot')} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 disabled:opacity-50">{t('forgot')}</button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{dueReviewCount > 0 ? t('due_words_ready') : t('review_complete')}</p>
                      <button type="button" disabled={reviewBusy} onClick={beginDailyReview} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 shadow-lg shadow-indigo-600/20 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                        <span aria-hidden="true">▶</span> {dueReviewCount > 0 ? t('start_flashcards') : t('refresh_review_queue')}
                      </button>
                    </div>
                  )}
                </section>
                <section aria-labelledby="thematic-vocabulary-title" className={`rounded-3xl border p-4 md:p-6 space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 id="thematic-vocabulary-title" className="text-xl font-black">{i18n.language === 'fa' ? 'مجموعه‌های موضوعی لغات' : 'Thematic vocabulary collections'}</h3>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{i18n.language === 'fa' ? 'با توجه به هدف خود یک مجموعه انتخاب کن و واژه‌ها را در بافت مرتبط یاد بگیر.' : 'Choose a collection for your goal and learn words in a useful context.'}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedVocabularySet('all')} aria-pressed={selectedVocabularySet === 'all'} className={`rounded-xl border px-3 py-2 text-sm font-bold ${selectedVocabularySet === 'all' ? 'border-indigo-500 bg-indigo-600 text-white' : darkMode ? 'border-gray-600' : 'border-gray-200'}`}>{i18n.language === 'fa' ? 'همهٔ واژه‌ها' : 'All words'}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {THEMATIC_VOCABULARY_SETS.map((set) => {
                      const selected = selectedVocabularySet === set.id
                      const savedCount = set.words.filter(([term]) => personalWords.some((word) => word.english_word.toLowerCase() === term.toLowerCase())).length
                      return <button key={set.id} type="button" onClick={() => { setSelectedVocabularySet(set.id); setVocabQuery(''); setVocabLevel('all') }} aria-pressed={selected} className={`text-left rounded-2xl border p-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${selected ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' : darkMode ? 'border-gray-700 hover:border-indigo-700 bg-gray-900/30' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-2xl" aria-hidden="true">{set.icon}</span>
                          <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-500">{set.words.length} {i18n.language === 'fa' ? 'واژه' : 'words'}</span>
                        </div>
                        <h4 className="mt-3 font-extrabold">{set.title[i18n.language === 'fa' ? 'fa' : 'en']}</h4>
                        <p className={`mt-1 text-sm leading-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{set.description[i18n.language === 'fa' ? 'fa' : 'en']}</p>
                        <p className="mt-3 text-xs font-bold text-indigo-500">{savedCount} {i18n.language === 'fa' ? 'ذخیره‌شده در واژه‌های من' : 'already saved'}</p>
                      </button>
                    })}
                  </div>
                </section>
                <div className={`grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <input value={vocabQuery} onChange={(event) => setVocabQuery(event.target.value)} placeholder={t('search_words')} className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                  <select value={vocabLevel} onChange={(event) => setVocabLevel(event.target.value)} aria-label={t('filter_by_level')} className={`rounded-xl border px-3 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option value="all">{t('all_levels')}</option><option value="A1">A1</option><option value="B1">B1</option><option value="C1">C1</option>
                  </select>
                </div>
                {selectedVocabularyWord && (
                  <section className={`rounded-3xl border p-5 md:p-7 space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100 shadow-sm'}`} aria-labelledby="vocabulary-detail-title">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">{i18n.language === 'fa' ? 'راهنمای کامل واژه' : 'WORD LEARNING GUIDE'}</p>
                        <h2 id="vocabulary-detail-title" className="mt-1 text-3xl font-black" dir="ltr">{selectedVocabularyWord.english_word}</h2>
                        <p className="mt-2 text-indigo-500 font-bold">{selectedVocabularyWord.translation || (i18n.language === 'fa' ? 'معنی ثبت نشده' : 'No saved translation')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-bold text-indigo-500">{selectedVocabularyWord.level || 'B1'} · {i18n.language === 'fa' ? 'سطح تقریبی CEFR' : 'estimated CEFR'}</span>
                        <button type="button" onClick={() => speakVocabularyWord(selectedVocabularyWord)} className="rounded-xl border px-3 py-2 font-bold hover:border-indigo-500" aria-label={i18n.language === 'fa' ? 'شنیدن تلفظ واژه' : 'Listen to pronunciation'}>🔊 {i18n.language === 'fa' ? 'تلفظ' : 'Listen'}</button>
                        <button type="button" onClick={() => { setSelectedVocabularyWord(null); setVocabularyDictionary(null); setVocabularyDictionaryError(''); setVocabularyDictionaryLoading(false); setVocabularyRelatedWords({ synonyms: [], antonyms: [], collocations: [] }); setVocabularyExampleTranslations({}) }} className="rounded-xl border px-3 py-2 font-bold" aria-label={i18n.language === 'fa' ? 'بستن راهنمای واژه' : 'Close word guide'}>✕</button>
                      </div>
                    </div>
                    <p className={`rounded-xl p-3 text-sm ${darkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-indigo-50 text-gray-700'}`}>{i18n.language === 'fa' ? 'راهنمای تلفظ: روی دکمهٔ «تلفظ» بزنید. تلفظ صوتی از صدای انگلیسی مرورگر استفاده می‌کند و ممکن است به پشتیبانی مرورگر وابسته باشد.' : 'Pronunciation: select Listen to hear the word using your browser’s English voice. Available voices depend on your device and browser.'}</p>
                    {vocabularyDictionaryLoading && <p role="status" className="text-sm text-gray-500">{i18n.language === 'fa' ? 'در حال دریافت معنی‌ها و مثال‌ها…' : 'Loading meanings and examples…'}</p>}
                    {vocabularyDictionaryError && <p role="status" className="text-sm text-amber-600">{vocabularyDictionaryError}</p>}
                    {vocabularyDictionary?.phonetics?.some((item) => item.text) && (
                      <p className="text-sm" dir="ltr"><strong>{i18n.language === 'fa' ? 'آوانویسی:' : 'Phonetic:'}</strong> {vocabularyDictionary.phonetics.filter((item) => item.text).map((item) => item.text).join(' · ')}</p>
                    )}
                    <div className="space-y-3">
                      <h3 className="text-lg font-extrabold">{i18n.language === 'fa' ? 'معنی‌ها در بافت‌های مختلف' : 'Meanings in different contexts'}</h3>
                      {vocabularyDictionary?.meanings?.length ? vocabularyDictionary.meanings.map((meaning, index) => (
                        <div key={`${meaning.partOfSpeech}-${index}`} className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
                          <p className="font-bold text-indigo-500">{meaning.partOfSpeech}</p>
                          <ul className="mt-2 list-disc space-y-2 pl-5" dir="ltr">
                            {(meaning.definitions || []).map((definition, definitionIndex) => (
                              <li key={definitionIndex}>
                                <p>{definition.definition}</p>
                                {i18n.language === 'fa' && vocabularyExampleTranslations[definition.definition] && <p className="mt-1 text-sm text-indigo-500" dir="rtl">{vocabularyExampleTranslations[definition.definition]}</p>}
                                {definition.example && <p className="mt-1 text-sm text-gray-500">{definition.example}</p>}
                                {definition.example && vocabularyExampleTranslations[definition.example] && <p className="text-sm text-indigo-500" dir="rtl">{vocabularyExampleTranslations[definition.example]}</p>}
                              </li>
                            ))}
                          </ul>
                          {meaning.synonyms?.length > 0 && <p className="mt-3 text-sm"><strong>{i18n.language === 'fa' ? 'مترادف‌ها:' : 'Synonyms:'}</strong> {meaning.synonyms.join(', ')}</p>}
                          {meaning.antonyms?.length > 0 && <p className="mt-1 text-sm"><strong>{i18n.language === 'fa' ? 'متضادها:' : 'Antonyms:'}</strong> {meaning.antonyms.join(', ')}</p>}
                        </div>
                      )) : (
                        <div className="space-y-2 text-sm text-gray-500">
                          <p>{selectedVocabularyWord.translation || (i18n.language === 'fa' ? 'برای این واژه معنی ذخیره‌شده‌ای وجود ندارد.' : 'No saved translation is available for this word.')}</p>
                          {selectedVocabularyWord.example && <p dir="ltr">{selectedVocabularyWord.example}</p>}
                          <p>{i18n.language === 'fa' ? 'برای جلوگیری از نمایش معنی ساختگی، فقط معنی ذخیره‌شده نشان داده می‌شود؛ با پاسخ‌گویی منبع آنلاین، تعریف‌های تکمیلی بارگذاری می‌شوند.' : 'To avoid inventing definitions, only saved vocabulary data is shown until an online dictionary source responds.'}</p>
                        </div>
                      )}
                    </div>
                    <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <h3 className="font-extrabold">{i18n.language === 'fa' ? 'مثال و ترکیب‌های رایج' : 'Example and common collocations'}</h3>
                      {selectedVocabularyWord.example && <p className="mt-2" dir="ltr">{selectedVocabularyWord.example}</p>}
                      {vocabularyDictionary?.meanings?.flatMap((meaning) => meaning.definitions || []).find((definition) => definition.example)?.example && (
                        <p className="mt-2" dir="ltr">{vocabularyDictionary.meanings.flatMap((meaning) => meaning.definitions || []).find((definition) => definition.example).example}</p>
                      )}
                      <h4 className="mt-4 font-bold">{i18n.language === 'fa' ? 'مترادف‌ها و متضادها' : 'Synonyms and antonyms'}</h4>
                      {((vocabularyRelatedWords.synonyms || []).length || (vocabularyRelatedWords.antonyms || []).length || (vocabularyDictionary?.meanings || []).some((meaning) => meaning.synonyms?.length || meaning.antonyms?.length)) ? (
                        <div className="mt-2 space-y-2 text-sm">
                          {(() => {
                            const synonyms = [...new Set([...(vocabularyRelatedWords.synonyms || []), ...(vocabularyDictionary?.meanings || []).flatMap((meaning) => meaning.synonyms || [])])].filter((item) => item.toLowerCase() !== selectedVocabularyWord.english_word.toLowerCase()).slice(0, 12)
                            const antonyms = [...new Set([...(vocabularyRelatedWords.antonyms || []), ...(vocabularyDictionary?.meanings || []).flatMap((meaning) => meaning.antonyms || [])])].filter((item) => item.toLowerCase() !== selectedVocabularyWord.english_word.toLowerCase()).slice(0, 12)
                            return <>{synonyms.length > 0 && <p><strong>{i18n.language === 'fa' ? 'مترادف‌ها:' : 'Synonyms:'}</strong> {synonyms.join(', ')}</p>}{antonyms.length > 0 && <p><strong>{i18n.language === 'fa' ? 'متضادها:' : 'Antonyms:'}</strong> {antonyms.join(', ')}</p>}</>
                          })()}
                        </div>
                      ) : <p className="mt-1 text-sm text-gray-500">{i18n.language === 'fa' ? 'منابع آنلاین برای این واژه مترادف یا متضاد قابل اتکایی برنگرداندند.' : 'The available sources did not return reliable synonyms or antonyms for this word.'}</p>}
                      <h4 className="mt-4 font-bold">{i18n.language === 'fa' ? 'عبارت‌های مرتبط پرتکرار' : 'Frequently associated phrases'}</h4>
                      {vocabularyRelatedWords.collocations?.length ? (
                        <p className="mt-1 text-sm" dir="ltr">{vocabularyRelatedWords.collocations.join(' · ')}</p>
                      ) : <p className="mt-1 text-sm text-gray-500">{i18n.language === 'fa' ? 'برای این واژه عبارت پرتکرار قابل اتکایی پیدا نشد؛ مثال‌های بالا کاربرد واژه را در جمله نشان می‌دهند.' : 'No reliable associated phrases were found; the examples above show the word in context.'}</p>}
                      <p className="mt-2 text-xs text-gray-500">{i18n.language === 'fa' ? 'تعریف‌ها و روابط واژه از فرهنگ لغت آزاد و Datamuse دریافت می‌شوند؛ عبارت‌های مرتبط آماری‌اند و لزوماً ترکیب دستوری ثابت نیستند.' : 'Definitions and word relations come from the Free Dictionary and Datamuse. Associated phrases are statistical suggestions, not guaranteed fixed collocations.'}</p>
                    </div>
                  </section>
                )}
                {vocabularyItems.length === 0 ? <EmptyState message={t('no_words')} darkMode={darkMode} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vocabularyItems.map((word) => (
                    <div key={word.key} className={`rounded-2xl shadow-sm p-6 border flex flex-col relative overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -z-10 ${darkMode ? 'bg-indigo-950/50' : 'bg-indigo-50'}`}></div>
                      
                      <div className="flex justify-between items-start mb-1">
                        <button type="button" onClick={() => { if (selectedVocabularyWord?.english_word !== word.english_word) { setVocabularyDictionary(null); setVocabularyDictionaryError(''); setVocabularyDictionaryLoading(true); setVocabularyRelatedWords({ synonyms: [], antonyms: [], collocations: [] }); setVocabularyExampleTranslations({}); setSelectedVocabularyWord(word) } window.scrollTo({ top: 0, behavior: 'smooth' }) }} className={`text-left text-2xl font-black tracking-tight underline-offset-4 hover:text-indigo-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${darkMode ? 'text-white' : 'text-gray-800'}`} aria-label={`${i18n.language === 'fa' ? 'نمایش راهنمای واژه' : 'Open word guide'}: ${word.english_word}`}>{word.english_word}</button>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                          {word.level || 'B1'}
                        </span>
                      </div>
                      
                      {word.isPersonal ? (
                        <input aria-label={t('translation')} defaultValue={word.translation} onBlur={(event) => { if (event.target.value !== word.translation) updateWordTranslation(word, event.target.value) }} placeholder={t('add_translation')} className={`w-full rounded-lg border px-3 py-2 text-sm text-indigo-500 mb-6 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                      ) : <p className="text-indigo-500 font-bold mb-6">{word.translation}</p>}
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-gray-400">{t('mastery')}</span>
                          <span className="text-indigo-500">{word.proficiency || 0}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2.5 mb-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${word.proficiency || 0}%` }}
                          ></div>
                        </div>
                        
                        {word.isPersonal ? (
                          <div className="flex gap-2">
                            <button onClick={() => startWordReview(word)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">{t('review')}</button>
                            <button onClick={() => deletePersonalWord(word)} aria-label={t('delete_word')} className="px-3 py-2 rounded-xl border border-red-300 text-red-500">{t('delete')}</button>
                          </div>
                        ) : (
                          <button onClick={() => saveCuratedWord(word)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">{t('save_to_my_words')}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'writing' && (
              <div className="space-y-8">
                <div className={`p-6 rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('writing_prompt')}
                  </h3>
                  <div className={`rounded-xl p-4 mb-4 border ${darkMode ? 'bg-indigo-950/40 border-indigo-900' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className="text-sm font-semibold">{t(goalPromptKey)}</p>
                    <p className={`mt-2 text-xs ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{t('writing_prompt_hint')}</p>
                  </div>
                  {writingNotice && (
                    <div role="status" className={`mb-4 rounded-xl border p-3 text-sm ${writingNotice.type === 'success' ? (darkMode ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800') : writingNotice.type === 'error' ? (darkMode ? 'border-rose-800 bg-rose-950/40 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800') : (darkMode ? 'border-amber-800 bg-amber-950/40 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800')}`}
                      <div className="flex items-start justify-between gap-3">
                        <span>{t(writingNotice.key)}</span>
                        <button type="button" onClick={() => setWritingNotice(null)} className="shrink-0 font-bold opacity-70 hover:opacity-100" aria-label={t('dismiss_notice')}>×</button>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleWritingSubmit} className="space-y-4">
                    <textarea 
                      rows="4" 
                      value={writingText}
                      onChange={(e) => { setWritingText(e.target.value); if (writingNotice) setWritingNotice(null); }}
                      placeholder={t('writing_placeholder')}
                      className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      dir="ltr"
                      required
                    ></textarea>
                    <div className={`flex flex-wrap items-center justify-between gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{t('writing_word_count', { count: writingText.trim() ? writingText.trim().split(/\s+/).length : 0 })}</span>
                      <span>{t('writing_character_count', { count: writingText.length })}</span>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submittingWriting}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      {submittingWriting ? t('analyzing') : t('analyze_with_ai')}
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {t('writing_history')}
                    </h3>
                    <button
                      type="button"
                      onClick={handleDeleteWritingHistory}
                      disabled={writings.length === 0}
                      className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      {t('delete_writing_history')}
                    </button>
                  </div>
                  
                  {writings.length === 0 ? (
                    <EmptyState message={t('no_writings')} darkMode={darkMode} />
                  ) : (
                    writings.map((item) => (
                      <div key={item.id} className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="block text-xs text-gray-400 font-bold">{new Date(item.created_at).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${item.corrected_text ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                              <span aria-hidden="true">{item.corrected_text ? '✓' : '!'}</span>{item.corrected_text ? t('writing_status_corrected') : t('writing_status_saved_only')}
                            </span>
                          </div>
                          {item.score !== null && item.score !== undefined && (
                            <div className="min-w-32 text-end">
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">{t('score_value', { score: item.score })}</span>
                              <div className={`mt-2 h-2 overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} role="progressbar" aria-label={t('writing_score')} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, Number(item.score) || 0))}>
                                <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.max(0, Math.min(100, Number(item.score) || 0))}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="block text-xs font-bold text-gray-400 mb-1">{t('original_text')}:</span>
                            <p className="font-medium text-justify" dir="ltr">{item.original_text}</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50/50 border-indigo-100'}`}>
                            <span className="block text-xs font-bold text-indigo-500 mb-1">{t('corrected_text')}:</span>
                            {item.corrected_text ? <p className="font-medium text-justify text-indigo-600 dark:text-indigo-300" dir="ltr">{item.corrected_text}</p> : <p className="text-sm text-amber-600">{t('correction_unavailable')}</p>}
                          </div>
                        </div>
                        {item.feedback && <div className={`rounded-2xl border p-4 text-sm ${darkMode ? 'border-sky-900 bg-sky-950/30 text-sky-100' : 'border-sky-100 bg-sky-50 text-sky-950'}`}><div className="mb-2 flex items-center gap-2 font-bold"><span aria-hidden="true">💡</span>{t('feedback')}</div><p className="leading-7">{item.feedback}</p></div>}
                        {Array.isArray(item.mistakes) && item.mistakes.length > 0 && (
                          <section className={`rounded-2xl border p-4 ${darkMode ? 'border-rose-900/70 bg-gray-900/40' : 'border-rose-100 bg-rose-50/50'}`} aria-label={t('writing_issues')}>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <h4 className={`font-bold ${darkMode ? 'text-rose-200' : 'text-rose-800'}`}>{t('writing_issues')}</h4>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${darkMode ? 'bg-rose-950 text-rose-200' : 'bg-white text-rose-700'}`}>{t('writing_issue_count', { count: item.mistakes.length })}</span>
                            </div>
                            <div className="space-y-3">
                              {item.mistakes.map((mistake, index) => (
                                <article key={`${item.id}-mistake-${index}`} className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-rose-100 bg-white'}`}>
                                  <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${darkMode ? 'bg-rose-950 text-rose-200' : 'bg-rose-100 text-rose-700'}`}>{index + 1}</span>
                                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{t(`writing_category_${mistake.category || 'other'}`, { defaultValue: t('writing_category_other') })}</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className={`rounded-lg p-3 ${darkMode ? 'bg-rose-950/30' : 'bg-rose-50'}`}>
                                      <span className="mb-1 block text-xs font-bold text-rose-500">{t('writing_original_phrase')}</span>
                                      <p className="font-medium leading-6 text-gray-800 dark:text-gray-100" dir="ltr">{mistake.original}</p>
                                    </div>
                                    <div className={`rounded-lg p-3 ${darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50'}`}>
                                      <span className="mb-1 block text-xs font-bold text-emerald-600">{t('writing_better_phrase')}</span>
                                      <p className="font-medium leading-6 text-gray-800 dark:text-gray-100" dir="ltr">{mistake.correction}</p>
                                    </div>
                                  </div>
                                  <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{mistake.explanation}</p>
                                </article>
                              ))}
                            </div>
                          </section>
                        )}
                        {item.corrected_text && Array.isArray(item.mistakes) && item.mistakes.length === 0 && <div className={`rounded-xl border p-3 text-sm ${darkMode ? 'border-emerald-900 bg-emerald-950/30 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>✓ {t('writing_no_issues')}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'conversation' && <MistakeNotebook darkMode={darkMode} />}

            {activeTab === 'quiz' && (
              <div className="max-w-2xl mx-auto space-y-6">
                {!quizQuestions.length && !quizSubmitted && (
                  <div className={`p-8 rounded-3xl shadow-sm border text-center space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="text-5xl" aria-hidden="true">🎯</div>
                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('ready_quiz')}</h3>
                    <p className="text-gray-500 text-sm">{t('quiz_intro')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_type_setting')}</span>
                        <select value={quizType} onChange={(event) => { setQuizType(event.target.value); if (event.target.value === 'mixed') setQuizAdaptiveMode(false) }} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          {['vocabulary', 'reading', 'grammar', 'mixed'].map((type) => <option key={type} value={type}>{t(`quiz_${type}`)}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_level_setting')}</span>
                        <select value={quizLevel} onChange={(event) => setQuizLevel(event.target.value)} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          <option value="A1">A1 · {t('level_beginner')}</option>
                          <option value="A2">A2 · {t('level_elementary')}</option>
                          <option value="B1">B1 · {t('level_intermediate')}</option>
                          <option value="B2">B2 · {t('level_upper_intermediate')}</option>
                          <option value="C1">C1 · {t('level_advanced')}</option>
                          <option value="C2">C2 · {t('level_proficient')}</option>
                          <option value="all">{t('all_levels')}</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_count_setting')}</span>
                        <select value={quizQuestionCount} onChange={(event) => setQuizQuestionCount(Number(event.target.value))} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          {[5, 10, 15, 20, 30].map((count) => <option key={count} value={count}>{count}</option>)}
                          <option value={0}>{t('custom_count')}</option>
                        </select>
                      </label>
                      {quizQuestionCount === 0 && (
                        <label className="space-y-2 text-sm font-semibold">
                          <span>{t('custom_count')} (1–30)</span>
                          <input type="number" min="1" max="30" value={quizCustomQuestionCount} onChange={(event) => setQuizCustomQuestionCount(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                        </label>
                      )}
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_difficulty_setting')}</span>
                        <select value={quizDifficulty} onChange={(event) => setQuizDifficulty(event.target.value)} disabled={loadingQuiz || quizAdaptiveMode} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          {['all', 'easy', 'medium', 'hard'].map((difficulty) => <option key={difficulty} value={difficulty}>{t(`difficulty_${difficulty}`)}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_timer_setting')}</span>
                        <select value={quizTimerMode} onChange={(event) => setQuizTimerMode(event.target.value)} disabled={loadingQuiz || quizAdaptiveMode} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          <option value="none">{t('timer_none')}</option>
                          <option value="total">{t('timer_total')}</option>
                          <option value="per-question">{t('timer_per_question')}</option>
                        </select>
                      </label>
                      {quizTimerMode === 'total' && (
                        <label className="space-y-2 text-sm font-semibold">
                          <span>{t('quiz_total_duration')}</span>
                          <select value={quizTotalDuration} onChange={(event) => setQuizTotalDuration(Number(event.target.value))} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                            {[300, 600, 900, 1800].map((seconds) => <option key={seconds} value={seconds}>{seconds / 60} {t('minutes')}</option>)}
                          </select>
                        </label>
                      )}
                      {quizTimerMode === 'per-question' && (
                        <label className="space-y-2 text-sm font-semibold">
                          <span>{t('quiz_question_duration')}</span>
                          <select value={quizPerQuestionDuration} onChange={(event) => setQuizPerQuestionDuration(Number(event.target.value))} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                            {[15, 30, 60].map((seconds) => <option key={seconds} value={seconds}>{seconds} {t('seconds')}</option>)}
                          </select>
                        </label>
                      )}
                      <label className="space-y-2 text-sm font-semibold">
                        <span>{t('quiz_answer_mode')}</span>
                        <select value={quizAnswerMode} onChange={(event) => setQuizAnswerMode(event.target.value)} disabled={loadingQuiz} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                          <option value="end">{t('answers_at_end')}</option>
                          <option value="each">{t('answers_after_each')}</option>
                        </select>
                      </label>
                    </div>
                    <label className={`inline-flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${darkMode ? 'border-gray-700 bg-gray-900/40 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                      <input type="checkbox" checked={quizShuffle} onChange={(event) => setQuizShuffle(event.target.checked)} disabled={loadingQuiz} className="h-4 w-4 accent-indigo-600" />
                      {t('quiz_shuffle_setting')}
                    </label>
                    <label className={`inline-flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${darkMode ? 'border-indigo-800 bg-indigo-950/30 text-gray-200' : 'border-indigo-200 bg-indigo-50 text-gray-700'}`}>
                      <input type="checkbox" checked={quizAdaptiveMode} onChange={(event) => setQuizAdaptiveMode(event.target.checked)} disabled={loadingQuiz || quizType === 'mixed'} className="mt-0.5 h-4 w-4 accent-indigo-600" />
                      <span className="space-y-1">
                        <span className="block">{t('quiz_adaptive_mode')}</span>
                        <span className="block text-xs font-normal opacity-80">{t('quiz_adaptive_desc')}</span>
                      </span>
                    </label>
                    {quizAdaptiveMode && quizAdaptiveProgress && (
                      <div className={`rounded-xl border p-3 text-sm ${darkMode ? 'border-gray-700 bg-gray-900/40 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                        {t('quiz_adaptive_status', { skill: t(`quiz_${quizAdaptiveProgress.skill}`), difficulty: t(`difficulty_${quizAdaptiveProgress.current_difficulty}`), accuracy: quizAdaptiveProgress.accuracy })}
                      </div>
                    )}
                    <button type="button" onClick={() => startQuiz(quizType)} disabled={loadingQuiz} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm disabled:opacity-50">
                      {loadingQuiz ? t('loading') : t('start_quiz')}
                    </button>
                  </div>
                )}

                {!quizQuestions.length && !quizSubmitted && quizHistory.length > 0 && (
                  <div className={`p-6 rounded-2xl border space-y-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h4 className="font-bold">{t('quiz_history')}</h4>
                    {quizHistory.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between gap-4 border-b last:border-0 border-gray-200 dark:border-gray-700 py-2 text-sm">
                        <span>{t(`quiz_${session.quiz_type}`)} · {session.level || 'B1'} · {new Date(session.created_at).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                        <span className="font-bold text-indigo-500">{session.score}/{session.total_questions} ({session.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                )}

                {quizQuestions.length > 0 && !quizSubmitted && (
                  <div className={`p-6 sm:p-8 rounded-3xl shadow-sm border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex flex-wrap justify-between items-center gap-3 text-xs font-bold text-gray-400">
                      <span>{t('question_counter', { current: currentQuestionIndex + 1, total: quizAdaptiveMode ? quizTargetCount : quizQuestions.length })}</span>
                      <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-indigo-600 dark:text-indigo-300">{quizQuestions[currentQuestionIndex].level}</span>
                      <span className="rounded-lg bg-violet-50 dark:bg-violet-950 px-3 py-1 text-violet-600 dark:text-violet-300">{t(`difficulty_${quizQuestions[currentQuestionIndex].difficulty || 'medium'}`)}</span>
                      {quizTimerMode !== 'none' && (
                        <span role="timer" aria-live="off" className={`rounded-lg px-3 py-1 tabular-nums ${(quizTimerMode === 'total' ? quizTimeLeft : quizQuestionTimeLeft) <= 15 || quizTimeExpired ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                          ⏱ {Math.floor((quizTimerMode === 'total' ? quizTimeLeft : quizQuestionTimeLeft) / 60).toString().padStart(2, '0')}:{((quizTimerMode === 'total' ? quizTimeLeft : quizQuestionTimeLeft) % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {quizAdaptiveMode && quizAdaptiveProgress && (
                      <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-indigo-800 bg-indigo-950/30 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
                        {t('quiz_adaptive_status', { skill: t(`quiz_${quizAdaptiveProgress.skill}`), difficulty: t(`difficulty_${quizAdaptiveProgress.current_difficulty}`), accuracy: quizAdaptiveProgress.accuracy })}
                      </div>
                    )}

                    <div>
                      <div className={`h-2.5 w-full overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} role="progressbar" aria-label={t('quiz_progress')} aria-valuemin={0} aria-valuemax={quizAdaptiveMode ? quizTargetCount : quizQuestions.length} aria-valuenow={currentQuestionIndex + 1}>
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / (quizAdaptiveMode ? quizTargetCount : quizQuestions.length)) * 100}%` }} />
                      </div>
                      <p className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('quiz_answered_count', { answered: Object.keys(quizAnswers).length, total: quizAdaptiveMode ? quizTargetCount : quizQuestions.length })}
                      </p>
                    </div>

                    <h4 className={`text-xl font-bold text-justify ${darkMode ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                      {quizQuestions[currentQuestionIndex].question_text}
                    </h4>

                    <div className="space-y-3" dir="ltr">
                      {['A', 'B', 'C', 'D'].map((optKey) => {
                        const currentQuestion = quizQuestions[currentQuestionIndex]
                        const optText = currentQuestion[`option_${optKey.toLowerCase()}`]
                        if (!optText) return null
                        const selected = quizAnswers[currentQuestion.id] === optKey
                        return (
                          <button
                            type="button"
                            key={optKey}
                            aria-pressed={selected}
                            disabled={quizTimeExpired || loadingQuiz}
                            onClick={() => handleAnswerSelect(currentQuestion.id, optKey)}
                            className={`w-full text-left p-4 rounded-2xl border font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected
                                ? (darkMode ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-500/40 text-white' : 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-900')
                                : (darkMode ? 'bg-gray-700 border-gray-600 hover:bg-indigo-900/50 hover:border-indigo-500 text-white' : 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 text-gray-800')
                            }`}
                          >
                            <span className="inline-block w-8 text-indigo-500">{optKey}.</span> {optText}
                          </button>
                        )
                      })}
                    </div>

                    {(quizAdaptiveMode || quizAnswerMode === 'each') && quizImmediateFeedback[quizQuestions[currentQuestionIndex].id] && (
                      <div role="status" className={`rounded-xl border p-4 text-sm space-y-2 ${quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].is_correct ? (darkMode ? 'border-green-800 bg-green-950/30 text-green-200' : 'border-green-200 bg-green-50 text-green-800') : (darkMode ? 'border-red-800 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}`}>
                        <strong>{quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].is_correct ? t('correct') : t('incorrect')}</strong>
                        <p><span className="font-semibold">{t('correct_answer_label')}:</span> {quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].correct_answer} — {quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].correct_answer_text}</p>
                        <p><span className="font-semibold">{t('explanation')}:</span> {quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].explanation}</p>
                        <div className="rounded-lg border border-current/15 p-3 space-y-1">
                          <p className="font-semibold">{t('learning_example')}</p>
                          <p dir="ltr" className="font-medium">{quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].example_sentence}</p>
                          <p>{t('translation')}: {quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].example_translation}</p>
                        </div>
                        <p><span className="font-semibold">{t('common_mistake')}:</span> {quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].common_mistake}</p>
                        {quizAdaptiveMode && quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].adaptive_progress && (
                          <p className="pt-1 font-semibold">{t('quiz_adaptive_feedback', {
                            difficulty: t(`difficulty_${quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].recommended_next_difficulty}`),
                            topic: quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].recommended_topic ? ` · ${quizImmediateFeedback[quizQuestions[currentQuestionIndex].id].recommended_topic.replaceAll('_', ' ')}` : ` ${t('quiz_general_topic')}`,
                          })}</p>
                        )}
                      </div>
                    )}

                    {quizTimeExpired && (
                      <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-amber-800 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {t('quiz_time_up')}
                        {(Object.keys(quizAnswers).length === 0 || (dailyChallengeMode && Object.keys(quizAnswers).length < quizQuestions.length)) && (
                          <button type="button" onClick={() => { setQuizTimerMode('none'); setQuizTimeExpired(false); setQuizTimeLeft(quizTotalDuration); setQuizQuestionTimeLeft(quizPerQuestionDuration); setQuizError('') }} className="mt-3 block font-bold underline">
                            {t('quiz_continue_untimed')}
                          </button>
                        )}
                      </div>
                    )}

                    {quizNotice && (
                      <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{quizNotice}</p>
                    )}

                    {quizError && (
                      <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {quizError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <button
                        type="button"
                        disabled={quizAdaptiveMode || currentQuestionIndex === 0 || loadingQuiz || quizTimerMode === 'per-question'}
                        onClick={() => { setCurrentQuestionIndex((index) => Math.max(0, index - 1)); setQuizQuestionTimeLeft(quizPerQuestionDuration); setQuizError('') }}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40 ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        {t('quiz_previous_question')}
                      </button>
                      {quizAdaptiveMode ? (
                        quizImmediateFeedback[quizQuestions[currentQuestionIndex].id] ? (
                          quizQuestions.length < quizTargetCount ? (
                            <button type="button" disabled={loadingQuiz} onClick={loadNextAdaptiveQuestion} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                              {loadingQuiz ? t('loading') : t('quiz_next_question')}
                            </button>
                          ) : (
                            <button type="button" disabled={loadingQuiz} onClick={() => submitQuizFinal(quizAnswers)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                              {loadingQuiz ? t('loading') : t('quiz_finish')}
                            </button>
                          )
                        ) : (
                          <span className="text-sm opacity-70">{t('quiz_adaptive_answer_first')}</span>
                        )
                      ) : currentQuestionIndex < quizQuestions.length - 1 && !quizTimeExpired ? (
                        <button
                          type="button"
                          disabled={quizTimeExpired || loadingQuiz}
                          onClick={() => { setCurrentQuestionIndex((index) => Math.min(quizQuestions.length - 1, index + 1)); setQuizQuestionTimeLeft(quizPerQuestionDuration); setQuizError('') }}
                          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {t('quiz_next_question')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={loadingQuiz}
                          onClick={() => submitQuizFinal(quizAnswers, { allowPartial: quizTimeExpired })}
                          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {loadingQuiz ? t('loading') : t('quiz_finish')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {quizSubmitted && quizResult && (
                  <div className={`p-6 sm:p-8 rounded-3xl shadow-sm border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="text-center space-y-4">
                      <div className="text-5xl" aria-hidden="true">{quizResult.percentage >= 80 ? '🏆' : quizResult.percentage >= 50 ? '🎯' : '💪'}</div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('quiz_completed')}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('quiz_answered_count', { answered: quizResult.total, total: quizQuestions.length })}
                      </p>
                      <div className="flex justify-center gap-8 py-2">
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{t('score')}</span>
                          <span className="text-2xl font-black text-indigo-500">{quizResult.score} / {quizResult.total}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{t('percentage')}</span>
                          <span className="text-2xl font-black text-green-500">{quizResult.percentage}%</span>
                        </div>
                      </div>
                    </div>

                    {quizResult.analysis && (
                      <section className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-indigo-50/70 border-indigo-100'}`} aria-labelledby="performance-analysis-title">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 id="performance-analysis-title" className="text-lg font-black">{t('performance_analysis_title')}</h4>
                            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('performance_analysis_subtitle')}</p>
                          </div>
                          <div className="rounded-xl bg-white/80 dark:bg-gray-800 px-4 py-2 text-sm font-bold">
                            ⏱ {t('time_spent')}: {Math.floor((quizResult.analysis.duration_seconds || 0) / 60)}:{String((quizResult.analysis.duration_seconds || 0) % 60).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-xl bg-white/80 dark:bg-gray-800 p-4">
                            <h5 className="font-bold mb-3">💪 {t('performance_strengths')}</h5>
                            {quizResult.analysis.strengths?.length ? (
                              <ul className="space-y-2">{quizResult.analysis.strengths.map((item) => <li key={item.topic} className="flex justify-between gap-3 text-sm"><span>{item.topic}</span><strong className="text-green-600 dark:text-green-400">{item.accuracy}%</strong></li>)}</ul>
                            ) : <p className="text-sm text-gray-500">{t('no_clear_strengths')}</p>}
                          </div>
                          <div className="rounded-xl bg-white/80 dark:bg-gray-800 p-4">
                            <h5 className="font-bold mb-3">🎯 {t('performance_weaknesses')}</h5>
                            {quizResult.analysis.weaknesses?.length ? (
                              <ul className="space-y-2">{quizResult.analysis.weaknesses.map((item) => <li key={item.topic} className="flex justify-between gap-3 text-sm"><span>{item.topic}</span><strong className="text-rose-600 dark:text-rose-400">{item.accuracy}%</strong></li>)}</ul>
                            ) : <p className="text-sm text-gray-500">{t('no_clear_weaknesses')}</p>}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/80 dark:bg-gray-800 p-4 space-y-3">
                          <h5 className="font-bold">🔎 {t('common_mistakes_title')}</h5>
                          {quizResult.analysis.common_mistakes?.length ? (
                            <ul className="space-y-3">{quizResult.analysis.common_mistakes.map((item, index) => <li key={`${item.topic}-${index}`} className="text-sm"><div className="flex justify-between gap-3"><span>{item.mistake}</span><span className="shrink-0 rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 font-bold">{t('quiz_mistake_count', { count: item.count })}</span></div><p className="mt-1 text-xs text-gray-500">{t('topic_label')}: {item.topic}</p></li>)}</ul>
                          ) : <p className="text-sm text-gray-500">{t('no_common_mistakes')}</p>}
                        </div>
                        <div className="rounded-xl bg-white/80 dark:bg-gray-800 p-4 space-y-2">
                          <h5 className="font-bold">📈 {t('comparison_with_previous')}</h5>
                          {(quizResult.analysis.comparison?.previous_quiz_accuracy === null || quizResult.analysis.comparison?.previous_quiz_accuracy === undefined) ? (
                            <p className="text-sm text-gray-500">{t('no_previous_quiz')}</p>
                          ) : (
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                              <span>{t('previous_quiz_accuracy')}: <strong>{quizResult.analysis.comparison.previous_quiz_accuracy}%</strong></span>
                              <span>{t('change_from_previous')}: <strong className={(quizResult.analysis.comparison.change_from_previous_percentage_points || 0) >= 0 ? 'text-green-600' : 'text-rose-600'}>{(quizResult.analysis.comparison.change_from_previous_percentage_points || 0) > 0 ? '+' : ''}{quizResult.analysis.comparison.change_from_previous_percentage_points} {t('percentage_points')}</strong></span>
                            </div>
                          )}
                          {quizResult.analysis.comparison?.average_previous_accuracy != null && <p className="text-sm text-gray-500">{t('previous_average_accuracy')}: {quizResult.analysis.comparison.average_previous_accuracy}% ({quizResult.analysis.comparison.previous_quiz_count} {t('previous_quizzes')})</p>}
                        </div>
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 p-4 space-y-3">
                          <h5 className="font-bold">🧭 {t('next_practice_recommendation')}</h5>
                          <p className="text-sm">{quizResult.analysis.recommended_next_practice?.topic}: {quizResult.analysis.recommended_next_practice?.reason}</p>
                          <button type="button" onClick={() => startQuiz(quizResult.analysis.recommended_next_practice?.quiz_type || 'mixed')} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">{t('start_recommended_practice')}</button>
                        </div>
                      </section>
                    )}

                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('explanations_review')}</h4>
                      {quizResult.details.map((item, idx) => {
                        const sourceQuestion = quizQuestions.find((question) => question.id === item.question_id)
                        const chosenText = sourceQuestion && sourceQuestion[`option_${String(item.user_answer).toLowerCase()}`]
                        const correctText = sourceQuestion && sourceQuestion[`option_${String(item.correct_answer).toLowerCase()}`]
                        return (
                          <div key={item.question_id} className={`p-4 rounded-xl border text-sm space-y-3 ${
                            item.is_correct
                              ? (darkMode ? 'bg-green-950/20 border-green-900/50' : 'bg-green-50 border-green-200')
                              : (darkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200')
                          }`}>
                            <div className="flex flex-wrap justify-between gap-2 font-bold" dir="ltr">
                              <span className={darkMode ? 'text-white' : 'text-gray-800'}>{idx + 1}. {item.question_text}</span>
                              <span className={item.is_correct ? 'text-green-500' : 'text-red-500'}>
                                {item.is_correct ? `✓ ${t('correct')}` : `✗ ${t('correct_was', { answer: item.correct_answer })}`}
                              </span>
                            </div>
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} dir="ltr">
                              <strong>{t('your_answer')}:</strong> {item.user_answer}{chosenText ? ` — ${chosenText}` : ''}
                            </p>
                            <p className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`} dir="ltr">
                              <strong>{t('correct_answer_label')}:</strong> {item.correct_answer} — {item.correct_answer_text || correctText}
                            </p>
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              💡 <span className="font-bold">{t('explanation')}:</span> {item.explanation}
                            </p>
                            <div className={`rounded-lg border p-3 space-y-1 ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-white/70'}`}>
                              <p className="font-bold">{t('learning_example')}</p>
                              <p dir="ltr" className="font-medium">{item.example_sentence}</p>
                              <p>{t('translation')}: {item.example_translation}</p>
                            </div>
                            <p className={`text-xs font-medium ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                              <strong>{t('common_mistake')}:</strong> {item.common_mistake}
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDailyChallengeMode(false)
                          setQuizQuestions([])
                          setQuizSubmitted(false)
                          setQuizResult(null)
                          setCurrentQuestionIndex(0)
                          setQuizAnswers({})
                          setQuizError('')
                          setQuizNotice('')
                          setQuizImmediateFeedback({})
                          setQuizTimeExpired(false)
                          setQuizTimeLeft(quizTotalDuration)
                        }}
                        className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm"
                      >
                        {t('take_another_quiz')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

async function translateEnglishToPersian(text) {
  const source = String(text || '').trim().slice(0, 400)
  if (!source) return ''
  const providers = [
    async () => {
      const url = new URL('https://translate.googleapis.com/translate_a/single')
      url.search = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'fa', dt: 't', q: source }).toString()
      const response = await fetch(url.toString())
      if (!response.ok) return ''
      const payload = await response.json()
      const segments = Array.isArray(payload?.[0]) ? payload[0] : []
      return segments.map((part) => Array.isArray(part) && typeof part[0] === 'string' ? part[0] : '').join('').trim()
    },
    async () => {
      const url = new URL('https://api.mymemory.translated.net/get')
      url.search = new URLSearchParams({ q: source, langpair: 'en|fa' }).toString()
      const response = await fetch(url.toString())
      if (!response.ok) return ''
      const payload = await response.json()
      const status = Number(payload?.responseStatus ?? 200)
      const translated = payload?.responseData?.translatedText
      return status === 200 && typeof translated === 'string' ? translated.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : ''
    },
  ]
  for (const provider of providers) {
    try {
      const translated = await provider()
      if (translated) return translated
    } catch {
      // Browser/network/CORS restrictions may block a public provider; try the next one.
    }
  }
  return ''
}

function InteractiveText({ text, onWordClick, onSentenceClick, darkMode }) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
  return (
    <div className={`space-y-3 leading-relaxed text-justify font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} dir="ltr">
      {sentences.map((sentence, sentenceIndex) => (
        <p key={sentenceIndex} className="group">
          {sentence.match(/\s+|[^\s]+/g)?.map((token, tokenIndex) => {
            if (/^\s+$/.test(token)) return <span key={tokenIndex}>{token}</span>
            const cleanWord = token.replace(/^[^a-zA-Z'-]+|[^a-zA-Z'-]+$/g, '')
            if (!cleanWord) return <span key={tokenIndex}>{token}</span>
            return (
              <button
                key={tokenIndex}
                type="button"
                onClick={() => onWordClick(cleanWord, sentence.trim())}
                className={`cursor-pointer rounded border-0 bg-transparent p-0 align-baseline transition-colors ${darkMode ? 'hover:bg-indigo-950 hover:text-indigo-300' : 'hover:bg-indigo-100 hover:text-indigo-800'}`}
                title={`Look up ${cleanWord} in context`}
                aria-label={`Explain ${cleanWord} in context`}
              >{token}</button>
            )
          })}
          {onSentenceClick && (
            <button
              type="button"
              onClick={() => onSentenceClick(sentence.trim())}
              className={`ml-2 inline-flex rounded-md px-1.5 py-0.5 align-middle text-xs opacity-70 transition hover:opacity-100 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'}`}
              title="Translate this sentence"
              aria-label="Translate this sentence"
            >↔</button>
          )}
        </p>
      ))}
    </div>
  )
}

function EmptyState({ message, darkMode }) {
  return (
    <div className={`border border-dashed p-10 rounded-3xl text-center max-w-xl mx-auto ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
      <div className="text-4xl mb-4">📂</div>
      <p className="font-bold">{message}</p>
    </div>
  )
}