let body = $response.body;
if (!body) $done({});

let obj;
try {
  obj = JSON.parse(body);
} catch {
  $done({ body });
}

if (!Array.isArray(obj?.data)) {
  $done({ body: JSON.stringify(obj) });
}

for (const item of obj.data) {
  if (item?.model_type !== 'note') continue;
  if (item.id) {
    item.display_title = `✅DIAG-${item.id.slice(0, 6)}`;
    if (item.title) item.title = `✅DIAG-${item.id.slice(0, 6)}`;
    if (item.name) item.name = `✅DIAG-${item.id.slice(0, 6)}`;
    break;
  }
}

$done({ body: JSON.stringify(obj) });
