export const API_URL: string = import.meta.env.VITE_API_URL ?? "/api";

export const CLOUDINARY = {
  cloudName: (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? "",
  uploadPreset: (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) ?? "",
};

export const DEMO_ACCOUNT = {
  email: "lucia@demo.compis.app",
  password: "compis-demo-2026",
};
