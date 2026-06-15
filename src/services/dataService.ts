// PHP + MySQL Data Service
// Replaces Firestore CRUD with PHP API calls

const API_URL = "/api";

// Helper for fetch
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API Fetch] ${endpoint} response:`, result);

    if (result.status === "error") {
      throw new Error(result.message || "Terjadi kesalahan pada server");
    }
    return result.data;
  } catch (err) {
    console.error(`[API Fetch] Error for ${endpoint}:`, err);
    throw err;
  }
}

// --- CHATS ---
// Implementing these as placeholders if not explicitly requested,
// though the PHP schema supports them.

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  created_at: string;
  steps?: string[];
  quickActions?: string[];
}

export const createChatSession = async (userId: string, title: string) => {
  return await apiFetch("chat/sessions.php", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, title }),
  });
};

export const saveChatMessage = async (
  chatId: string,
  message: string,
  userEmail?: string,
  fileUrl?: string,
) => {
  return await apiFetch("chat/messages.php", {
    method: "POST",
    body: JSON.stringify({
      session_id: chatId,
      message,
      user_email: userEmail,
      file_url: fileUrl,
    }),
  });
};

export const fetchChatSessions = async (userId: string) => {
  return await apiFetch(`chat/sessions.php?user_id=${userId}`);
};

export const deleteChatSession = async (sessionId: string) => {
  return await apiFetch(`chat/sessions.php?id=${sessionId}`, {
    method: "DELETE",
  });
};

export const pinChatSession = async (sessionId: string, pinned: boolean) => {
  return await apiFetch("chat/sessions/pin.php", {
    method: "POST",
    body: JSON.stringify({ id: sessionId, pinned }),
  });
};

export const fetchChatMessages = async (sessionId: string) => {
  return await apiFetch(`chat/messages.php?session_id=${sessionId}`);
};

export const getChatbotStats = async () => {
  return await apiFetch("chat/analytics");
};

export const getChatbotInteractions = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "",
  timeRange: string = "",
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status && status !== "Semua") params.append("status", status);
  if (timeRange && timeRange !== "Semua") params.append("timeRange", timeRange);

  return await apiFetch(`chat/interactions?${params.toString()}`);
};

export const getAIStatus = async () => {
  return await apiFetch("chat/status");
};

export const getKnowledgeGaps = async () => {
  return await apiFetch("chat/gaps");
};

export const retrainAI = async (id: string) => {
  return await apiFetch("chat/retrain", {
    method: "POST",
    body: JSON.stringify({ gapId: id }),
  });
};

export const getChatbotInteractionDetail = async (id: string) => {
  return await apiFetch(`chat/detail/${id}`);
};

export const exportChatbotData = async (format: "CSV" | "EXCEL" | "PDF") => {
  const url = `/api/chat/export?format=${format}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ format }),
  });
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }
  const blob = await response.blob();
  return blob;
};

export interface AnalyticsSummary {
  totalUsers: number;
  activeToday: number;
  newThisMonth: number;
  retentionRate: number;
}

export interface AnalyticsAI {
  totalInteractions: number;
  successRate: number;
  avgLatency: number;
  totalSuccess: number;
  totalFailed: number;
  totalTimeout: number;
  totalRetry: number;
  totalUnanswered?: number;
}

export interface AnalyticsContentItem {
  id: string;
  title: string;
  views: number;
  growth?: string;
  rating?: number;
}

export interface AnalyticsFeedbackItem {
  id: string | null;
  message: string;
  sentiment: string;
  created_at: string;
  user_email: string;
}

export interface AnalyticsChartPoint {
  name: string;
  value: number;
}

export interface AnalyticsArticles {
  totalArticles: number;
  totalArticleViews: number;
  topArticles: AnalyticsContentItem[];
  chart: AnalyticsChartPoint[];
}

export interface AnalyticsEducation {
  totalEducation: number;
  totalEducationViews: number;
  topEducation: AnalyticsContentItem[];
  chart: AnalyticsChartPoint[];
}

export interface AnalyticsFeedback {
  totalFeedback: number;
  positive: number;
  neutral: number;
  negative: number;
  sentimentScore: number;
  latestFeedback: AnalyticsFeedbackItem[];
  chart: AnalyticsChartPoint[];
}

