import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MyosokuUploadProps {
  onUploadSuccess: (data: any) => void;
  disabled?: boolean;
}

export function MyosokuUpload({ onUploadSuccess, disabled = false }: MyosokuUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "エラー",
        description: "JPEG、PNG、GIF、WebP、またはPDFファイルのみアップロード可能です",
        variant: "destructive",
      });
      return;
    }

    // ファイルサイズチェック (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "エラー", 
        description: "ファイルサイズは10MB以下にしてください",
        variant: "destructive",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      // Base64方式でのアップロードを試行
      const result = await uploadAsBase64(file);
      
      if (result.success) {
        setUploadStatus('success');
        toast({
          title: "成功",
          description: result.message || "マイソクがアップロードされ、AI解析が完了しました",
        });

        onUploadSuccess({
          fileUrl: result.imageData,
          fileName: result.fileName,
          analyzedData: result.analyzedData || {}
        });
      } else {
        throw new Error(result.error || 'アップロードに失敗しました');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // フォールバック: 従来のFormData方式を試行
      try {
        console.log('Trying fallback FormData upload...');
        const fallbackResult = await uploadAsFormData(file);
        
        setUploadStatus('success');
        toast({
          title: "成功",
          description: fallbackResult.message || "マイソクがアップロードされ、AI解析が完了しました",
        });

        onUploadSuccess({
          fileUrl: fallbackResult.fileUrl,
          fileName: fallbackResult.fileName,
          analyzedData: fallbackResult.analyzedData || {}
        });
        
      } catch (fallbackError) {
        console.error('Fallback upload also failed:', fallbackError);
        setUploadStatus('error');
        toast({
          title: "エラー",
          description: error instanceof Error ? error.message : "アップロードに失敗しました",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadAsBase64 = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          const response = await fetch('/api/myosoku/upload-base64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: file.name,
              mimeType: file.type
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Base64アップロードに失敗しました');
          }

          const result = await response.json();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました'));
      reader.readAsDataURL(file);
    });
  };

  const uploadAsFormData = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('myosoku', file);

    const response = await fetch('/api/myosoku/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'FormDataアップロードに失敗しました');
    }

    return await response.json();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'AI解析中...';
      case 'success':
        return '解析完了';
      case 'error':
        return 'エラー';
      default:
        return 'マイソクをアップロード';
    }
  };

  const getButtonVariant = () => {
    if (uploadStatus === 'success') return 'default';
    if (uploadStatus === 'error') return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3">
        <label className="text-sm font-medium text-slate-700">
          マイソク画像アップロード
        </label>
        <p className="text-xs text-slate-500">
          マイソクの画像をアップロードすると、AIが自動的に取引情報を読み取り、フォームに入力します
        </p>
        
        <Button
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
          variant={getButtonVariant()}
          className="w-full h-12 border-2 border-dashed transition-all duration-200 hover:border-blue-400"
        >
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadStatus === 'success' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              マイソクの解析が完了しました
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            取引情報が自動的にフォームに入力されました。必要に応じて修正してください。
          </p>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p>• 対応形式: JPEG, PNG, GIF, WebP, PDF</p>
        <p>• 最大ファイルサイズ: 10MB</p>
        <p>• AI解析により賃料、敷金礼金などが自動入力されます</p>
      </div>
    </div>
  );
}