import { generateUploadButton, generateUploadDropzone, generateVueHelpers, type GenerateTypedHelpersOptions } from '@uploadthing/vue';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const initOpts = {
  url: BACKEND_URL
} satisfies GenerateTypedHelpersOptions;

export const UploadButton = generateUploadButton<any>(initOpts);
export const UploadDropzone = generateUploadDropzone<any>(initOpts);

export const { useUploadThing } = generateVueHelpers<any>(initOpts);

export type UploadThingError<T> = {
  error: Error;
  cause: T;
};
