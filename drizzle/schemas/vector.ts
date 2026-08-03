import { customType } from "drizzle-orm/pg-core";

// pgvector `halfvec` (half-precision, 2 bytes/dim) column type.
// Not natively supported by drizzle-orm, so declared via customType.
// Stored/received as the pgvector text form: `[0.1,0.2,...]`.
export const halfvec = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `halfvec(${config?.dimensions})`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .map((n) => Number(n));
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});
