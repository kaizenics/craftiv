import { NextRequest, NextResponse } from 'next/server';
import { launchPdfBrowser } from '@/lib/server/launch-pdf-browser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PDFRequestBody {
  html: string;
  fileName?: string;
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;

  try {
    const body = (await request.json()) as PDFRequestBody;
    const html = body?.html;
    const fileName = (body?.fileName || 'resume').replace(/[^\w.-]/g, '_');

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Invalid request body. Expected "html" string.' }, { status: 400 });
    }

    browser = await launchPdfBrowser();

    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123,
      },
    });

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      if ('fonts' in document) {
        await document.fonts.ready;
      }
    });
    await page.emulateMedia({ media: 'screen' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    const pdfBytes = new Uint8Array(pdf);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate PDF. ${message}` }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