export interface AnalyticsCharts {
  users: AnalyticsChartPoint[];
  ai: AnalyticsChartPoint[];
  articles: AnalyticsChartPoint[];
  education: AnalyticsChartPoint[];
  feedback: AnalyticsChartPoint[];
}

export const fetchAnalyticsDashboard = async (period: string = '7d') => {
  return await apiFetch(`analytics/dashboard?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsUsers = async (period: string = '7d') => {
  return await apiFetch(`analytics/users?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsAI = async (period: string = '7d') => {
  return await apiFetch(`analytics/ai?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsArticles = async (period: string = '7d') => {
  return await apiFetch(`analytics/articles?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsEducation = async (period: string = '7d') => {
  return await apiFetch(`analytics/education?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsFeedback = async (period: string = '7d') => {
  return await apiFetch(`analytics/feedback?period=${encodeURIComponent(period)}`);
};

export const fetchAnalyticsCharts = async (period: string = '7d') => {
  return await apiFetch(`analytics/charts?period=${encodeURIComponent(period)}`);
};

export const exportAnalyticsCSV = async (period: string = '7d') => {
  const response = await fetch(`/api/analytics/export/csv?period=${encodeURIComponent(period)}`);
  if (!response.ok) {
    throw new Error(`Export CSV failed with status ${response.status}`);
  }
  return await response.blob();
};

export const exportAnalyticsPDF = async (period: string = '7d') => {
  const response = await fetch(`/api/analytics/export/pdf?period=${encodeURIComponent(period)}`);
  if (!response.ok) {
    throw new Error(`Export PDF failed with status ${response.status}`);
  }
  return await response.blob();
};

export interface KnowledgeFile {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  status: "PROCESSING" | "INDEXED" | "FAILED";
  version: number;
  url: string;
  error_message?: string;
}

export interface KnowledgeAnalytics {
  totalKnowledgeFiles: number;
  totalFaq: number;
  totalArticles: number;
  totalSolutions: number;
  totalChunks: number;
  totalEmbeddings: number;
  lastTrainingDate: string | null;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  source: string;
  category: string;
  date: string;
  snippet: string;
}

export const uploadKnowledgeFile = async (
  file: File,
  uploadedBy: string = "Administrator",
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadedBy", uploadedBy);

  const response = await fetch(`${API_URL}/knowledge/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (result.status === "error") {
    throw new Error(result.message || "Gagal mengunggah file knowledge.");
  }

  return result.data;
};

export const getKnowledgeFiles = async (): Promise<KnowledgeFile[]> => {
  return await apiFetch("knowledge/files");
};

export const searchKnowledge = async (
  query: string,
): Promise<KnowledgeSearchResult[]> => {
  return await apiFetch(`knowledge/search?q=${encodeURIComponent(query)}`);
};

export const deleteKnowledgeFile = async (id: string) => {
  return await apiFetch(`knowledge/${id}`, {
    method: "DELETE",
  });
};

export const retrainKnowledge = async () => {
  return await apiFetch("knowledge/retrain", {
    method: "POST",
  });
};

export const getKnowledgeAnalytics = async (): Promise<KnowledgeAnalytics> => {
  return await apiFetch("knowledge/analytics");
};

export const exportKnowledgeGaps = async (
  format: "JSON" | "CSV" | "EXCEL",
) => {
  const url = `/api/knowledge/export-gaps?format=${format}`;
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }
  const blob = await response.blob();
  return blob;
};

// --- PRODUCTS ---
export interface Product {
  id?: string;
  title?: string;
  category?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
  status?: "Published" | "Draft";
  author?: string;
  readTime?: string;
  level?: string;
  tocTitle?: string;
  steps?: { id: string; title: string; content: string }[];
  tips?: string;
  views?: number;
  created_at?: string;
  updated_at?: string;
  mediaUrl?: string;
  shortDesc?: string;
}

export interface ProductFeedback {
  id: string;
  productId: string;
  productTitle: string;
  senderName: string;
  senderEmail: string;
  message: string;
  status: "BARU" | "DITINJAU" | "SELESAI";
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    return await apiFetch("products/index.php");
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const createProduct = async (
  data: Omit<Product, "id" | "created_at" | "views">,
) => {
  return await apiFetch("products/index.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  return await apiFetch("products/index.php", {
    method: "PUT",
    body: JSON.stringify({ ...data, id }),
  });
};

export const deleteProduct = async (id: string) => {
  return await apiFetch(`products/index.php?id=${id}`, {
    method: "DELETE",
  });
};

export const incrementProductViews = async (id: string, userId?: string) => {
  try {
    await apiFetch("products/views.php", {
      method: "POST",
      body: JSON.stringify({ id, user_id: userId }),
    });
  } catch (e) {
    console.error(e);
  }
};

// --- ARTICLES ---

export interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  duration?: string;
  totalMateri?: number;
  image?: string;
  thumbnail?: string;
  status?: "Published" | "Draft";
  author?: string;
  readTime?: string;
  views?: number;
  helpful?: number;
  notHelpful?: number;
  created_at?: string;
  updated_at?: string;
  badge?: string;
  stepTitle?: string;
  problem?: string;
  cause?: string;
  solutions?: string[];
  expertTips?: string;
  helpfulUsers?: string[];
  notHelpfulUsers?: string[];
  feedbackSessions?: any[];
  savedBy?: string[];
}

let articlesCache: Article[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const getAllArticles = async (
  forceRefresh = false,
): Promise<Article[]> => {
  const now = Date.now();
  if (!forceRefresh && articlesCache && now - lastFetchTime < CACHE_DURATION) {
    return articlesCache;
  }

  try {
    const data = await apiFetch("articles/index.php");
    if (data && Array.isArray(data)) {
      articlesCache = data;
      lastFetchTime = now;
      return data;
    }
    return articlesCache || [];
  } catch (error) {
    console.error("API Error:", error);
    return articlesCache || [];
  }
};

export const clearArticlesCache = () => {
  articlesCache = null;
  lastFetchTime = 0;
};

export const createArticle = async (
  article: Omit<
    Article,
    "id" | "created_at" | "views" | "helpful" | "notHelpful"
  >,
) => {
  const result = await apiFetch("articles/index.php", {
    method: "POST",
    body: JSON.stringify(article),
  });
  clearArticlesCache();
  return result;
};

export const updateArticle = async (id: string, updates: Partial<Article>) => {
  const result = await apiFetch("articles/index.php", {
    method: "PUT",
    body: JSON.stringify({ ...updates, id }),
  });
  clearArticlesCache();
  return result;
};

export const deleteArticle = async (id: string) => {
  const result = await apiFetch(`articles/index.php?id=${id}`, {
    method: "DELETE",
  });
  clearArticlesCache();
  return result;
};

export const incrementArticleViews = async (id: string, userId?: string) => {
  try {
    await apiFetch("articles/views.php", {
      method: "POST",
      body: JSON.stringify({ id, user_id: userId }),
    });
  } catch (e) {
    console.error(e);
  }
};

// --- FEEDBACK ---

export const submitFeedback = async (data: any) => {
  return await apiFetch("feedbacks", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getAllProductFeedback = async () => {
  const data = await apiFetch("feedbacks");
  return (data || []).map((f: any) => {
    let senderName = "Anonymous";
    let senderEmail = "No Email";
    if (typeof f.pengirim === 'string') {
      const match = f.pengirim.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        senderName = match[1].trim();
        senderEmail = match[2].trim();
      } else {
        senderName = f.pengirim;
      }
    }
    return {
      id: f.id,
      senderName,
      senderEmail,
      productTitle: f.produk_artikel,
      message: f.message || "",
      created_at: f.tanggal,
      status: f.status
    };
  });
};

export const sendProductFeedback = async (data: any) => {
  let userId = data.userId || null;
  if (!userId) {
    try {
      const session = localStorage.getItem('sorgummology_user_session');
      if (session) {
        userId = JSON.parse(session).id;
      }
    } catch (e) {}
  }
  return await apiFetch("feedbacks", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      product_id: data.productId || null,
      message: data.message
    }),
  });
};

export const updateFeedbackStatus = async (id: string, status: string) => {
  return await apiFetch("feedbacks", {
    method: "PUT",
    body: JSON.stringify({ id, status }),
  });
};

// --- CONTACTS ---

export const submitContactForm = async (contact: any) => {
  return await apiFetch("feedback/index.php", {
    method: "POST",
    body: JSON.stringify({ ...contact, type: "contact" }),
  });
};

// --- SUBSCRIBERS ---

export const subscribeToNewsletter = async (email: string) => {
  return await apiFetch("feedback/index.php", {
    method: "POST",
    body: JSON.stringify({
      email,
      type: "subscriber",
      message: "Newsletter subscription",
    }),
  });
};

export const getAllSubscribers = async () => {
  return await apiFetch("feedback/index.php?type=subscriber");
};

export const deleteSubscriber = async (id: string) => {
  return await apiFetch(`feedback/index.php?id=${id}`, {
    method: "DELETE",
  });
};

// --- FAQ ---

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const getAllFaqs = async (): Promise<Faq[]> => {
  return await apiFetch("faq/index.php");
};

export const getActiveFaqs = async (): Promise<Faq[]> => {
  return await apiFetch("faq/index.php?status=active&limit=5");
};

export const submitContactToFaq = async (contact: { name: string; email: string; phone?: string; message: string }) => {
  return await apiFetch("faq/contact-message", {
    method: "POST",
    body: JSON.stringify({
      question: `[Pesan dari ${contact.name} - ${contact.email}]: ${contact.message}`,
      answer: `Belum dijawab (Pesan dari form kontak, Telp: ${contact.phone || '-'})`,
    }),
  });
};

export const createFaq = async (data: Partial<Faq>) => {
  return await apiFetch("faq/index.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateFaq = async (id: string, data: Partial<Faq>) => {
  return await apiFetch("faq/index.php", {
    method: "PUT",
    body: JSON.stringify({ ...data, id }),
  });
};

export const deleteFaq = async (id: string) => {
  return await apiFetch(`faq/index.php?id=${id}`, {
    method: "DELETE",
  });
};

export const replyContactMessage = async (faqId: string, emailUser: string, teksJawaban: string) => {
  return await apiFetch("faq/reply.php", {
    method: "POST",
    body: JSON.stringify({ faq_id: faqId, email_user: emailUser, teks_jawaban: teksJawaban }),
  });
};


// --- ARTICLES FEEDBACK ---

export const recordArticleFeedback = async (
  articleId: string,
  isHelpful: boolean,
  userId: string,
  userEmail?: string,
) => {
  return await apiFetch("articles/feedback.php", {
    method: "POST",
    body: JSON.stringify({
      id: articleId,
      is_helpful: isHelpful,
      user_email: userEmail,
      user_id: userId,
    }),
  });
};

export const getArticleFeedback = async (articleId: string) => {
  return await apiFetch(`articles/feedback.php?article_id=${articleId}`);
};

export const toggleSaveArticle = async (
  userId: string,
  article: Article,
  isSaved: boolean,
) => {
  return await apiFetch("articles/saved.php", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, article, is_saved: isSaved }),
  });
};

