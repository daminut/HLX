import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * High-definition 3D asset manager using GLTFLoader
 * Loads hosted GLB models with fallback to procedural geometry.
 */

class ModelLoader {
  private loader = new GLTFLoader();
  private cache = new Map<string, THREE.Group>();
  private loadPromises = new Map<string, Promise<THREE.Group | null>>();

  public async loadModel(path: string): Promise<THREE.Group | null> {
    if (this.cache.has(path)) {
      return this.cache.get(path)!.clone();
    }

    if (this.loadPromises.has(path)) {
      const group = await this.loadPromises.get(path);
      return group ? group.clone() : null;
    }

    const loadPromise = new Promise<THREE.Group | null>((resolve) => {
      this.loader.load(
        path,
        (gltf) => {
          const root = gltf.scene;
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(path, root);
          resolve(root.clone());
        },
        undefined,
        (err) => {
          console.warn(`[ModelLoader] Fallback for ${path}:`, err);
          resolve(null);
        }
      );
    });

    this.loadPromises.set(path, loadPromise);
    return loadPromise;
  }
}

export const modelLoader = new ModelLoader();
