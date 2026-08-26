package space.wsoft.hwp;

import kr.dogfoot.hwpxlib.object.HWPXFile;
import kr.dogfoot.hwpxlib.reader.HWPXReader;
import kr.dogfoot.hwpxlib.tool.textextractor.TextExtractMethod;
import kr.dogfoot.hwpxlib.tool.textextractor.TextExtractor;
import kr.dogfoot.hwpxlib.tool.textextractor.TextMarks;

// OWPML .hwpx (zip) -> text, via hwpxlib. Separate class from HwpConverter to
// keep the same-named hwpxlib TextExtractor/TextExtractMethod imports isolated.
final class HwpxConverter {
  private HwpxConverter() {}

  static String toText(String path) throws Exception {
    HWPXFile hwpxFile = HWPXReader.fromFilepath(path);
    TextMarks marks = new TextMarks().paraSeparatorAnd("\n").lineBreakAnd("\n");
    // (file, method, insertParaHead, textMarks)
    return TextExtractor.extract(
        hwpxFile, TextExtractMethod.InsertControlTextBetweenParagraphText, true, marks);
  }
}