export const getUserSavedArticles = async (userId: string) => {
  return await apiFetch(`articles/saved.php?user_id=${userId}`);
};

export const getUserArticleFeedback = async (
  articleId: string,
  userId: string,
) => {
  const feedback = await apiFetch(
    `articles/feedback.php?article_id=${articleId}&user_id=${userId}`,
  );
  if (Array.isArray(feedback)) {
    return feedback[0] || null;
  }
  return null;
};

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  target: string;
  status: string;
  image_url?: string | null;
  is_read?: boolean;
  scheduled_at?: string | null;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface NotificationAnalytics {
  total: number;
  sent: number;
  read: number;
  unread: number;
  readRate: number;
  clickRate: number;
  conversionRate: number;
  scheduled?: number;
  failed?: number;
  deliveryRate?: number;
  byType?: Array<{ type: string; total: number; read: number; unread: number }>;
  charts?: {
    typeDistribution: Array<{ name: string; value: number }>;
    statusDistribution: Array<{ name: string; value: number }>;
    readUnreadData: Array<{ name: string; value: number }>;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  totalRead: number;
  totalUnread: number;
  totalScheduled: number;
}

export const getAllNotifications = async (): Promise<NotificationItem[]> => {
  return await apiFetch("notifications");
};

export const getNotificationById = async (
  id: string,
  userId?: string,
): Promise<NotificationItem> => {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return await apiFetch(`notifications/${id}${query}`);
};

export const createNotification = async (
  notification: Partial<NotificationItem> & {
    scheduleType?: string;
    scheduledAt?: string;
    imageUrl?: string;
  },
) => {
  return await apiFetch("notifications", {
    method: "POST",
    body: JSON.stringify(notification),
  });
};

export const deleteNotification = async (id: string) => {
  return await apiFetch(`notifications/${id}`, {
    method: "DELETE",
  });
};

export const markNotificationRead = async (id: string, userId?: string) => {
  const url = userId
    ? `notifications/read/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`
    : `notifications/read/${encodeURIComponent(id)}`;
  return await apiFetch(url, {
    method: "PUT",
  });
};

export const getNotificationAnalytics =
  async (): Promise<NotificationAnalytics> => {
    return await apiFetch("notifications/analytics");
  };

export const getNotificationStats = async (): Promise<NotificationStats> => {
  return await apiFetch("notifications/stats");
};

export const uploadNotificationImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/notifications/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Gagal mengunggah gambar notifikasi.");
  }

  return result.imageUrl;
};

