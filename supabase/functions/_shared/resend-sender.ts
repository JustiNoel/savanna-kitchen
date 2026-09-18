// Shared Resend helpers: resolves the API key and the best available "from" address.
export const RESEND_KEY =
  Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("RESEND_DOMAIN_KEY") ?? "";

let cachedFrom: string | null = null;

const FALLBACK_FROM = "Grabbys <onboarding@resend.dev>";

/**
 * Picks a verified sending domain from the Resend account so emails actually
 * reach customers instead of being rejected by the shared test sender.
 */
export const resolveFrom = async (): Promise<string> => {
  if (cachedFrom) return cachedFrom;

  const configured = Deno.env.get("RESEND_FROM");
  if (configured) {
    cachedFrom = configured;
    return cachedFrom;
  }

  if (!RESEND_KEY) return FALLBACK_FROM;

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
    });
    if (!res.ok) return FALLBACK_FROM;
    const json = (await res.json()) as {
      data?: Array<{ name?: string; status?: string }>;
    };
    const verified = (json.data ?? []).find(
      (d) => d.status === "verified" && typeof d.name === "string",
    );
    cachedFrom = verified?.name
      ? `Grabbys <no-reply@${verified.name}>`
      : FALLBACK_FROM;
    return cachedFrom;
  } catch {
    return FALLBACK_FROM;
  }
};
