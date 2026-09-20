import type { Attachment, AttachmentKind, Message } from '../types'

export const MAX_FILE_BYTES = 3 * 1024 * 1024
export const MAX_ATTACHMENTS = 6
export const MAX_IMAGE_EDGE = 1280
export const IMAGE_QUALITY = 0.72

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/')
}

export function attachmentKind(mime: string): AttachmentKind {
  return isImageMime(mime) ? 'image' : 'file'
}

export function fileIconLabel(name: string, mime: string): string {
  const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() : ''
  if (ext && ext.length <= 5) return ext
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('zip')) return 'ZIP'
  if (mime.startsWith('text/')) return 'TXT'
  return 'FILE'
}

export function previewAttachments(message: Message): string {
  const body = message.body.replace(/\s+/g, ' ').trim()
  const atts = message.attachments ?? []
  if (!atts.length) return body
  const first = atts[0]
  const label =
    atts.length > 1
      ? `${atts.length} attachments`
      : first.kind === 'image'
        ? 'Photo'
        : first.name
  if (!body) return label
  return `${body} · ${label}`
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return Math.floor((b64.length * 3) / 4)
}

async function compressImage(file: File): Promise<Attachment> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not compress image')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const mime =
    file.type === 'image/png' && file.size < 400_000 ? 'image/png' : 'image/jpeg'
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error('Could not compress image'))),
      mime,
      IMAGE_QUALITY,
    )
  })

  const dataUrl = await readAsDataUrl(blob)
  const name =
    mime === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)
      ? file.name.replace(/\.[^.]+$/, '') + '.jpg'
      : file.name

  return {
    id: crypto.randomUUID(),
    name,
    mimeType: mime,
    size: blob.size,
    kind: 'image',
    dataUrl,
  }
}

export type AttachmentResult =
  | { ok: true; attachment: Attachment }
  | { ok: false; error: string }

export async function fileToAttachment(file: File): Promise<AttachmentResult> {
  const compressible =
    isImageMime(file.type) &&
    file.type !== 'image/svg+xml' &&
    file.type !== 'image/gif'

  try {
    if (compressible) {
      const attachment = await compressImage(file)
      if (attachment.size > MAX_FILE_BYTES) {
        return {
          ok: false,
          error: `${file.name} is still over ${formatBytes(MAX_FILE_BYTES)} after compression.`,
        }
      }
      return { ok: true, attachment }
    }

    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        error: `${file.name} is larger than ${formatBytes(MAX_FILE_BYTES)}.`,
      }
    }

    const dataUrl = await readAsDataUrl(file)
    if (estimateDataUrlBytes(dataUrl) > MAX_FILE_BYTES * 1.4) {
      return {
        ok: false,
        error: `${file.name} is too large to keep in localStorage.`,
      }
    }

    return {
      ok: true,
      attachment: {
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        kind: attachmentKind(file.type),
        dataUrl,
      },
    }
  } catch {
    return { ok: false, error: `Could not attach ${file.name}.` }
  }
}

export async function filesToAttachments(
  files: FileList | File[],
  already: number,
): Promise<{ attachments: Attachment[]; errors: string[] }> {
  const list = [...files]
  const attachments: Attachment[] = []
  const errors: string[] = []
  const room = MAX_ATTACHMENTS - already
  if (room <= 0) {
    return {
      attachments: [],
      errors: [`You can attach up to ${MAX_ATTACHMENTS} files per message.`],
    }
  }
  if (list.length > room) {
    errors.push(`Only ${room} more file${room === 1 ? '' : 's'} can be added.`)
  }
  for (const file of list.slice(0, room)) {
    const result = await fileToAttachment(file)
    if (result.ok) attachments.push(result.attachment)
    else errors.push(result.error)
  }
  return { attachments, errors }
}
