import { describe, it, expect } from 'vitest';
import { MemoryDatabase } from '../backend/src/lib/memoryDb';

describe('MemoryDatabase', () => {
  it('should have courses defined', () => {
    const courses = MemoryDatabase.courses;
    expect(courses).toBeDefined();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
  });

  it('should contain "fundamentos-inversion" course', () => {
    const course = MemoryDatabase.courses.find(c => c.slug === 'fundamentos-inversion');
    expect(course).toBeDefined();
    expect(course?.title).toContain('Mentalidad');
  });

  it('should have published courses', () => {
    const published = MemoryDatabase.courses.filter(c => c.isPublished === true);
    expect(published.length).toBeGreaterThan(0);
  });

  it('should have instructors in profiles', () => {
    const instructors = MemoryDatabase.profiles.filter(p => p.role === 'instructor');
    expect(instructors.length).toBeGreaterThan(0);
  });
});
