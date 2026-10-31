/**
 * InfraOps Hub server
 * - Serves the Vite app (dev middleware in development, ./dist in production)
 * - POST /api/forecast → Gemini completion-date forecast (API key stays on the server)
 */
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

async function start() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/forecast', async (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({ error: 'GEMINI_API_KEY غير مضبوط على الخادم' });
    }
    try {
      const { project, localForecast, historical, today } = req.body ?? {};
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `أنت محلل جداول زمنية لمشاريع البنية التحتية في السعودية.
اليوم: ${today}
بيانات المشروع الحالي:
${JSON.stringify(
  {
    name: project?.name,
    startDate: project?.startDate,
    contractualEndDate: project?.endDate,
    physicalProgress: project?.physicalProgress,
    plannedProgress: project?.plannedProgress,
    financialProgress: project?.financialProgress,
    contractValue: project?.contractValue,
    actualCost: project?.actualCost,
    status: project?.status,
    financialTimeline: project?.financialTimeline
  },
  null,
  1
)}
مشاريع سابقة مماثلة (المدة المخططة مقابل الفعلية ومؤشر SPI عند منتصف المشروع):
${JSON.stringify(historical, null, 1)}
توقع النموذج المحلي: ${JSON.stringify(localForecast)}

حلل معدل الإنجاز الحالي وأنماط التأخير في المشاريع السابقة وتوقع تاريخ التسليم الفعلي.
أعد JSON فقط بالشكل:
{"forecastDate":"YYYY-MM-DD","earliestDate":"YYYY-MM-DD","latestDate":"YYYY-MM-DD","confidence":0-100,"narrative":"جملتان أو ثلاث بالعربية توضح سبب التوقع وأهم توصية"}`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.2 }
      });
      const text = response.text ?? '{}';
      const data = JSON.parse(text.replace(/^```json\s*|```$/g, ''));
      res.json(data);
    } catch (err: any) {
      console.error('[forecast]', err);
      res.status(500).json({ error: err?.message || 'AI forecast failed' });
    }
  });

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`InfraOps Hub running on http://localhost:${PORT}`));
}

start();
