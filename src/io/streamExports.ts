import type { Sector, StarSystem } from '../forge/models';

export type NdjsonRow = { type: 'sector' | 'header' | 'system'; data: any };

export async function* ndjsonStream(sectors: Sector[], systems?: StarSystem[]): AsyncGenerator<string> {
    for (const sec of sectors) {
        yield JSON.stringify({ type: 'sector', data: sec.key }) + '\n';
        for (const h of sec.starHeaders) {
            yield JSON.stringify({ type: 'header', data: h }) + '\n';
        }
    }
    if (systems) {
        for (const sys of systems) {
            yield JSON.stringify({ type: 'system', data: sys }) + '\n';
        }
    }
}

// Browser helper to download a stream
export async function downloadNdjson(filename: string, sectors: Sector[], systems?: StarSystem[]) {
    const chunks: string[] = [];
    for await (const line of ndjsonStream(sectors, systems)) {
        chunks.push(line);
    }
    const blob = new Blob(chunks, { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}