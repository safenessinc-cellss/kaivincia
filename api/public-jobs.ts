import { adminDb, isFirebaseAdminConfigured } from '../server/_lib/firebaseAdmin.js';

function toIsoDate(value: any): string {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : '';
}

/**
 * Public vacancy feed. The HR jobs collection contains private metrics, so
 * public clients must never read those Firestore documents directly.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isFirebaseAdminConfigured) {
    return res.status(503).json({ error: 'Las vacantes no están configuradas en este entorno.', jobs: [] });
  }

  try {
    const snapshot = await adminDb.collection('jobs')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const jobs = snapshot.docs.map((item: any) => {
      const data = item.data() || {};
      return {
        id: item.id,
        title: typeof data.title === 'string' ? data.title : '',
        department: typeof data.department === 'string' ? data.department : '',
        location: typeof data.location === 'string' ? data.location : '',
        type: typeof data.type === 'string' ? data.type : '',
        description: typeof data.description === 'string' ? data.description : '',
        isUrgent: data.isUrgent === true,
        status: 'active',
        createdAt: toIsoDate(data.createdAt)
      };
    }).filter((job: any) => job.title && job.description)
      .sort((a: any, b: any) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));

    return res.status(200).json({ jobs });
  } catch (error: any) {
    console.error('[api/public-jobs] Failed to load vacancies:', error?.message || 'unknown error');
    return res.status(503).json({ error: 'Las vacantes no están disponibles temporalmente.', jobs: [] });
  }
}
