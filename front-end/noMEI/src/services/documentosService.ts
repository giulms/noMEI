import { Platform, Linking } from 'react-native';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentoStatus = 'pendente' | 'valido' | 'expirado';

export interface Documento {
    id: string;
    cnpj: string;
    nome: string;
    tipo: string;
    tamanho: number;
    status: DocumentoStatus;
    data_upload: string;
}

export interface DocumentoListResponse {
    total: number;
    items: Documento[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function uploadDocumento(
    cnpj: string,
    file: { uri: string; name: string; mimeType: string }
): Promise<Documento> {
    const formData = new FormData();
    formData.append('cnpj', cnpj);

    if (Platform.OS === 'web') {
        // No web, o uri é um blob: URL criado via URL.createObjectURL
        const blobResponse = await fetch(file.uri);
        const blob = await blobResponse.blob();
        formData.append('file', blob, file.name);
    } else {
        // No native, usa o formato do React Native
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
        } as unknown as Blob);
    }

    const response = await fetch(`${API_BASE_URL}/documentos/`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.detail ?? `Erro ao fazer upload: ${response.status}`);
    }

    return response.json();
}

export async function listarDocumentos(cnpj: string): Promise<DocumentoListResponse> {
    const response = await fetch(
        `${API_BASE_URL}/documentos/?cnpj=${encodeURIComponent(cnpj)}`
    );

    if (!response.ok) {
        throw new Error(`Erro ao listar documentos: ${response.status}`);
    }

    return response.json();
}

export async function abrirDocumento(id: string): Promise<void> {
    const url = `${API_BASE_URL}/documentos/${id}/download`;

    if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return;
    }

    const supported = await Linking.canOpenURL(url);

    if (!supported) {
        throw new Error('Não foi possível abrir o documento');
    }

    await Linking.openURL(url);
}

export async function deletarDocumento(id: string): Promise<void> {
    const response = await fetch(
        `${API_BASE_URL}/documentos/${id}`,
        {
            method: 'DELETE',
        }
    );

    if (!response.ok) {
        throw new Error(`Erro ao deletar documento: ${response.status}`);
    }
}
