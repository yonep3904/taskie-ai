/**
 * URL の末尾のスラッシュを削除する
 */
export function cleanUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
