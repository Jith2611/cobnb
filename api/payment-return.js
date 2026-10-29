export default function handler(req, res) {
  let params = '';
  if (req.body && typeof req.body === 'object') {
    params = new URLSearchParams(req.body).toString();
  } else if (typeof req.body === 'string') {
    params = req.body;
  } else if (req.query) {
    params = new URLSearchParams(req.query).toString();
  }
  res.redirect(303, `/payment-return${params ? '?' + params : ''}`);
}