// --- USERS MANAGEMENT ---

export const getUserProfile = async (id: string) => {
  return await apiFetch(`user.php?id=${id}`);
};

export const updateUserProfile = async (id: string, data: any) => {
  return await apiFetch("user.php", {
    method: "PUT",
    body: JSON.stringify({ ...data, id }),
  });
};

export const changeUserPassword = async (
  id: string,
  oldPass: string,
  newPass: string,
) => {
  return await apiFetch("user/change-password.php", {
    method: "POST",
    body: JSON.stringify({ id, old_password: oldPass, new_password: newPass }),
  });
};

export const deleteUserAccount = async (id: string) => {
  return await apiFetch(`user/delete-account.php?id=${id}`, {
    method: "DELETE",
  });
};

export const getUserFields = async (userId: string) => {
  return await apiFetch(`user/fields.php?user_id=${userId}`);
};

export const addUserField = async (
  userId: string,
  name: string,
  size: string,
) => {
  return await apiFetch("user/fields.php", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, name, size }),
  });
};

export const deleteUserField = async (id: string) => {
  return await apiFetch(`user/fields.php?id=${id}`, {
    method: "DELETE",
  });
};

export const getUserStats = async (userId: string) => {
  return await apiFetch(`user/stats.php?user_id=${userId}`);
};

