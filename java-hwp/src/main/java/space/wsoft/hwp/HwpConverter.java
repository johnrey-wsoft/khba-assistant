package space.wsoft.hwp;

import kr.dogfoot.hwplib.object.HWPFile;
import kr.dogfoot.hwplib.reader.HWPReader;
import kr.dogfoot.hwplib.tool.textextractor.TextExtractMethod;
import kr.dogfoot.hwplib.tool.textextractor.TextExtractor;

// Binary .hwp (OLE2/CFB) -> text, via hwplib. Kept in its own class because
// hwplib and hwpxlib both expose `TextExtractor` / `TextExtractMethod` under
// the same simple names — isolating the imports avoids the clash.
final class HwpConverter {
  private HwpConverter() {}

  static String toText(String path) throws Exception {
    HWPFile hwpFile = HWPReader.fromFile(path);
    // InsertControlTextBetweenParagraphText keeps table/control text inline
    // with the surrounding paragraphs (closest to a readable reading order).
    return TextExtractor.extract(hwpFile, TextExtractMethod.InsertControlTextBetweenParagraphText);
  }
}
