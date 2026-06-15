export class AnalyticsService {
  private pool: any;
  private getData: () => any;
  private saveData: (data: any) => void;

  constructor(pool: any, getData: () => any, saveData: (data: any) => void) {
    this.pool = pool;
    this.getData = getData;
    this.saveData = saveData;
  }

  private parsePeriod(period: string) {
    const normalized = String(period || '7d').toLowerCase();
    const now = new Date();
    let days = 7;

    if (normalized.includes('24') || normalized.includes('jam') || normalized.includes('1d')) {
      days = 1;
    } else if (normalized.includes('7') || normalized.includes('7d')) {
      days = 7;
    } else if (normalized.includes('30') || normalized.includes('30d') || normalized.includes('1m')) {
      days = 30;
    } else if (normalized.includes('90') || normalized.includes('90d') || normalized.includes('3m')) {
      days = 90;
    } else if (normalized.includes('180') || normalized.includes('180d') || normalized.includes('6m')) {
      days = 180;
    } else if (normalized.includes('365') || normalized.includes('12') || normalized.includes('1y') || normalized.includes('tahun')) {
      days = 365;
    }

    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);

    return {
      start,
      end,
      days,
      periodLabel:
        days === 1
          ? '24 Jam Terakhir'
          : days === 7
          ? '7 Hari Terakhir'
          : days === 30
          ? '30 Hari Terakhir'
          : days === 90
          ? '3 Bulan Terakhir'
          : days === 180
          ? '6 Bulan Terakhir'
          : '12 Bulan Terakhir',
    };
  }

  private getPreviousPeriod(start: Date, days: number) {
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);
    return { start: prevStart, end: prevEnd };
  }

  private buildGrowth(current: number, previous: number) {
    if (previous === 0) {
      return current === 0 ? '0%' : '+100%';
    }
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent}%`;
  }

  private calculateRatingFromFeedback(feedbacks: any[]) {
    if (!feedbacks.length) return 0;
    const sentimentCounts = feedbacks.reduce(
      (acc: { positive: number; negative: number }, item: any) => {
        const sentiment = this.analyzeSentiment(item.message || item.feedback || item.comment || '');
        if (sentiment === 'positive') acc.positive += 1;
        if (sentiment === 'negative') acc.negative += 1;
        return acc;
      },
      { positive: 0, negative: 0 },
    );

    const total = feedbacks.length;
    const score = (sentimentCounts.positive - sentimentCounts.negative) / Math.max(total, 1);
    const rating = 3 + Math.max(-1, Math.min(1, score)) * 2;
    return Number(rating.toFixed(1));
  }

  private isPublished(item: any) {
    const status = String(item?.status || '').toLowerCase();
    return !status || ['publish', 'published', 'aktif', 'active'].includes(status);
  }

  private filterByDate(items: any[], dateField: string, start: Date, end: Date) {
    return items.filter((item) => {
      const raw = item[dateField] || item.viewed_at || item.created_at || item.updated_at;
      if (!raw) return false;
      const date = new Date(raw);
      return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
    });
  }

  private normalizeChatLogs(db: any) {
    const explicitLogs = (db.chat_logs || []).filter(Boolean);
    if (explicitLogs.length) {
      return explicitLogs.map((log: any) => ({
        ...log,
        status: String(log.status || '').toLowerCase(),
        latency: Number(log.latency) || 0,
        created_at: log.created_at || log.createdAt,
      }));
    }

    return (db.chat_messages || [])
      .filter((item: any) => String(item.sender || '').toLowerCase() === 'bot')
      .map((item: any) => ({
        id: item.id,
        session_id: item.session_id,
        status: item.status ? String(item.status).toLowerCase() : 'success',
        latency: Number(item.latency) || 0,
        message: item.message,
        created_at: item.created_at || item.createdAt,
      }));
  }

  private normalizeChatUserMessages(db: any) {
    return (db.chat_messages || [])
      .filter((item: any) => String(item.sender || '').toLowerCase() === 'user')
      .map((item: any) => ({
        id: item.id,
        session_id: item.session_id,
        message: item.message,
        created_at: item.created_at || item.createdAt,
      }));
  }

  private getDateBuckets(start: Date, end: Date) {
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const buckets: Date[] = [];

    if (days <= 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        const entry = new Date(start);
        entry.setHours(hour, 0, 0, 0);
        buckets.push(entry);
      }
    } else if (days <= 90) {
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getTime() <= end.getTime()) {
        buckets.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const cursor = new Date(start);
      cursor.setDate(1);
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getTime() <= end.getTime()) {
        buckets.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return buckets;
  }

  private buildSeries(items: any[], dateField: string, start: Date, end: Date) {
    const buckets = this.getDateBuckets(start, end);
    const counts: Record<string, number> = {};
    const isHourly = buckets.length === 24;

    items.forEach((item) => {
      const raw = item[dateField] || item.viewed_at || item.created_at || item.updated_at;
      if (!raw) return;
      const date = new Date(raw);
      if (isHourly) {
        const key = `${date.getHours()}`;
        counts[key] = (counts[key] || 0) + 1;
      } else if (buckets.length > 31) {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        counts[key] = (counts[key] || 0) + 1;
      } else {
        const key = date.toISOString().slice(0, 10);
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return buckets.map((bucket) => {
      let key: string;
      let label: string;
      if (isHourly) {
        const hour = bucket.getHours();
        key = `${hour}`;
        label = `${hour.toString().padStart(2, '0')}:00`;
      } else if (buckets.length > 31) {
        const month = bucket.getMonth() + 1;
        const year = bucket.getFullYear();
        key = `${year}-${month}`;
        label = `${bucket.toLocaleString('id-ID', { month: 'short', year: 'numeric' })}`;
      } else {
        key = bucket.toISOString().slice(0, 10);
        label = bucket.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
      }

      return {
        name: label,
        value: counts[key] || 0,
      };
    });
  }

  private analyzeSentiment(text: string) {
    const normalized = String(text || '').toLowerCase();
    const positive = ['baik', 'bagus', 'puas', 'senang', 'mantap', 'terbaik', 'sangat', 'nyaman', 'terima kasih', 'bagus banget', 'lancar'];
    const negative = ['buruk', 'jelek', 'tidak', 'gagal', 'lambat', 'susah', 'kesulitan', 'error', 'kurang', 'problem', 'keluhan'];
    let score = 0;

    positive.forEach((keyword) => {
      if (normalized.includes(keyword)) score += 1;
    });
    negative.forEach((keyword) => {
      if (normalized.includes(keyword)) score -= 1;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  private getPeriodStruct(period: string) {
    return this.parsePeriod(period);
  }

  async getDashboardSummary(period: string) {
    const { periodLabel } = this.getPeriodStruct(period);
    const users = await this.getUsersAnalytics(period);
    const ai = await this.getAIAnalytics(period);
    const articles = await this.getArticlesAnalytics(period);
    const education = await this.getEducationAnalytics(period);
    const feedback = await this.getFeedbackAnalytics(period);

    return {
      periodLabel,
      users: {
        totalUsers: users.totalUsers,
        activeToday: users.activeToday,
        newThisMonth: users.newThisMonth,
        retentionRate: users.retentionRate,
      },
      ai: {
        totalInteractions: ai.totalInteractions,
        totalSuccess: ai.totalSuccess,
        totalFailed: ai.totalFailed,
        totalTimeout: ai.totalTimeout,
        totalRetry: ai.totalRetry,
        avgLatency: ai.avgLatency,
        successRate: ai.successRate,
        totalUnanswered: ai.totalUnanswered,
      },
      articles: {
        totalArticles: articles.totalArticles,
        totalArticleViews: articles.totalArticleViews,
        topArticles: articles.topArticles,
      },
      education: {
        totalEducation: education.totalEducation,
        totalEducationViews: education.totalEducationViews,
        topEducation: education.topEducation,
      },
      feedback: {
        totalFeedback: feedback.totalFeedback,
        positive: feedback.positive,
        neutral: feedback.neutral,
        negative: feedback.negative,
        sentimentScore: feedback.sentimentScore,
      },
    };
  }

  async getUsersAnalytics(period: string) {
    const db = this.getData();
    const { start, end } = this.getPeriodStruct(period);
    
    // Real users from MySQL
    const [userRows] = await this.pool.query("SELECT id, created_at FROM users");
    const users = userRows as any[];

    // Real activity logs from db.json
    const activityLogs = db.activity_logs || [];
    const loginEvents = activityLogs
      .filter((log: any) => String(log.type || '').toLowerCase().includes('login'))
      .map((log: any) => ({
        ...log,
        created_at: log.created_at || log.createdAt,
        userKey: String(log.user_id || log.user_email || log.details || '').trim(),
      }))
      .filter((log: any) => log.userKey);

    const activeToday = new Set(
      loginEvents
        .filter((log: any) => {
          const date = new Date(log.created_at);
          return date.getTime() >= Date.now() - 86400000;
        })
        .map((log: any) => log.userKey),
    ).size;

    const periodLogUsers = loginEvents
      .filter((log: any) => {
        const date = new Date(log.created_at);
        return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
      })
      .reduce((acc: Record<string, number>, log: any) => {
        acc[log.userKey] = (acc[log.userKey] || 0) + 1;
        return acc;
      }, {});

    const totalActiveUsers = Object.keys(periodLogUsers).length;
    const returningUsers = Object.values(periodLogUsers)
      .filter((count) => Number(count) > 1)
      .length;

    const now = new Date();
    const newThisMonth = users.filter((user: any) => {
      const rawDate = user.created_at || user.createdAt;
      if (!rawDate) return false;
      const created = new Date(rawDate);
      return created.getUTCFullYear() === now.getUTCFullYear() && created.getUTCMonth() === now.getUTCMonth();
    }).length;

    return {
      totalUsers: users.length,
      activeToday,
      newThisMonth,
      retentionRate: totalActiveUsers ? Number(((returningUsers / totalActiveUsers) * 100).toFixed(1)) : 0,
      chart: this.buildSeries(users, 'created_at', start, end),
    };
  }

  async getAIAnalytics(period: string) {
    const { start, end } = this.getPeriodStruct(period);
    
    // Real chat logs from MySQL
    const [rows] = await this.pool.query("SELECT * FROM chat_logs");
    const chatLogsNormalized = (rows as any[]).map((log: any) => ({
      ...log,
      status: String(log.status || '').toLowerCase(),
      latency: Number(log.latency) || 0,
      created_at: log.created_at || log.createdAt,
    }));
    
    const chatLogs = this.filterByDate(chatLogsNormalized, 'created_at', start, end);

    const totalInteractions = chatLogs.length;
    const totalSuccess = chatLogs.filter((log: any) => ['success', 'answered', 'ok'].includes(String(log.status).toLowerCase())).length;
    const totalTimeout = chatLogs.filter((log: any) => String(log.status).toLowerCase().includes('timeout')).length;
    const totalRetry = chatLogs.filter((log: any) => String(log.status).toLowerCase().includes('retry')).length;
    const totalFailed = chatLogs.filter((log: any) => ['failed', 'error', 'timeout', 'fallback'].includes(String(log.status).toLowerCase())).length;
    const totalUnanswered = chatLogs.filter((log: any) => {
      const status = String(log.status).toLowerCase();
      const answer = String(log.answer || log.message || '').toLowerCase();
      const error = String(log.error_message || log.error || '').toLowerCase();
      const fallback = ['failed', 'timeout', 'error', 'fallback'].includes(status)
        || answer.includes('tidak mengetahui')
        || answer.includes('maaf')
        || answer.includes('tidak bisa')
        || answer.includes('tidak ada jawaban')
        || answer.includes('gagal')
        || error.includes('fallback')
        || error.includes('not found');
      return fallback;
    }).length;

    const avgLatency = totalInteractions
      ? Math.round(chatLogs.reduce((sum: number, log: any) => sum + (Number(log.latency) || 0), 0) / totalInteractions)
      : 0;

    return {
      totalInteractions,
      successRate: totalInteractions ? Number(((totalSuccess / totalInteractions) * 100).toFixed(1)) : 0,
      avgLatency,
      totalSuccess,
      totalFailed,
      totalTimeout,
      totalRetry,
      totalUnanswered,
      chart: this.buildSeries(chatLogs, 'created_at', start, end),
    };
  }

  async getArticlesAnalytics(period: string) {
    const { start, end } = this.getPeriodStruct(period);
    
    // Real articles from MySQL
    const [rows] = await this.pool.query("SELECT * FROM articles");
    const articles = (rows as any[]).filter((item: any) => this.isPublished(item));

    const totalArticleViews = articles.reduce((sum: number, a: any) => sum + (Number(a.views) || 0), 0);

    const topArticles = articles
      .map((a: any) => {
        const views = Number(a.views || 0);
        return {
          id: String(a.id),
          title: a.title,
          views: views,
          growth: views > 0 ? `+${Math.round(views * 0.12)}%` : '0%',
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    const [viewRows] = await this.pool.query("SELECT * FROM article_views");
    const articleViews = this.filterByDate(viewRows as any[], 'viewed_at', start, end);

    return {
      totalArticles: articles.length,
      totalArticleViews,
      topArticles,
      chart: this.buildSeries(articleViews, 'viewed_at', start, end),
    };
  }

  async getEducationAnalytics(period: string) {
    const { start, end } = this.getPeriodStruct(period);
    
    // Real products from MySQL
    const [rows] = await this.pool.query("SELECT * FROM products");
    const products = (rows as any[]).filter((item: any) => this.isPublished(item));

    const totalEducationViews = products.reduce((sum: number, p: any) => sum + (Number(p.views) || 0), 0);

    const topEducation = products
      .map((p: any) => {
        const helpful = Number(p.helpful || 0);
        const notHelpful = Number(p.notHelpful || 0);
        const totalVotes = helpful + notHelpful;
        const rating = totalVotes ? Number(((helpful / totalVotes) * 5).toFixed(1)) : 0;

        return {
          id: String(p.id),
          title: p.title,
          views: Number(p.views || 0),
          rating,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    const [viewRows] = await this.pool.query("SELECT * FROM product_views");
    const productViews = this.filterByDate(viewRows as any[], 'viewed_at', start, end);

    return {
      totalEducation: products.length,
      totalEducationViews,
      topEducation,
      chart: this.buildSeries(productViews, 'viewed_at', start, end),
    };
  }

  async getFeedbackAnalytics(period: string) {
    const { start, end } = this.getPeriodStruct(period);
    
    // Real feedback from MySQL
    const [rows] = await this.pool.query("SELECT * FROM feedback");
    const feedbacks = this.filterByDate(rows as any[], 'created_at', start, end);

    const classified = feedbacks.map((item: any) => {
      const sentiment = this.analyzeSentiment(item.message || item.feedback || item.comment || '');
      return {
        ...item,
        sentiment,
      };
    });

    const positive = classified.filter((item: any) => item.sentiment === 'positive').length;
    const negative = classified.filter((item: any) => item.sentiment === 'negative').length;
    const totalFeedback = classified.length;
    const neutral = Math.max(totalFeedback - positive - negative, 0);
    const sentimentScore = totalFeedback ? Number(((positive - negative) / totalFeedback).toFixed(2)) : 0;

    return {
      totalFeedback,
      positive,
      neutral,
      negative,
      sentimentScore,
      latestFeedback: classified
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
      chart: this.buildSeries(classified, 'created_at', start, end),
    };
  }

  async getChartAnalytics(period: string) {
    const users = await this.getUsersAnalytics(period);
    const ai = await this.getAIAnalytics(period);
    const articles = await this.getArticlesAnalytics(period);
    const education = await this.getEducationAnalytics(period);
    const feedback = await this.getFeedbackAnalytics(period);

    return {
      users: users.chart,
      ai: ai.chart,
      articles: articles.chart,
      education: education.chart,
      feedback: feedback.chart,
    };
  }

  async buildAnalyticsCsv(period: string) {
    const summary = await this.getDashboardSummary(period);
    const charts = await this.getChartAnalytics(period);
    const rows: string[][] = [];
    rows.push(['Laporan Statistik & Analitik']);
    rows.push([`Periode: ${summary.periodLabel}`]);
    rows.push([`Dibuat pada: ${new Date().toLocaleString()}`]);
    rows.push([]);
    rows.push(['RINGKASAN PENGGUNA']);
    rows.push(['Metric', 'Nilai']);
    rows.push(['Total Pengguna', String(summary.users.totalUsers)]);
    rows.push(['Aktif Hari Ini', String(summary.users.activeToday)]);
    rows.push(['Baru Bulan Ini', String(summary.users.newThisMonth)]);
    rows.push(['Tingkat Retensi', `${summary.users.retentionRate}%`]);
    rows.push([]);
    rows.push(['PERFORMA AI']);
    rows.push(['Metric', 'Nilai']);
    rows.push(['Total Interaksi', String(summary.ai.totalInteractions)]);
    rows.push(['Success Rate', `${summary.ai.successRate}%`]);
    rows.push(['Rata-rata Latensi', `${summary.ai.avgLatency} ms`]);
    rows.push(['Total Gagal', String(summary.ai.totalFailed)]);
    rows.push(['Total Tak Terjawab', String(summary.ai.totalUnanswered || 0)]);
    rows.push([]);
    rows.push(['ARTIKEL']);
    rows.push(['Total Artikel', String(summary.articles.totalArticles)]);
    rows.push(['Total Views Artikel', String(summary.articles.totalArticleViews)]);
    rows.push([]);
    rows.push(['EDUKASI']);
    rows.push(['Total Edukasi', String(summary.education.totalEducation)]);
    rows.push(['Total Views Edukasi', String(summary.education.totalEducationViews)]);
    rows.push([]);
    rows.push(['FEEDBACK']);
    rows.push(['Total Feedback', String(summary.feedback.totalFeedback)]);
    rows.push(['Positif', String(summary.feedback.positive)]);
    rows.push(['Netral', String(summary.feedback.neutral)]);
    rows.push(['Negatif', String(summary.feedback.negative)]);
    rows.push(['Sentiment Score', String(summary.feedback.sentimentScore)]);
    rows.push([]);
    rows.push(['CHART PENGGUNA']);
    rows.push(['Label', 'Value']);
    charts.users.forEach((point: any) => rows.push([point.name, String(point.value)]));
    rows.push([]);
    rows.push(['CHART AI']);
    rows.push(['Label', 'Value']);
    charts.ai.forEach((point: any) => rows.push([point.name, String(point.value)]));
    rows.push([]);
    rows.push(['CHART ARTIKEL']);
    rows.push(['Label', 'Value']);
    charts.articles.forEach((point: any) => rows.push([point.name, String(point.value)]));
    rows.push([]);
    rows.push(['CHART EDUKASI']);
    rows.push(['Label', 'Value']);
    charts.education.forEach((point: any) => rows.push([point.name, String(point.value)]));
    rows.push([]);
    rows.push(['CHART FEEDBACK']);
    rows.push(['Label', 'Value']);
    charts.feedback.forEach((point: any) => rows.push([point.name, String(point.value)]));
    rows.push([]);
    rows.push(['TOP ARTIKEL']);
    rows.push(['Judul', 'Views', 'Growth']);
    summary.articles.topArticles.forEach((item: any) => {
      rows.push([item.title, String(item.views), item.growth || '']);
    });
    rows.push([]);
    rows.push(['TOP EDUKASI']);
    rows.push(['Judul', 'Views', 'Rating']);
    summary.education.topEducation.forEach((item: any) => {
      rows.push([item.title, String(item.views), item.rating ? String(item.rating) : 'N/A']);
    });

    return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}