export const saveUserSettings = async (
  userId: string,
  language: string,
  darkMode: boolean,
) => {
  return await apiFetch("user/settings.php", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language, dark_mode: darkMode }),
  });
};

export const getUserNotifications = async (userId: string) => {
  return await apiFetch(`notifications/index.php?user_id=${userId}`);
};

export const getAllUsers = async () => {
  return await apiFetch("users/index.php");
};

export const fetchDashboardUsersCount = async () => {
  return await apiFetch("admin/dashboard/users/count");
};

export const fetchDashboardChatCount = async () => {
  return await apiFetch("admin/dashboard/chat/count");
};

export const fetchDashboardArticlesCount = async () => {
  return await apiFetch("admin/dashboard/articles/count");
};

export const fetchDashboardKnowledgeGaps = async () => {
  return await apiFetch("admin/dashboard/knowledge-gaps");
};

export const fetchDashboardActivityChart = async () => {
  return await apiFetch("admin/dashboard/activity-chart");
};

export const fetchDashboardTopCategories = async () => {
  return await apiFetch("admin/dashboard/categories");
};

export const fetchDashboardActivityTypes = async () => {
  return await apiFetch("admin/dashboard/activity-types");
};

export const fetchDashboardPopularTopics = async () => {
  return await apiFetch("admin/dashboard/categories");
};

export const fetchDashboardRecentActivities = async () => {
  return await apiFetch("admin/dashboard/recent-activities?limit=4");
};

export const fetchDashboardAIStatus = async () => {
  return await apiFetch("admin/dashboard/ai-status");
};

export const fetchAdminDashboardActivityLogs = async (
  page = 1,
  perPage = 10,
) => {
  return await apiFetch(
    `admin/dashboard/activity?page=${page}&perPage=${perPage}`,
  );
};

export const updateUser = async (user: any) => {
  return await apiFetch("users/index.php", {
    method: "PUT",
    body: JSON.stringify(user),
  });
};

export const deleteUser = async (id: string) => {
  return await apiFetch(`users/index.php?id=${id}`, {
    method: "DELETE",
  });
};

