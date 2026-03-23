import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Broad polyfills for pdf-parse in server environments
        if (typeof (global as any).DOMMatrix === 'undefined') {
            (global as any).DOMMatrix = class DOMMatrix {
                constructor() { }
            };
        }
        if (typeof (global as any).ImageData === 'undefined') {
            (global as any).ImageData = class ImageData { };
        }
        if (typeof (global as any).Path2D === 'undefined') {
            (global as any).Path2D = class Path2D { };
        }
        if (typeof (global as any).canvas === 'undefined') {
            (global as any).canvas = {};
        }

        // Handle the module variation in Next.js Turbopack
        const pdfModule = require('pdf-parse');

        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch the file
        const resFile = await fetch(url);
        if (!resFile.ok) {
            throw new Error(`Failed to fetch file: ${resFile.statusText}`);
        }

        const arrayBuffer = await resFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF using Mehmet Kozan's pdf-parse v2.4.5 class-based API
        console.log('Starting PDF parsing with PDFParse class...');

        let parser;
        if (pdfModule.PDFParse) {
            parser = new pdfModule.PDFParse({ data: buffer });
        } else if (typeof pdfModule === 'function') {
            // Fallback for older versions or different bundling
            parser = new (pdfModule as any)({ data: buffer });
        } else if (pdfModule.default && pdfModule.default.PDFParse) {
            parser = new pdfModule.default.PDFParse({ data: buffer });
        } else {
            console.log('Module structure:', Object.keys(pdfModule));
            throw new Error('Could not find PDFParse class in pdf-parse module');
        }

        const data = await parser.getText();
        console.log('PDF parsed successfully, pages:', data.total);

        return NextResponse.json({
            text: data.text,
            info: (data as any).info || {},
            numpages: data.total
        });

    } catch (error: any) {
        console.error('PDF Extraction Error:', error);
        return NextResponse.json({
            error: 'Failed to extract text from PDF',
            details: error.message
        }, { status: 500 });
    }
}
