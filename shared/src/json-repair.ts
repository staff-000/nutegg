// ============================================================
// NutEgg Robust JSON Parser & Repair Utilities
// ============================================================

/**
 * Repairs a truncated JSON string (e.g. cut off mid-stream by token limit).
 * Recovers valid fields, objects, and array elements generated before the cutoff.
 */
export function repairTruncatedJson(jsonStr: string): string | null {
  const firstBrace = jsonStr.indexOf("{");
  if (firstBrace === -1) return null;

  let text = jsonStr.slice(firstBrace).trim();
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
    } else if (c === "{" || c === "[") {
      stack.push(c);
    } else if (c === "}") {
      if (stack[stack.length - 1] === "{") stack.pop();
    } else if (c === "]") {
      if (stack[stack.length - 1] === "[") stack.pop();
    }
  }

  // If already balanced and not in a string, return as is
  if (stack.length === 0 && !inString) {
    return text;
  }

  // If truncated inside a string literal, close the quote
  if (inString) {
    text += '"';
  }

  // If inside an object, check if the last token is an incomplete key-value pair
  if (stack[stack.length - 1] === "{") {
    // Drop dangling key with colon: e.g. `, "key":` or `{"key":`
    text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    // Drop dangling key without colon after comma or brace: e.g. `, "key"` or `{"key"`
    text = text.replace(/(?:\{|,)\s*"[^"]*"\s*$/, (m) => (m.startsWith("{") ? "{" : ""));
  }

  // Drop any trailing comma or whitespace
  text = text.replace(/,\s*$/, "").trim();

  // Re-scan stack on the cleaned text to get accurate unclosed brackets
  const finalStack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") finalStack.push(c);
    else if (c === "}") {
      if (finalStack[finalStack.length - 1] === "{") finalStack.pop();
    } else if (c === "]") {
      if (finalStack[finalStack.length - 1] === "[") finalStack.pop();
    }
  }

  // Close unclosed brackets in reverse order
  while (finalStack.length > 0) {
    const open = finalStack.pop();
    if (open === "{") text += "}";
    else if (open === "[") text += "]";
  }

  return text;
}

/**
 * Sanitizes an AI JSON string response:
 * - Escapes literal control characters (\n, \r, \t) inside string values so JSON.parse won't crash
 * - Removes trailing commas before closing braces/brackets
 */
export function sanitizeJsonString(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        result += c;
      } else if (c === "\\") {
        escaped = true;
        result += c;
      } else if (c === '"') {
        inString = false;
        result += c;
      } else if (c === "\n") {
        result += "\\n";
      } else if (c === "\r") {
        result += "\\r";
      } else if (c === "\t") {
        result += "\\t";
      } else if (c.charCodeAt(0) < 32) {
        result += "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
      } else {
        result += c;
      }
    } else {
      if (c === '"') inString = true;
      result += c;
    }
  }

  // Remove trailing commas outside of strings
  return result.replace(/,\s*([}\]])/g, "$1");
}

/**
 * Parse JSON response with robust cleanup, code-fence stripping, and repairs.
 */
export function parseJson(
  response: string,
  context = "response"
): Record<string, any> {
  let jsonStr = (response || "").trim();
  if (!jsonStr) {
    console.warn(`[NutEgg] Empty AI response received for (${context}).`);
    return {};
  }

  // 1. Strip markdown code fences if wrapped
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  // Attempt 1: raw parse
  try {
    return JSON.parse(jsonStr);
  } catch {}

  // Attempt 2: sanitize raw control characters in strings and trailing commas
  const sanitized = sanitizeJsonString(jsonStr);
  try {
    return JSON.parse(sanitized);
  } catch {}

  // Attempt 3: find outermost { ... } block
  const braceMatch = sanitized.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
  }

  // Attempt 4: repair truncated JSON stream
  const repaired = repairTruncatedJson(sanitized);
  if (repaired) {
    try {
      const res = JSON.parse(repaired);
      console.warn(`[NutEgg] Recovered truncated JSON response (${context})`);
      return res;
    } catch {}
  }

  console.warn(
    `[NutEgg] Failed to parse AI JSON response (${context}) [length=${jsonStr.length}]:`,
    jsonStr.slice(0, 500)
  );
  return {};
}

