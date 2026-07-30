import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileCheck2, X, Eye } from 'lucide-react';
import { uploadDocument, openDocument } from '@/lib/storageUpload';
import { useToast } from '@/hooks/use-toast';

interface FileUploadFieldProps {
  label: string;
  folder: string;
  value: string | null;
  onChange: (path: string | null) => void;
  accept?: string;
  required?: boolean;
  hint?: string;
}

export function FileUploadField({
  label,
  folder,
  value,
  onChange,
  accept = 'image/*,application/pdf',
  required,
  hint,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 20MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const path = await uploadDocument(file, folder);
      onChange(path);
      toast({ title: 'Uploaded', description: file.name });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <FileCheck2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate text-xs text-muted-foreground">{value.split('/').pop()}</span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDocument(value)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start font-normal text-muted-foreground"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Choose file'}
        </Button>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface MultiFileUploadFieldProps {
  label: string;
  folder: string;
  values: string[];
  onChange: (paths: string[]) => void;
  accept?: string;
}

export function MultiFileUploadField({ label, folder, values, onChange, accept }: MultiFileUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {values.map((path) => (
          <div key={path} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <FileCheck2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 truncate text-xs text-muted-foreground">{path.split('/').pop()}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDocument(path)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onChange(values.filter((v) => v !== path))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <FileUploadField
          label=""
          folder={folder}
          value={null}
          accept={accept}
          onChange={(path) => path && onChange([...values, path])}
        />
      </div>
    </div>
  );
}
