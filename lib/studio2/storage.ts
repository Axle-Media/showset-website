import type { Workspace, Backup, Revision, MediaAsset } from "./model";
import { assertWorkspace } from "./model";
const DATABASE = "showset-studio2";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DATABASE, 1);
    r.onupgradeneeded = () => {
      for (const name of ["documents", "revisions", "backups", "media"])
        if (!r.result.objectStoreNames.contains(name))
          r.result.createObjectStore(name);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readStore<T>(
  store: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(store, "readonly"),
        r = t.objectStore(store).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
async function put(store: string, key: IDBValidKey, value: unknown) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(store, "readwrite");
      t.objectStore(store).put(value, key);
      t.oncomplete = () => resolve();
      t.onabort = () =>
        reject(t.error || Error("Storage transaction was aborted."));
      t.onerror = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}
export class ConflictError extends Error {
  constructor(public remote: Workspace) {
    super(
      "A newer draft was saved in another tab. Your changes have not overwritten it.",
    );
  }
}
export async function saveWorkspace(
  workspace: Workspace,
  expected: number,
  label: string,
): Promise<Workspace> {
  assertWorkspace(workspace);
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(["documents", "revisions"], "readwrite"),
        documents = t.objectStore("documents");
      let saved: Workspace | undefined, conflict: Workspace | undefined;
      const r = documents.get("draft");
      r.onsuccess = () => {
        const current = r.result as Workspace | undefined;
        if ((current?.revision || 0) !== expected) {
          conflict = current;
          t.abort();
          return;
        }
        saved = {
          ...structuredClone(workspace),
          revision: expected + 1,
          updatedAt: new Date().toISOString(),
        };
        documents.put(saved, "draft");
        t.objectStore("revisions").put(
          {
            id: String(saved.revision),
            label,
            at: saved.updatedAt,
            workspace: saved,
          } satisfies Revision,
          saved.revision,
        );
      };
      t.oncomplete = () => resolve(saved!);
      t.onabort = () =>
        reject(
          conflict
            ? new ConflictError(conflict)
            : t.error || Error("Unable to commit draft."),
        );
      t.onerror = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}
export async function revisions(): Promise<Revision[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const r = db.transaction("revisions").objectStore("revisions").getAll();
      r.onsuccess = () => resolve((r.result as Revision[]).reverse());
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function savePreview(workspace: Workspace) {
  assertWorkspace(workspace);
  await put("documents", "preview", structuredClone(workspace));
}
export function rawRecords() {
  return Object.fromEntries(
    Object.keys(localStorage)
      .filter(
        (k) => k.startsWith("showset-") && !k.startsWith("showset-studio2"),
      )
      .sort()
      .map((k) => [k, localStorage.getItem(k)]),
  );
}
async function checksum(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function createBackup(
  workspace: Workspace | null,
  persist=true,
): Promise<Backup> {
  const assets = await Promise.all(
    (workspace?.media || []).map(async (asset) => {
      const row = await readStore<{
        blob: Blob;
      }>("media", asset.id);
      if (!row)
        throw Error(
          "Missing original image: " +
            asset.name +
            ". Backup was not completed.",
        );
      const bytes = new Uint8Array(await row.blob.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 32768)
        binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return { id: asset.id, type: asset.type, base64: btoa(binary) };
    }),
  );
  const body = {
    format: "showset-studio2-backup" as const,
    version: 2 as const,
    at: new Date().toISOString(),
    origin: location.origin,
    records: rawRecords(),
    assets,
    workspace: workspace ? structuredClone(workspace) : null,
  };
  const backup = { ...body, checksum: await checksum(body) };
  await verifyBackup(backup);
  if(persist){await put("backups", backup.checksum, backup);
  await verifyBackup((await readStore<Backup>("backups", backup.checksum))!);
  }return backup;
}
export async function verifyBackup(value: unknown): Promise<Backup> {
  if (!value || typeof value !== "object") throw Error("Invalid backup.");
  const backup = value as Backup;
  if (
    backup.format !== "showset-studio2-backup" ||
    backup.version !== 2 ||
    !backup.records ||
    typeof backup.checksum !== "string"
  )
    throw Error("Unsupported backup format.");
  const { checksum: hash, ...body } = backup;
  if ((await checksum(body)) !== hash)
    throw Error("Backup checksum does not match. Nothing was imported.");
  if (backup.workspace) assertWorkspace(backup.workspace);
  if (
    Object.entries(backup.records).some(
      ([k, v]) =>
        !k.startsWith("showset-") || (v !== null && typeof v !== "string"),
    )
  )
    throw Error("Invalid raw recovery records.");
  const assets = backup.assets || [];
  if (!Array.isArray(assets) || assets.length > 500)
    throw Error("Invalid media manifest.");
  for (const asset of backup.workspace?.media || []) {
    if (!assets.some((a) => a.id === asset.id && a.type === asset.type))
      throw Error("Backup is missing original image bytes: " + asset.name);
  }
  let total = 0;
  for (const a of assets) {
    if (
      typeof a.base64 !== "string" ||
      a.base64.length > 12 * 1024 * 1024 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(a.base64)
    )
      throw Error("Invalid image bytes in backup.");
    total += a.base64.length;
    if (total > 60 * 1024 * 1024) throw Error("Backup media exceeds 60 MB.");
    const bytes = Uint8Array.from(atob(a.base64), (c) => c.charCodeAt(0));
    const hash = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    if (a.id !== "asset-" + hash) throw Error("Image checksum mismatch.");
  }
  return backup;
}
export async function importMedia(backup: Backup) {
  const checked = await verifyBackup(backup);
  const rows: {
    asset: MediaAsset;
    blob: Blob;
  }[] = [];
  for (const a of checked.assets || []) {
    const metadata = checked.workspace?.media.find((m) => m.id === a.id);
    if (!metadata) throw Error("Orphan media record.");
    const bytes = Uint8Array.from(atob(a.base64), (c) => c.charCodeAt(0));
    const row = await decodeMedia(
      new File([bytes], metadata.name, { type: a.type }),
    );
    if (
      row.asset.id !== metadata.id ||
      row.asset.width !== metadata.width ||
      row.asset.height !== metadata.height
    )
      throw Error("Image metadata mismatch.");
    rows.push({ ...row, asset: metadata });
  }
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction("media", "readwrite");
      for (const row of rows) t.objectStore("media").put(row, row.asset.id);
      t.oncomplete = () => resolve();
      t.onabort = () => reject(t.error || Error("Media import aborted."));
      t.onerror = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}
export function downloadJson(value: unknown, name: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function decodeMedia(file: File): Promise<{
  asset: MediaAsset;
  blob: Blob;
}> {
  if (file.size > 8 * 1024 * 1024) throw Error("Choose an image below 8 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71,
    jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    webp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const type = png
    ? "image/png"
    : jpeg
      ? "image/jpeg"
      : webp
        ? "image/webp"
        : "";
  if (!type || file.type !== type)
    throw Error(
      "Only genuine PNG, JPEG and WebP images are supported. SVG and executable uploads are not accepted.",
    );
  if (png && bytes.length >= 24) {
    const view = new DataView(bytes.buffer),
      w = view.getUint32(16),
      h = view.getUint32(20);
    if (w * h > 24000000 || w > 8192 || h > 8192)
      throw Error("Image dimensions exceed 24 megapixels or 8192 px.");
  }
  const bitmap = await createImageBitmap(new Blob([bytes], { type }));
  const width = bitmap.width,
    height = bitmap.height;
  bitmap.close();
  if (width * height > 24000000 || width > 8192 || height > 8192)
    throw Error("Image dimensions exceed the safe limit.");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const asset: MediaAsset = {
    id: "asset-" + hash,
    name: file.name.replace(/[^\w .-]/g, "").slice(0, 120) || "Image",
    type,
    size: file.size,
    width,
    height,
    alt: "",
    createdAt: new Date().toISOString(),
    tags: [],
  };
  return { asset, blob: new Blob([bytes], { type }) };
}
export async function storeMedia(file: File): Promise<MediaAsset> {
  const row = await decodeMedia(file);
  await put("media", row.asset.id, row);
  return row.asset;
}
export async function mediaUrls(
  media: MediaAsset[],
): Promise<Record<string, string>> {
  const pairs = await Promise.all(
    media.map(async (asset) => {
      const row = await readStore<{
        blob: Blob;
      }>("media", asset.id);
      return [asset.id, row ? URL.createObjectURL(row.blob) : ""];
    }),
  );
  return Object.fromEntries(pairs);
}
