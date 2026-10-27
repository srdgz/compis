import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import {
  AVATAR_MAX_BYTES,
  avatarSrc,
  uploadToCloudinary,
  validateAvatarFile,
} from "@/shared/api/cloudinary";
import { Avatar } from "@/shared/ui/Avatar";
import { lucia, mockDemoApi } from "@/test/mockApi";
import { renderApp } from "@/test/render";
import { API, server } from "@/test/server";

const UPLOAD_URL = "https://api.cloudinary.com/v1_1/demo/auto/upload";
const PHOTO = "https://res.cloudinary.com/demo/image/upload/v1/lucia.jpg";

describe("avatarSrc", () => {
  it("asks Cloudinary for a small face-centred square", () => {
    expect(avatarSrc(PHOTO, 40)).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,g_face,w_80,h_80,f_auto,q_auto/v1/lucia.jpg",
    );
  });

  it("leaves other hosts untouched and handles empty values", () => {
    expect(avatarSrc("https://example.com/me.png", 40)).toBe("https://example.com/me.png");
    expect(avatarSrc(null, 40)).toBeNull();
    expect(avatarSrc("not a url", 40)).toBeNull();
  });
});

describe("validateAvatarFile", () => {
  it("accepts common images within the size limit", () => {
    expect(validateAvatarFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateAvatarFile({ type: "image/webp", size: AVATAR_MAX_BYTES })).toBeNull();
  });

  it("rejects other types and big files", () => {
    expect(validateAvatarFile({ type: "application/pdf", size: 10 })).toMatch(/imagen/);
    expect(validateAvatarFile({ type: "image/png", size: AVATAR_MAX_BYTES + 1 })).toMatch(/5 MB/);
  });
});

describe("uploadToCloudinary", () => {
  it("returns the secure URL", async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ secure_url: PHOTO })));
    await expect(uploadToCloudinary(new File(["x"], "a.png", { type: "image/png" }))).resolves.toBe(
      PHOTO,
    );
  });

  it("explains failures", async () => {
    server.use(http.post(UPLOAD_URL, () => new HttpResponse(null, { status: 400 })));
    await expect(uploadToCloudinary(new File(["x"], "a.png"))).rejects.toThrow(/No se pudo subir/);
    server.use(http.post(UPLOAD_URL, () => HttpResponse.error()));
    await expect(uploadToCloudinary(new File(["x"], "a.png"))).rejects.toThrow(/conexión/);
  });
});

describe("Avatar", () => {
  it("shows the photo when there is one", () => {
    const { container } = render(<Avatar name="Lucía" src={PHOTO} size="md" />);
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image?.getAttribute("src")).toContain("c_fill,g_face,w_80,h_80");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to the initial when the image fails to load", () => {
    const { container } = render(<Avatar name="Lucía" src={PHOTO} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("L");
  });

  it("shows the initial without a photo", () => {
    const { container } = render(<Avatar name="Lucía" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("L");
  });
});

describe("profile picture", () => {
  function fileInput(container: HTMLElement) {
    return container.querySelector<HTMLInputElement>('input[type="file"]')!;
  }

  it("uploads a photo and saves its address", async () => {
    mockDemoApi();
    let saved: unknown = null;
    server.use(
      http.post(UPLOAD_URL, () => HttpResponse.json({ secure_url: PHOTO })),
      http.put(`${API}/roomie/1`, async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ ...lucia, avatar: PHOTO });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderApp("/profile", true);
    await screen.findByRole("button", { name: "Subir foto" });

    await user.upload(fileInput(container), new File(["img"], "yo.png", { type: "image/png" }));

    expect(await screen.findByText("Foto de perfil actualizada.")).toBeInTheDocument();
    expect(saved).toEqual({ avatar: PHOTO });
    expect(await screen.findByRole("button", { name: "Cambiar foto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar foto" })).toBeInTheDocument();
  });

  it("refuses files that are not images", async () => {
    mockDemoApi();
    const user = userEvent.setup({ applyAccept: false });
    const { container } = renderApp("/profile", true);
    await screen.findByRole("button", { name: "Subir foto" });

    await user.upload(
      fileInput(container),
      new File(["%PDF"], "cv.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Elige una imagen");
  });

  it("removes the photo", async () => {
    mockDemoApi();
    server.use(
      http.get(`${API}/roomie/1`, () => HttpResponse.json({ ...lucia, avatar: PHOTO })),
      http.put(`${API}/roomie/1`, async ({ request }) => {
        expect(await request.json()).toEqual({ avatar: null });
        return HttpResponse.json({ ...lucia, avatar: null });
      }),
    );
    const user = userEvent.setup();
    renderApp("/profile", true);

    await user.click(await screen.findByRole("button", { name: "Quitar foto" }));
    expect(await screen.findByText("Foto de perfil eliminada.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Subir foto" })).toBeInTheDocument();
  });
});
