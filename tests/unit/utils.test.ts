import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge simple class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle array of classes", () => {
    const result = cn(["px-2", "py-1"]);
    expect(result).toBe("px-2 py-1");
  });

  it("should merge Tailwind conflicting classes correctly", () => {
    // When there are conflicting Tailwind classes, twMerge should keep the last one
    const result = cn("px-2 px-4");
    expect(result).toBe("px-4");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should handle conditional classes when condition is false", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class");
  });

  it("should merge multiple Tailwind utilities with conflicts", () => {
    const result = cn("px-2 py-1 px-4 py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle empty strings", () => {
    const result = cn("px-2", "", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle undefined values", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class", "other-class");
    expect(result).toBe("base-class other-class");
  });

  it("should work with complex nested conditions", () => {
    const isPrimary = true;
    const isLarge = false;
    const result = cn(
      "button",
      isPrimary ? "bg-blue-500" : "bg-gray-500",
      isLarge ? "px-8 py-4" : "px-4 py-2"
    );
    expect(result).toBe("button bg-blue-500 px-4 py-2");
  });
});
