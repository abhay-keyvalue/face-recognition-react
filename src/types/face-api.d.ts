declare module 'face-api.js' {
  export interface INet {
    loadFromUri(uri: string): Promise<void>;
  }

  export interface IFaceDetection {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  export interface IFaceDescriptor {
    descriptor: Float32Array;
    detection: IFaceDetection;
  }

  export interface IFaceMatch {
    label: string;
    distance: number;
  }

  export const nets: {
    ssdMobilenetv1: INet;
    faceRecognitionNet: INet;
    faceLandmark68Net: INet;
  };

  export function fetchImage(url: string): Promise<HTMLImageElement>;

  export function detectSingleFace(img: HTMLImageElement): {
    withFaceLandmarks: () => any;
    withFaceDescriptor: () => Promise<{ descriptor: Float32Array }>;
  };

  export function detectAllFaces(video: HTMLVideoElement): {
    withFaceLandmarks: () => any;
    withFaceDescriptors: () => Promise<IFaceDescriptor[]>;
  };

  export function matchDimensions(canvas: HTMLCanvasElement, displaySize: { width: number; height: number }): void;
  export function resizeResults(detections: any, displaySize: { width: number; height: number }): any;

  export class LabeledFaceDescriptors {
    constructor(label: string, descriptors: Float32Array[]);
  }

  export class FaceMatcher {
    constructor(labeledDescriptors: LabeledFaceDescriptors[]);
    findBestMatch(descriptor: Float32Array): IFaceMatch;
  }

  export namespace draw {
    class DrawBox {
      constructor(box: IFaceDetection, options: { label: IFaceMatch });
      draw(canvas: HTMLCanvasElement): void;
    }
  }
} 