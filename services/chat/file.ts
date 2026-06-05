import type { Attachment } from "discord.js";
// pdf-parse v1 はパッケージルートの index.js が import 時にテスト PDF を読み込むバグがある
// lib パスを直接インポートして回避する
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { ProcessedAttachment } from "@/services/ai";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/** アップロード可能な最大ファイルサイズ（20 MB） */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Discord の添付ファイルを AI に渡せる形式に変換するサービス。
 * 画像は URL をそのまま保持し、PDF はテキストを抽出する。
 */
export class FileService {
  /**
   * Discord Attachment を ProcessedAttachment に変換する。
   * サポート外・サイズ超過の場合は null を返す。
   */
  async process(attachment: Attachment): Promise<ProcessedAttachment | null> {
    if (attachment.size > MAX_FILE_SIZE) {
      console.warn(
        `[FileService] サイズ超過のためスキップ: ${attachment.name} (${attachment.size} bytes)`,
      );
      return null;
    }

    const contentType = attachment.contentType ?? "";

    if (SUPPORTED_IMAGE_TYPES.has(contentType)) {
      return {
        type: "image",
        url: attachment.url,
        mimeType: contentType,
        filename: attachment.name ?? "image",
      };
    }

    if (contentType === "application/pdf") {
      return this.processPDF(attachment);
    }

    return null;
  }

  /**
   * 複数の添付ファイルを一括処理し、サポートされたものだけを返す。
   */
  async processAll(attachments: Attachment[]): Promise<ProcessedAttachment[]> {
    const results = await Promise.all(
      attachments.map((att) => this.process(att)),
    );
    return results.filter((r): r is ProcessedAttachment => r !== null);
  }

  private async processPDF(
    attachment: Attachment,
  ): Promise<ProcessedAttachment | null> {
    try {
      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const data = await pdfParse(buffer);
      return {
        type: "document",
        text: data.text,
        filename: attachment.name ?? "document.pdf",
      };
    } catch (error) {
      console.error(`[FileService] PDF 解析失敗: ${attachment.name}`, error);
      return null;
    }
  }
}
