import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Report } from './Report';
import { documentedFixture, documentAll } from '../test/fixtures';
import { createSegment } from '../domain/scene';

describe('report rendering', () => {
  it('includes new load kinds, visual heights and shared segment geometry in both languages', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.kind = 'rack';
    machine.height = 2.7;
    project.floor.segments.push(createSegment('wall', 'WALL-REFERENCE', project.floor));
    const html = renderToStaticMarkup(
      createElement(Report, {
        project,
        scenario,
        languages: ['en', 'ar'],
        date: new Date('2026-09-11T00:00:00Z'),
      }),
    );
    expect(html).toContain('Storage rack');
    expect(html).toContain('رف تخزين');
    expect(html).toContain('Visual height');
    expect(html).toContain('2.7');
    expect(html).toContain('WALL-REFERENCE');
    expect(html).toContain('Existing wall');
    expect(html).toContain('Schema 2');
    expect(html).toContain('no weight, strength or capacity is inferred');
  });
  it('preserves small contact areas and corresponding reviewed limits', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.supports[0].area = 0.0001;
    scenario.review.minContactArea = 0.0001;
    documentAll(project, scenario);
    const html = renderToStaticMarkup(
      createElement(Report, {
        project,
        scenario,
        languages: ['en'],
        date: new Date('2026-09-11T00:00:00Z'),
      }),
    );
    expect(html).toContain('0.0001');
    expect(html).toContain('not the probability that the floor is safe');
    expect(html).toContain('static-load-1.0');
  });
  it('renders separate English and Arabic report sections with source text escaped', () => {
    const { project, scenario } = documentedFixture();
    scenario.evidence.identity.source = '<script>alert(1)</script>';
    const html = renderToStaticMarkup(
      createElement(Report, {
        project,
        scenario,
        languages: ['en', 'ar'],
        date: new Date('2026-09-11T00:00:00Z'),
      }),
    );
    expect(html).toContain('lang="en" dir="ltr"');
    expect(html).toContain('lang="ar" dir="rtl"');
    expect(html).toContain('ثقة البيانات');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
