package space.wsoft.hwp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// HWP / HWPX to markdown microservice. Drop-in replacement for the Python
// pyhwp service (same HTTP contract), backed by hwplib (.hwp) and hwpxlib
// (.hwpx) so both Hangul formats are parsed self-hosted, no cloud API.
@SpringBootApplication
public class HwpApplication {
  public static void main(String[] args) {
    SpringApplication.run(HwpApplication.class, args);
  }
}
