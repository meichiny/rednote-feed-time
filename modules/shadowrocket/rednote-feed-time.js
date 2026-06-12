if (!$response.body) $done({});

let obj;
try {
  obj = JSON.parse($response.body);
} catch {
  $done({ body: $response.body });
}

const url = $request.url;
const now = new Date();
const thisYear = now.getFullYear();
const NOTE_ID_RE = /^[a-f0-9]{24}$/i;

function decodeTimestamp(noteId) {
  const hex = noteId.slice(0, 8);
  return new Date(parseInt(hex, 16) * 1000);
}

function formatDebugPrefix(d) {
  const pad = (n) => String(n).padStart(2, '0');
  if (d.getFullYear() === thisYear) {
    return `⏱${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} `;
  }
  return `⏱${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `;
}

function hasDebugPrefix(str) {
  return /^⏱\d{2}-\d{2} \d{2}:\d{2} /.test(str) || /^⏱\d{4}-\d{2}-\d{2} /.test(str);
}

function processItem(item) {
  if (item?.model_type !== 'note') return;
  if (!item?.id || !NOTE_ID_RE.test(item.id)) return;

  try {
    const d = decodeTimestamp(item.id);
    if (isNaN(d.getTime())) return;

    const prefix = formatDebugPrefix(d);

    for (const field of ['display_title', 'title', 'name']) {
      if (item[field] && !hasDebugPrefix(item[field])) {
        item[field] = prefix + item[field];
      }
    }
  } catch {
    // skip item on error
  }
}

if (url.includes('/v2/note/feed') || url.includes('/v1/note/imagefeed')) {
  // v2/note/feed: obj.data[0].note_list[]
  if (obj?.data?.[0]?.note_list) {
    for (const item of obj.data[0].note_list) {
      processItem(item);
    }
  }
  // v3/note/videofeed: obj.data[] (direct array)
} else if (url.includes('/v3/note/videofeed')) {
  if (Array.isArray(obj?.data)) {
    for (const item of obj.data) {
      processItem(item);
    }
  }
} else {
  // v6/homefeed, others: obj.data[] (direct array)
  if (Array.isArray(obj?.data)) {
    for (const item of obj.data) {
      processItem(item);
    }
  }
}

$done({ body: JSON.stringify(obj) });
