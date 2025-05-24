import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';

// よく使用される言語のみを登録してバンドルサイズを削減
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml'; // HTML用

// 言語を登録
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

// markedの基本設定
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * コードブロックにシンタックスハイライトを適用
 * @param code コード文字列
 * @param language 言語
 * @returns ハイライト済みHTMLコード
 */
function highlightCode(code: string, language?: string): string {
  if (!language) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  const lang = hljs.getLanguage(language) ? language : 'plaintext';
  try {
    const highlighted = hljs.highlight(code, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  } catch (err) {
    return `<pre><code class="hljs language-plaintext">${escapeHtml(code)}</code></pre>`;
  }
}

/**
 * HTMLエスケープ
 * @param text エスケープするテキスト
 * @returns エスケープ済みテキスト
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * マークダウンテキストをHTMLに変換
 * @param markdown マークダウンテキスト
 * @returns HTML文字列
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // コードブロックを先に処理
    let processedMarkdown = markdown.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => {
        return highlightCode(code.trim(), language);
      }
    );

    // インラインコードの処理
    processedMarkdown = processedMarkdown.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    // markedでマークダウンをHTMLに変換（コードブロック以外）
    const html = marked.parse(processedMarkdown);
    return typeof html === 'string' ? html : html.toString();
  } catch (error) {
    console.error('マークダウン解析エラー:', error);
    // エラー時は元のテキストを返す
    return markdown.replace(/\n/g, '<br>');
  }
}

/**
 * テキストにマークダウン記法が含まれているかチェック
 * @param text チェックするテキスト
 * @returns マークダウン記法が含まれている場合true
 */
export function containsMarkdown(text: string): boolean {
  if (!text) return false;
  
  // 一般的なマークダウン記法パターン
  const markdownPatterns = [
    /\*\*.*?\*\*/,          // **太字**
    /\*.*?\*/,              // *斜体*
    /`.*?`/,                // `インラインコード`
    /```[\s\S]*?```/,       // ```コードブロック```
    /^\s*#+\s/m,            // # 見出し
    /^\s*[-*+]\s/m,         // - リスト項目
    /^\s*\d+\.\s/m,         // 1. 番号付きリスト
    /\[.*?\]\(.*?\)/,       // [リンク](URL)
    /^\s*>\s/m,             // > 引用
    /^\s*\|.*\|/m,          // | テーブル |
    /~~.*?~~/,              // ~~取り消し線~~
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * マークダウンを安全なHTMLに変換（XSS対策）
 * @param markdown マークダウンテキスト
 * @returns サニタイズされたHTML文字列
 */
export function parseMarkdownSafe(markdown: string): string {
  if (!markdown) return '';
  
  // 基本的なXSS対策（簡易版）
  const sanitized = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return parseMarkdown(sanitized);
} 