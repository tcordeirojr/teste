// api/hostgator/[...slug].js
export default async function handler(req, res) {
  const base = (process.env.HOSTGATOR_API_URL || '').replace(/\/$/, '');
  if (!base) return res.status(500).json({ error: 'HOSTGATOR_API_URL not set' });

  // req.query.slug será um array com o resto do path (Next/Vercel)
  const slug = req.query?.slug ?? [];
  // montar querystring (removendo slug)
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k === 'slug') continue;
    if (Array.isArray(v)) v.forEach(x => qs.append(k, x));
    else qs.append(k, String(v));
  }

  const targetPath = slug.length ? '/' + slug.join('/') : '';
  const targetUrl = base + targetPath + (qs.toString() ? '?' + qs.toString() : '');

  // montar headers (envia a API KEY)
  const headers = {
    'Authorization': `Bearer ${process.env.HOSTGATOR_API_KEY}`
  };

  // Se for JSON body, encaminhar Content-Type e body
  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    // assumimos JSON para simplificar
    headers['Content-Type'] = req.headers['content-type'] || 'application/json';
    // req.body já está parseado normalmente (Vercel/Next). Enviar raw JSON
    body = (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  }

  try {
    const r = await fetch(targetUrl, { method: req.method, headers, body });
    const contentType = r.headers.get('content-type') || '';

    // repassa status + conteúdo
    res.status(r.status);
    if (contentType.includes('application/json')) {
      const data = await r.json();
      return res.json(data);
    } else {
      const text = await r.text();
      return res.send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
