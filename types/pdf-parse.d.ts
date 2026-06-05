// pdf-parse v1 はパッケージルートが import 時にテスト PDF を読み込むバグがあるため
// lib パスを直接インポートする。このファイルはそのサブパス向けの型宣言。
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
