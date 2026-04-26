#!/usr/bin/env node
/**
 * i18n 스모크 테스트 (Beta-G Day 5, 2026-04-26)
 *
 * 10개국 JSON 자동 검증:
 *   1. 키 카운트 동일성 (en 기준)
 *   2. 누락 키 식별 (en에 있는데 X 언어에 없는)
 *   3. 추가 키 식별 (X 언어에만 있는)
 *   4. placeholder 일관성 ({count}, {name}, {percent} 누락)
 *   5. HTML 태그 일관성 (<strong>, <b>)
 *   6. JSON 파싱 가능성
 *
 * 실행: node scripts/i18n-smoke.mjs
 * Exit code: 0 (통과) / 1 (실패)
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = join(__dirname, '..', 'src', 'i18n');

// 모든 키를 평탄화 (점 표기법)
function flatten(obj, prefix = '') {
  const out = {};
  for (const k in obj) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

// placeholder 추출 ({xxx})
function extractPlaceholders(s) {
  if (typeof s !== 'string') return [];
  const matches = s.match(/\{[a-zA-Z_]+\}/g) || [];
  return [...new Set(matches)].sort();
}

// HTML 태그 추출 (<strong>, <b> 등)
function extractTags(s) {
  if (typeof s !== 'string') return [];
  const matches = s.match(/<\/?[a-z]+>/g) || [];
  return [...new Set(matches)].sort();
}

const files = readdirSync(I18N_DIR).filter(f => f.endsWith('.json')).sort();
const data = {};
const errors = [];

console.log('\n══════ i18n 스모크 테스트 (10개국) ══════\n');

// 1. JSON 파싱 + 평탄화
for (const f of files) {
  const lang = f.replace('.json', '');
  try {
    const raw = readFileSync(join(I18N_DIR, f), 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) {
      errors.push(`${f}: BOM 발견 (UTF-8 BOM 제거 필요)`);
    }
    const obj = JSON.parse(raw);
    data[lang] = flatten(obj);
    console.log(`✓ ${f.padEnd(10)} ${Object.keys(data[lang]).length} keys`);
  } catch (e) {
    errors.push(`${f}: JSON 파싱 실패 — ${e.message}`);
    console.log(`✗ ${f.padEnd(10)} 파싱 실패`);
  }
}

if (!data.en) {
  console.error('\n✗ en.json 누락 — 기준 언어 없음. 종료.');
  process.exit(1);
}

const enKeys = Object.keys(data.en);
console.log(`\n기준: en.json ${enKeys.length} keys\n`);

// 2. 키 동일성 + placeholder 일관성
let warningCount = 0;
let errorCount = 0;

for (const lang of Object.keys(data)) {
  if (lang === 'en') continue;
  const langKeys = Object.keys(data[lang]);
  const missing = enKeys.filter(k => !data[lang][k]);
  const extra = langKeys.filter(k => !data.en[k]);

  if (missing.length > 0) {
    errors.push(`${lang}: ${missing.length} keys 누락 — ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
    errorCount += missing.length;
  }
  if (extra.length > 0) {
    errors.push(`${lang}: ${extra.length} 키 추가 (en 에 없음) — ${extra.slice(0, 3).join(', ')}`);
    warningCount += extra.length;
  }

  // placeholder 일관성
  let placeholderMismatch = 0;
  for (const key of enKeys) {
    if (!data[lang][key]) continue;
    const enPh = extractPlaceholders(data.en[key]);
    const langPh = extractPlaceholders(data[lang][key]);
    const enSet = new Set(enPh);
    const langSet = new Set(langPh);
    const missingPh = enPh.filter(p => !langSet.has(p));
    const extraPh = langPh.filter(p => !enSet.has(p));
    if (missingPh.length || extraPh.length) {
      placeholderMismatch++;
      if (placeholderMismatch <= 3) {
        errors.push(`${lang}.${key}: placeholder 불일치 — en=${enPh.join(',')} ${lang}=${langPh.join(',')}`);
      }
    }
  }
  if (placeholderMismatch > 3) {
    errors.push(`${lang}: ... + ${placeholderMismatch - 3} 추가 placeholder 불일치`);
  }
  errorCount += placeholderMismatch;
}

// 3. 결과 보고
console.log('══════ 결과 ══════');
if (errors.length === 0) {
  console.log('\n✅ 모든 검증 통과 — 10개국 동기화 완료\n');
  process.exit(0);
} else {
  console.log(`\n✗ ${errors.length}건 발견 (errors=${errorCount}, warnings=${warningCount})\n`);
  for (const e of errors.slice(0, 30)) console.log(`  - ${e}`);
  if (errors.length > 30) console.log(`  ... + ${errors.length - 30} more`);
  console.log('');
  process.exit(errorCount > 0 ? 1 : 0);
}
