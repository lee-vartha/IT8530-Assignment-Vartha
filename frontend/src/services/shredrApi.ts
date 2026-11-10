export type PreparedSample = {
    id: string;
    name: string;
    description: string;
};

export type ScanResponse = {
    scan_id: string;
    sample_id: string;
    name: string;
    status: 'completed' | 'manual_review';
    classification: 'benign' | 'malware';
    malware_probability: number; //0..1, NOT  a percentage
    decision_threshold: number;
    human_review_required: boolean;
    scanned_at: string;
    source: 'real_xgboost_pre_extracted_feature';
};

async function jsonOrThrow<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`SHREDR backend error (${response.status})`);
    }
    return (await response.json()) as T;
}

export async function getPreparedSamples(): Promise<PreparedSample[]> {
    return jsonOrThrow<PreparedSample[]>(await fetch ('/api/samples'));
}

export async function analysePreparedSample(sampleId: string): Promise<ScanResponse> {
    return jsonOrThrow<ScanResponse>(await fetch('/api/scans', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sample_id: sampleId}),
    }));
}

export async function getScan(scanId: string): Promise<ScanResponse> {
    return jsonOrThrow<ScanResponse>(await fetch(`/api/scans/${encodeURIComponent(scanId)}`));
}