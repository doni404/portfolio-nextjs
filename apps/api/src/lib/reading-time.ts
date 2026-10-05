import { marked } from "marked";

export function articleWordCount(content: string) {
  const tokens = marked.lexer(content);
  const sources = tokens.findIndex((token) => token.type === "heading" && /^sources$/i.test(token.text.trim()));
  const words: string[] = [];
  marked.walkTokens(sources < 0 ? tokens : tokens.slice(0, sources), (token) => {
    if ((token.type === "text" && !("tokens" in token && token.tokens)) || token.type === "codespan" || token.type === "code") words.push(token.text);
  });
  return words.join(" ").match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function readingTimeMinutes(content: string) {
  return Math.max(1, Math.ceil(articleWordCount(content) / 220));
}
