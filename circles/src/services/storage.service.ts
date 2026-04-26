import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Storage Service
 * 
 * Handles file uploads to Firebase Storage
 */

/**
 * Upload image with compression
 */
export const uploadImage = async (
  uri: string,
  path: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Default options
    const maxWidth = options?.maxWidth || 1920;
    const maxHeight = options?.maxHeight || 1920;
    const quality = options?.quality || 0.8;

    // Compress image
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Convert to blob
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    console.log('Image uploaded:', path);

    return { success: true, url };
  } catch (error: any) {
    console.error('Upload image error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
};

/**
 * Upload thumbnail (smaller version)
 */
export const uploadThumbnail = async (
  uri: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  return uploadImage(uri, path, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
  });
};

/**
 * Upload video
 */
export const uploadVideo = async (
  uri: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    console.log('Video uploaded:', path);

    return { success: true, url };
  } catch (error: any) {
    console.error('Upload video error:', error);
    return { success: false, error: 'Failed to upload video' };
  }
};

/**
 * Upload file
 */
export const uploadFile = async (
  uri: string,
  path: string,
  mimeType?: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    const metadata = mimeType ? { contentType: mimeType } : undefined;
    await uploadBytes(storageRef, blob, metadata);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    console.log('File uploaded:', path);

    return { success: true, url };
  } catch (error: any) {
    console.error('Upload file error:', error);
    return { success: false, error: 'Failed to upload file' };
  }
};

/**
 * Delete file
 */
export const deleteFile = async (
  path: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    console.log('File deleted:', path);

    return { success: true };
  } catch (error: any) {
    console.error('Delete file error:', error);

    // Ignore if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }

    return { success: false, error: 'Failed to delete file' };
  }
};

/**
 * Delete multiple files
 */
export const deleteFiles = async (
  paths: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    await Promise.all(paths.map((path) => deleteFile(path)));

    console.log('Files deleted:', paths.length);

    return { success: true };
  } catch (error: any) {
    console.error('Delete files error:', error);
    return { success: false, error: 'Failed to delete files' };
  }
};

/**
 * List files in a directory
 */
export const listFiles = async (
  path: string
): Promise<{ success: boolean; files?: string[]; error?: string }> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    const files = result.items.map((item) => item.fullPath);

    console.log('Files listed:', files.length);

    return { success: true, files };
  } catch (error: any) {
    console.error('List files error:', error);
    return { success: false, error: 'Failed to list files' };
  }
};

/**
 * Get file download URL
 */
export const getFileURL = async (
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error: any) {
    console.error('Get file URL error:', error);
    return { success: false, error: 'Failed to get file URL' };
  }
};

/**
 * Get file size
 */
export const getFileSize = async (uri: string): Promise<number> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.size || 0;
  } catch (error) {
    console.error('Get file size error:', error);
    return 0;
  }
};

/**
 * Generate unique file path
 */
export const generateFilePath = (
  folder: string,
  userId: string,
  extension: string
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${folder}/${userId}/${timestamp}_${random}.${extension}`;
};

/**
 * Generate circle photo path
 */
export const generateCirclePhotoPath = (circleId: string): string => {
  return `circles/${circleId}/photo.jpg`;
};

/**
 * Generate memory lane photo path
 */
export const generateMemoryPhotoPath = (circleId: string, userId: string): string => {
  const timestamp = Date.now();
  return `circles/${circleId}/memories/${userId}_${timestamp}.jpg`;
};

/**
 * Generate chat media path
 */
export const generateChatMediaPath = (
  circleId: string,
  userId: string,
  type: 'image' | 'video'
): string => {
  const timestamp = Date.now();
  const extension = type === 'image' ? 'jpg' : 'mp4';
  return `circles/${circleId}/chat/${userId}_${timestamp}.${extension}`;
};
