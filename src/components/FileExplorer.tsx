import React, { useState } from 'react';
import { FileCode, FolderOpen, Folder, Plus, FolderPlus, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { FileItem } from '../types';
import { getFileIcon } from '../utils/language';
import { showPrompt, showConfirm } from './Modal';
import { toast } from './Toast';

interface Props {
  files: FileItem[];
  activeFile: string | null;
  isMobile: boolean;
  t: Record<string, string>;
  onOpenFile: (path: string) => void;
  onRefresh: () => void;
}

async function apiJson(url: string, body?: object) {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function FileNode({
  item, depth, activeFile, isMobile, onOpenFile, onRefresh, t,
}: {
  item: FileItem; depth: number; activeFile: string | null; isMobile: boolean;
  onOpenFile: (p: string) => void; onRefresh: () => void; t: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const icon = getFileIcon(item.name);
  const isDir = item.type === 'directory';
  const isActive = activeFile === item.path;

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = await showPrompt(t.rename, t.enterName, item.name.split('/').pop() || item.name);
    if (!newName) return;
    const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/');
    const data = await apiJson('/api/files/rename', { oldPath: item.path, newPath });
    if (data.success) { onRefresh(); toast('success', t.rename + ' ✓'); }
    else toast('error', data.error || 'Rename failed');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await showConfirm(t.delete, `Delete "${item.name}"?`);
    if (!ok) return;
    const data = await apiJson('/api/files/delete', { path: item.path });
    if (data.success) { onRefresh(); toast('success', 'Deleted'); }
    else toast('error', data.error || 'Delete failed');
  };

  return (
    <div>
      <div
        onClick={() => isDir ? setIsOpen(o => !o) : onOpenFile(item.path)}
        className={`group flex items-center justify-between px-2 ${isMobile ? 'py-2.5' : 'py-1'} cursor-pointer transition-all border-l-2 select-none ${
          isActive
            ? 'bg-[#1e3a5f] text-white border-blue-500'
            : 'hover:bg-white/5 border-transparent text-gray-400 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
          {isDir ? (
            <ChevronRight
              size={13}
              className={`text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-3 shrink-0" />
          )}
          {isDir ? (
            isOpen
              ? <FolderOpen size={15} className="text-blue-400 shrink-0" />
              : <Folder size={15} className="text-blue-400 shrink-0" />
          ) : (
            <span className={`text-[10px] font-bold shrink-0 ${icon.color}`} style={{ minWidth: 14 }}>
              {typeof icon.emoji === 'string' && icon.emoji.length <= 2 ? icon.emoji : <FileCode size={14} />}
            </span>
          )}
          <span className="truncate text-[13px]">{item.name}</span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={handleRename} className="p-1 hover:bg-white/10 rounded" title={t.rename}>
            <Edit3 size={12} className="text-gray-500 hover:text-blue-400" />
          </button>
          <button onClick={handleDelete} className="p-1 hover:bg-white/10 rounded" title={t.delete}>
            <Trash2 size={12} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>
      </div>

      {isDir && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden' }}
            >
              {item.children && item.children.length > 0 ? (
                item.children.map(child => (
                  <FileNode
                    key={child.path}
                    item={child}
                    depth={depth + 1}
                    activeFile={activeFile}
                    isMobile={isMobile}
                    onOpenFile={onOpenFile}
                    onRefresh={onRefresh}
                    t={t}
                  />
                ))
              ) : (
                <div className="text-[11px] text-gray-600 italic py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}>
                  empty
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function FileExplorer({ files, activeFile, isMobile, t, onOpenFile, onRefresh }: Props) {
  const createItem = async (type: 'file' | 'directory') => {
    const name = await showPrompt(type === 'file' ? t.newFile : t.newFolder, t.enterName, '');
    if (!name) return;
    const data = await apiJson('/api/files/create', { name, type });
    if (data.success) { onRefresh(); toast('success', `Created ${name}`); }
    else toast('error', data.error || 'Create failed');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.workspace}</span>
        <div className="flex gap-1">
          <button onClick={() => createItem('file')} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors" title={t.newFile}>
            <Plus size={14} />
          </button>
          <button onClick={() => createItem('directory')} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors" title={t.newFolder}>
            <FolderPlus size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {files.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-xs px-4">
            <FolderOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>No files yet</p>
            <button onClick={() => createItem('file')} className="mt-3 text-blue-400 hover:underline text-xs">
              + {t.newFile}
            </button>
          </div>
        ) : (
          files.map(item => (
            <FileNode
              key={item.path}
              item={item}
              depth={0}
              activeFile={activeFile}
              isMobile={isMobile}
              onOpenFile={onOpenFile}
              onRefresh={onRefresh}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
}
