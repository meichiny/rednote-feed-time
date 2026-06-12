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

const url = $request.url;

// Find the first note item and replace its title
for (const item of obj.data) {
  if (item?.model_type !== 'note') continue;
  if (item.id) {
    // Replace display_title with a clear diagnostic marker
    item.display_title = `✅DIAG-${item.id.slice(0, 6)}`;
    if (item.title) item.title = `✅DIAG-${item.id.slice(0, 6)}`;
    if (item.name) item.name = `✅DIAG-${item.id.slice(0, 6)}`;
    break; // Only modify first note
  }
}

$done({ body: JSON.stringify(obj) });
