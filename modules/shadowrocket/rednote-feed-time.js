if (!$response.body) $done({});

let obj;
try {
  obj = JSON.parse($response.body);
} catch {
  $done({ body: $response.body });
}

if (!Array.isArray(obj?.data)) {
  $done({ body: JSON.stringify(obj) });
}

const now = new Date();
const thisYear = now.getFullYear();
const NOTE_ID_RE = /^[a-f0-9]{24}$/i;

function decodeTimestamp(noteId) {
  const hex = noteId.slice(0, 8);
  return new Date(parseInt(hex, 16) * 1000);
}

function formatSuffix(d) {
  const pad = (n) => String(n).padStart(2, '0');
  if (d.getFullYear() === thisYear) {
    return `(${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())})`;
  }
  return `(${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())})`;
}

function hasSuffix(str) {
  return /\(\d{2}-\d{2} \d{2}:\d{2}\)$/.test(str) || /\(\d{4}-\d{2}-\d{2}\)$/.test(str);
}

for (const item of obj.data) {
  if (item?.model_type !== 'note') continue;
  if (!item?.id || !NOTE_ID_RE.test(item.id)) continue;

  try {
    const d = decodeTimestamp(item.id);
    if (isNaN(d.getTime())) continue;

    const suffix = formatSuffix(d);

    for (const field of ['display_title', 'title']) {
      if (item[field] && !hasSuffix(item[field])) {
        item[field] = `${item[field]} ${suffix}`;
      }
    }
  } catch {
    continue;
  }
}

$done({ body: JSON.stringify(obj) });
