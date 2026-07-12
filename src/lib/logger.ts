type LogFields = Record<string, unknown>;

function write(
  level: "info" | "error",
  code: string,
  fields?: LogFields,
): void {
  const line = JSON.stringify({
    level,
    code,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info(code: string, fields?: LogFields) {
    write("info", code, fields);
  },
  error(code: string, fields?: LogFields) {
    write("error", code, fields);
  },
};
