import { describe, expect, it } from 'vitest';
import { salvageJSON } from './llm';

describe('salvageJSON', () => {
  it('parses clean JSON as-is', () => {
    expect(salvageJSON('{"score": 7, "verdict": "Build"}')).toEqual({ score: 7, verdict: 'Build' });
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"score": 7}\n```';
    expect(salvageJSON(raw)).toEqual({ score: 7 });
  });

  it('removes trailing commas before closing braces/brackets', () => {
    const raw = '{"items": ["a", "b",], "score": 7,}';
    expect(salvageJSON(raw)).toEqual({ items: ['a', 'b'], score: 7 });
  });

  it('closes a dangling brace left by a truncated response', () => {
    const raw = '{"score": 7, "verdict": "Build"';
    expect(salvageJSON(raw)).toEqual({ score: 7, verdict: 'Build' });
  });

  it('closes an outer brace after an already-closed nested array', () => {
    const raw = '{"notes": ["ok", "done"]';
    expect(salvageJSON(raw)).toEqual({ notes: ['ok', 'done'] });
  });

  it('throws when the input cannot be salvaged', () => {
    expect(() => salvageJSON('not json at all')).toThrow();
  });
});
