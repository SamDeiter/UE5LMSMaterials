import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferenceViewerController } from '../../material/ui/ReferenceViewerController.js';

describe('ReferenceViewerController', () => {
    let app;
    let refViewer;

    beforeEach(() => {
        app = {
            graph: {
                nodes: new Map()
            },
            textureManager: {
                get: vi.fn((id) => ({ id, name: `Texture_${id}` }))
            },
            persistence: {
                currentAssetId: 'TestMaterial'
            },
            updateStatus: vi.fn()
        };
        refViewer = new ReferenceViewerController(app);
    });

    it('should identify texture dependencies from the graph', () => {
        app.graph.nodes.set('1', {
            properties: { TextureAsset: 'tex_01' }
        });
        app.graph.nodes.set('2', {
            properties: { TextureAsset: 'tex_02' }
        });
        // Duplicate texture should be ignored
        app.graph.nodes.set('3', {
            properties: { TextureAsset: 'tex_01' }
        });

        const deps = refViewer.getDependencies();
        expect(deps.upstream).toHaveLength(2);
        expect(deps.upstream.map(d => d.id)).toContain('tex_01');
        expect(deps.upstream.map(d => d.id)).toContain('tex_02');
    });

    it('should return empty upstream if no textures are used', () => {
        app.graph.nodes.set('1', {
            properties: { Color: { R: 1, G: 0, B: 0 } }
        });

        const deps = refViewer.getDependencies();
        expect(deps.upstream).toHaveLength(0);
    });
});
