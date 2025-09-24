export default async function handler(req, res) {
  const base = (process.env.HOSTGATOR_API_URL || '').replace(/\/$/, '');
  if (!base) return res.status(500).json({ error: 'HOSTGATOR_API_URL not set' });

  const slug = req.query?.slug ?? [];
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k === 'slug') continue;
    if (Array.isArray(v)) v.forEach(x => qs.append(k, x));
    else qs.append(k, String(v));
  }
  const targetPath = slug.length ? '/' + slug.join('/') : '';
  const targetUrl = base + targetPath + (qs.toString() ? '?' + qs.toString() : '');

  // Sempre envia a API KEY para o HostGator
  const headers = {
    'Authorization': `Bearer ${process.env.HOSTGATOR_API_KEY}`
  };

  // Descobre o content-type original
  const incomingCT = req.headers['content-type'] || '';

  let body;
  // Se for multipart, repassa o stream bruto (req) mantendo o boundary
  if (incomingCT.startsWith('multipart/form-data')) {
    headers['Content-Type'] = incomingCT; // mantém boundary
    body = req; // stream direto
  } else if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    // Para JSON normal
    headers['Content-Type'] = req.headers['content-type'] || 'application/json';
    body = (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  }

  try {
    const r = await fetch(targetUrl, { method: req.method, headers, body });
    const contentType = r.headers.get('content-type') || '';
     res.status(r.status);
    if (contentType.includes('application/json')) {
      return res.json(await r.json());
    } else {
      return res.send(await r.text());
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
