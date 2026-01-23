/**
 * Post-processing tests
 * Tests for the post-processing constants and configuration
 */

import { describe, it, expect } from 'vitest';
import { 
  POST_PROCESSING, 
  RENDERING, 
  MATERIAL_DEFAULTS 
} from '../../src/constants/EditorConstants.js';

describe('Post-Processing Constants', () => {
  describe('Bloom settings', () => {
    it('should have valid bloom strength', () => {
      expect(POST_PROCESSING.BLOOM.STRENGTH).toBeDefined();
      expect(POST_PROCESSING.BLOOM.STRENGTH).toBeGreaterThanOrEqual(0);
      expect(POST_PROCESSING.BLOOM.STRENGTH).toBeLessThanOrEqual(2);
    });

    it('should have valid bloom radius', () => {
      expect(POST_PROCESSING.BLOOM.RADIUS).toBeDefined();
      expect(POST_PROCESSING.BLOOM.RADIUS).toBeGreaterThanOrEqual(0);
      expect(POST_PROCESSING.BLOOM.RADIUS).toBeLessThanOrEqual(1);
    });

    it('should have valid bloom threshold', () => {
      expect(POST_PROCESSING.BLOOM.THRESHOLD).toBeDefined();
      expect(POST_PROCESSING.BLOOM.THRESHOLD).toBeGreaterThanOrEqual(0);
      expect(POST_PROCESSING.BLOOM.THRESHOLD).toBeLessThanOrEqual(1);
    });
  });

  describe('Vignette settings', () => {
    it('should have valid vignette intensity', () => {
      expect(POST_PROCESSING.VIGNETTE.INTENSITY).toBeDefined();
      expect(POST_PROCESSING.VIGNETTE.INTENSITY).toBeGreaterThanOrEqual(0);
      expect(POST_PROCESSING.VIGNETTE.INTENSITY).toBeLessThanOrEqual(1);
    });

    it('should have valid vignette radius', () => {
      expect(POST_PROCESSING.VIGNETTE.RADIUS).toBeDefined();
      expect(POST_PROCESSING.VIGNETTE.RADIUS).toBeGreaterThanOrEqual(0);
      expect(POST_PROCESSING.VIGNETTE.RADIUS).toBeLessThanOrEqual(1);
    });
  });

  describe('Film Grain settings', () => {
    it('should have subtle film grain intensity', () => {
      expect(POST_PROCESSING.FILM_GRAIN.INTENSITY).toBeDefined();
      // Film grain should be very subtle
      expect(POST_PROCESSING.FILM_GRAIN.INTENSITY).toBeLessThan(0.1);
      expect(POST_PROCESSING.FILM_GRAIN.INTENSITY).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Rendering Constants', () => {
  describe('Camera settings', () => {
    it('should have valid camera FOV', () => {
      expect(RENDERING.DEFAULT_CAMERA_FOV).toBeDefined();
      expect(RENDERING.DEFAULT_CAMERA_FOV).toBeGreaterThan(0);
      expect(RENDERING.DEFAULT_CAMERA_FOV).toBeLessThan(180);
    });

    it('should have valid camera position', () => {
      expect(RENDERING.DEFAULT_CAMERA_POSITION).toBeDefined();
      expect(RENDERING.DEFAULT_CAMERA_POSITION.x).toBeDefined();
      expect(RENDERING.DEFAULT_CAMERA_POSITION.y).toBeDefined();
      expect(RENDERING.DEFAULT_CAMERA_POSITION.z).toBeDefined();
    });

    it('should have valid near/far clip planes', () => {
      expect(RENDERING.CAMERA_NEAR).toBeGreaterThan(0);
      expect(RENDERING.CAMERA_FAR).toBeGreaterThan(RENDERING.CAMERA_NEAR);
    });
  });

  describe('Lighting settings', () => {
    it('should have valid light intensities', () => {
      expect(RENDERING.DIRECTIONAL_LIGHT_INTENSITY).toBeGreaterThan(0);
      expect(RENDERING.AMBIENT_LIGHT_INTENSITY).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Material Default Constants', () => {
  it('should have valid roughness', () => {
    expect(MATERIAL_DEFAULTS.ROUGHNESS).toBeGreaterThanOrEqual(0);
    expect(MATERIAL_DEFAULTS.ROUGHNESS).toBeLessThanOrEqual(1);
  });

  it('should have valid metalness', () => {
    expect(MATERIAL_DEFAULTS.METALNESS).toBeGreaterThanOrEqual(0);
    expect(MATERIAL_DEFAULTS.METALNESS).toBeLessThanOrEqual(1);
  });

  it('should have valid IOR for physical materials', () => {
    // IOR for most materials is between 1.0 and 2.5
    expect(MATERIAL_DEFAULTS.IOR).toBeGreaterThanOrEqual(1.0);
    expect(MATERIAL_DEFAULTS.IOR).toBeLessThanOrEqual(2.5);
  });

  it('should have valid env map intensity', () => {
    expect(MATERIAL_DEFAULTS.ENV_MAP_INTENSITY).toBeGreaterThanOrEqual(0);
    expect(MATERIAL_DEFAULTS.ENV_MAP_INTENSITY).toBeLessThanOrEqual(2);
  });
});
