// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generates a GST Tax Invoice PDF following the template structure by calling the Python engine backend.
 */
export async function generateInvoicePdf(
  template: any,
  dataParam: any,
): Promise<Uint8Array> {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template, dataParam })
  });
  
  if (!res.ok) {
    let errorText = "";
    try {
      const errorJson = await res.json();
      errorText = errorJson.error;
    } catch {
      errorText = await res.text();
    }
    throw new Error(`Failed to generate PDF: ${errorText}`);
  }
  
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Triggers a browser file-download for the generated PDF bytes.
 */
export function downloadPdf(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
