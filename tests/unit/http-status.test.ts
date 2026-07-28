import { describe, it, expect } from "vitest";
import { HttpStatus, getStatusText } from "@/constants/http-status.constant";

describe("HttpStatus", () => {
  it("should have correct status code values", () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe("getStatusText", () => {
  it("should return correct text for known status codes", () => {
    expect(getStatusText(200)).toBe("OK");
    expect(getStatusText(201)).toBe("Created");
    expect(getStatusText(400)).toBe("Bad Request");
    expect(getStatusText(401)).toBe("Unauthorized");
    expect(getStatusText(404)).toBe("Not Found");
    expect(getStatusText(429)).toBe("Too Many Requests");
    expect(getStatusText(500)).toBe("Internal Server Error");
  });

  it("should return empty string for unknown status codes", () => {
    expect(getStatusText(999)).toBe("");
    expect(getStatusText(418)).toBe("");
  });
});
