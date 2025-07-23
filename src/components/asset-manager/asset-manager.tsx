import React, { useState, useCallback, useEffect } from 'react';
import { DialogCard } from '../container/dialog-card';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconUpload } from '@tabler/icons';
import './asset-manager.css'
import { useToast } from '../toast/ToastContext';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

interface AssetManagerProps {
  onClose: () => void;
  onAssetSelect?: (url: string) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ onClose, onAssetSelect }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadCollapsed, setIsUploadCollapsed] = useState(false);
  const toast = useToast();

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileUpload = useCallback(async (files: FileList, fileInput?: HTMLInputElement) => {
    try {
      // Upload file to backend API
      await uploadAssets(files);

      // Refresh assets list
      const newAssets = await listAssets();
      setAssets(newAssets);
      if (fileInput){
        fileInput.value = '';
      }
      toast.showInfo('Copied to clipboard')
    } catch (error) {
      console.error('Error uploading asset:', error);
    }
  }, []);

  const handleAssetClick = useCallback((asset: Asset) => {
    navigator.clipboard.writeText(asset.url).then(() => {
      console.log('Copied the text to clipboard');
    }).catch(err => {
      console.error('Error copying text: ', err);
    });

    toast.showInfo(`Copied to clipboard: ${asset.url}`, 1000000)

    if (onAssetSelect){
      onAssetSelect(asset.url)
    }
    onClose();
  }, [onAssetSelect, onClose]);

  const filteredAssets = assets.filter(asset =>
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const loadAssets = async () => {
      const newAssets = await listAssets();
      setAssets(newAssets);
    };
    loadAssets();
  }, []);

  return (<>
    <DialogCard
            // isOpen={isOpen}
          onClose={onClose}
          //   title={t('assetManager.title')}
          className="asset-manager"
          collapsed={isUploadCollapsed}
          headerLabel={t('assetManager.title')}
          onChangeCollapsed={setIsUploadCollapsed}          onChangeHighlighted={function (value: boolean): void {
              throw new Error('Function not implemented.');
          } }   onChangeMaximized={function (value: boolean): void {
              throw new Error('Function not implemented.');
          } }    >
      <div className="asset-manager-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('assetManager.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <IconSearch className="search-icon" />
        </div>
        <div className="asset-list">
          <div className="upload-area"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}>
              <IconUpload className="upload-icon" />
              <p>{t('assetManager.dragDrop')}</p>
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, e.target)}
                accept="image/*,video/*,audio/*"
                className="file-input"
              />
            </div>
          </div>


          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="asset-item"
              onClick={() => handleAssetClick(asset)}
            >
              <div className="asset-preview">
                {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(asset.type) && (
                  <img src={asset.url} alt={asset.name} />
                )}
                {['mp4', 'webm', 'ogg'].includes(asset.type) && (
                  <video src={asset.url} controls />
                )}
                {['mp3', 'wav', 'ogg'].includes(asset.type) && (
                  <audio src={asset.url} controls />
                )}
              </div>
              <div className="asset-info">
                <span className="asset-name">{asset.name}</span><br/>
                <span className="asset-size">{formatFileSize(asset.size)}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </DialogCard></>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadAssets = async (files: FileList, onProgress?: (progress: number) => void): Promise<void> => {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files selected');
      }

      const totalFiles = files.length;
      let uploadedFiles = 0;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        await uploadAsset(file, (progress) => {
          if (onProgress) {
            onProgress((uploadedFiles + progress / totalFiles) * 100);
          }
        });
        uploadedFiles++;
      }

    } catch (error: any) {
      console.error('Error uploading assets:', error);
    }
};

// Helper function to upload asset to backend API with progress tracking
const uploadAsset = async (file: File, onProgress?: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, MP4, MP3');
      }

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          console.log('Asset uploaded successfully:', result);
          if (onProgress) onProgress(100);
          resolve();
        } else {
          reject(new Error(xhr.statusText || 'Failed to upload asset'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', '/api/assets/upload', true);
      xhr.send(formData);
    } catch (error: any) {
      console.error('Error uploading asset:', error);
      reject(error);
    }
  });
};

// Helper function to list assets
const listAssets = async (): Promise<Asset[]> => {
  try {
    const response = await fetch('/api/assets');
    if (!response.ok) {
      throw new Error('Failed to list assets');
    }
    const assets = (await response.json()).map((asset: any) => ({
      id: asset.filename,
      name: asset.originalname,
      url: asset.path,
      type: asset.filename.split('.').pop() || 'unknown',
      size: asset.size,
      uploadedAt: new Date(),
    }))
    console.warn(assets)
    return assets;
  } catch (error) {
    console.error('Error listing assets:', error);
    throw error;
  }
};
