package space.wsoft.hwp;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// Mirrors the Python pyhwp service's HTTP contract so the Next.js ingestion
// pipeline needs no change: POST a `file`, get back { success, markdown }.
@RestController
public class ConvertController {

  @GetMapping("/")
  public Map<String, Object> root() {
    return Map.of("message", "HWP/HWPX Converter API is running", "version", "1.0.0");
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("status", "healthy");
  }

  @PostMapping("/convert/hwp-to-markdown")
  public ResponseEntity<Map<String, Object>> hwpToMarkdown(@RequestParam("file") MultipartFile file) {
    return convert(file, ".hwp");
  }

  @PostMapping("/convert/hwpx-to-markdown")
  public ResponseEntity<Map<String, Object>> hwpxToMarkdown(@RequestParam("file") MultipartFile file) {
    return convert(file, ".hwpx");
  }

  // Stage the upload in a temp file (both parsers read from a path), extract
  // text, then always clean up.
  private ResponseEntity<Map<String, Object>> convert(MultipartFile file, String suffix) {
    Path tmp = null;
    try {
      tmp = Files.createTempFile("khba-", suffix);
      file.transferTo(tmp);
      String text =
          suffix.equals(".hwpx")
              ? HwpxConverter.toText(tmp.toString())
              : HwpConverter.toText(tmp.toString());
      String md = text == null ? "" : text.trim();

      Map<String, Object> body = new LinkedHashMap<>();
      body.put("success", true);
      body.put("filename", file.getOriginalFilename());
      body.put("markdown", md);
      body.put("length", md.length());
      return ResponseEntity.ok(body);
    } catch (Exception e) {
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("success", false);
      body.put("error", e.getMessage() == null ? e.toString() : e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    } finally {
      if (tmp != null) {
        try {
          Files.deleteIfExists(tmp);
        } catch (Exception ignored) {
          // best-effort cleanup
        }
      }
    }
  }
}