// --- FILE UPLOAD ---

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload.php`, {
    method: "POST",
    body: formData,
    // Note: Don't set Content-Type header for FormData, browser does it with boundary
  });

  const result = await response.json();
  if (result.status === "success") {
    return result.data.url;
  } else {
    throw new Error(result.message);
  }
};

// --- ADMIN SETTINGS ---

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  created_at: string;
  updated_at: string;
  password_changed_at: string | null;
}

export interface AdminSessionData {
  browser: string;
  os: string;
  ip: string;
  loginTime: string;
  lastActivity: string;
}

export interface AdminSecurityData {
  passwordLastChanged: string | null;
  totalActiveSessions: number;
  securityStatus: "Secure" | "Warning" | "Critical";
  encryption: string;
}

export interface SystemVersionData {
  version: string;
  build: string;
  environment: string;
  build_date?: string;
  browser?: string;
  os?: string;
  server?: string;
}

export const fetchAdminProfile = async () => {
  return await apiFetch("admin/profile");
};

export const updateAdminProfile = async (data: {
  name?: string;
  phone?: string;
  avatar?: string;
}, adminId?: string) => {
  const body: any = { ...data };
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

export const uploadAdminAvatar = async (
  file: File,
  adminId?: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const body: any = { image_data: base64 };
        if (adminId) body.admin_id = adminId;
        
        const response = await apiFetch("admin/upload-avatar", {
          method: "POST",
          body: JSON.stringify(body),
        });
        
        if (response && response.avatar_url) {
          resolve(response.avatar_url);
        } else if (response && response.data && response.data.avatar_url) {
          resolve(response.data.avatar_url);
        } else {
          reject(new Error("Failed to upload avatar"));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const fetchAdminSessions = async (adminId?: string) => {
  const query = adminId ? `?admin_id=${adminId}` : "";
  return await apiFetch(`admin/sessions${query}`);
};

export const logoutAdminSession = async (sessionId: string, adminId?: string) => {
  const body: any = { session_id: sessionId };
  if (adminId) body.admin_id = adminId;
  return await apiFetch("admin/session/logout", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const resendVerificationEmail = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  return await apiFetch("admin/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const fetchAdminSession = async (): Promise<AdminSessionData> => {
  return await apiFetch("admin/session");
};

export const fetchAdminSecurity = async (): Promise<AdminSecurityData> => {
  return await apiFetch("admin/security");
};

export const fetchSystemVersion = async (): Promise<SystemVersionData> => {
  return await apiFetch("system/version");
};

// ==================== ADMIN SETTINGS ENDPOINTS ====================

/**
 * Get admin profile information
 */
export const getAdminProfile = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/profile", {
    method: "GET",
  });
};

/**
 * Change admin password with validation
 */
export const changeAdminPassword = async (
  oldPassword: string,
  newPassword: string,
  adminId?: string,
) => {
  const body: any = {
    old_password: oldPassword,
    new_password: newPassword,
  };
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Logout from all devices
 */
export const logoutAdminAllDevices = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/logout-all", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Get AI system status
 */
export const getAISystemStatus = async () => {
  return await apiFetch("admin/ai/status", {
    method: "GET",
  });
};

/**
 * Toggle AI system on/off
 */
export const toggleAISystem = async (
  enabled: boolean,
  adminId?: string,
) => {
  const body: any = { enabled };
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/ai/toggle", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Update AI brain version
 */
export const updateAIBrain = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/ai/update-brain", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Refresh knowledge base from articles/FAQs/products
 */
export const refreshKnowledgeBase = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/ai/refresh-kb", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Reset AI cache
 */
export const resetAICache = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/ai/reset-cache", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Optimize database
 */
export const optimizeDatabase = async (adminId?: string) => {
  const body: any = {};
  if (adminId) body.admin_id = adminId;
  
  return await apiFetch("admin/ai/optimize-db", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Get knowledge base index information
 */
export const getKnowledgeIndexInfo = async () => {
  return await apiFetch("admin/ai/index-info", {
    method: "GET",
  });
};

/**
 * Get activity log
 */
export const getActivityLog = async (limit: number = 50) => {
  return await apiFetch(`admin/activity-log?limit=${limit}`, {
    method: "GET",
  });
};

/**
 * Fetch public stats for landing page hero statistics
 */
export const fetchPublicStats = async () => {
  return await apiFetch("public/stats", {
    method: "GET",
  });
};
