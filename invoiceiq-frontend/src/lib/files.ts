// Resolve an invoice file URL for display/download.
// Local storage returns a relative path (/uploads/…) served by the backend;
// S3 storage returns an absolute https://…s3… URL — use it as-is.
export function resolveFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return ''
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}${fileUrl}`
}
