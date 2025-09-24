// api/hostgator/[...slug].js
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
  const targetUrl = base + targetPath + (qs.toString() ? '?' + qs : '');

  const headers = {
    'Authorization': `Bearer ${process.env.HOSTGATOR_API_KEY}`
  };

  const incomingCT = req.headers['content-type'] || '';
  let body = undefined;
  let needsDuplex = false;

  if (incomingCT.startsWith('multipart/form-data')) {
    // reencaminha stream bruto mantendo o boundary
    headers['Content-Type'] = incomingCT;
    body = req;                 // stream
    needsDuplex = true;         // necessário no Node 18+
  } else if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
    headers['Content-Type'] = req.headers['content-type'] || 'application/json';
    body = (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  }

  try {
    const init = { method: req.method, headers };
    if (body !== undefined) init.body = body;
    if (needsDuplex) init.duplex = 'half';   // <- aqui corrige o erro do upload

    const r = await fetch(targetUrl, init);
    const ct = r.headers.get('content-type') || '';
    res.status(r.status);

    if (ct.includes('application/json')) {
      return res.json(await r.json());
    } else {
      return res.send(await r.text());
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
