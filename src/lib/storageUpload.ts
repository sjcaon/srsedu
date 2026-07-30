import { supabase } from '@/integrations/supabase/client';

export const DOCS_BUCKET = 'school-documents';

/** Uploads a file to the private documents bucket and returns its storage path. */
export async function uploadDocument(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Creates a temporary signed URL so admins/teachers can preview a stored file. */
export async function getDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) {
    console.error('Failed to sign document url', error);
    return null;
  }
  return data.signedUrl;
}

export async function openDocument(path: string) {
  const url = await getDocumentUrl(path);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
