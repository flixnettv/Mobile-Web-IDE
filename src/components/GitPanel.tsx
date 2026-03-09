import React, { useState } from 'react';
import { GitBranch, Plus, Minus, UploadCloud, DownloadCloud, RefreshCw, FolderPlus, CheckCircle2, Globe, Trash2, ChevronRight } from 'lucide-react';
import { showPrompt, showConfirm } from './Modal';
import { toast } from './Toast';

interface Props {
  gitStatus: any; branches: any; remotes: any[];
  isGitHubConnected: boolean; isLoading: boolean;
  t: Record<string, string>; isRtl: boolean;
  onRefresh: () => void;
}

async function api(url: string, body?: object) {
  const res = await fetch(url, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function GitPanel({ gitStatus, branches, remotes, isGitHubConnected, isLoading, t, isRtl, onRefresh }: Props) {
  const [commitMessage, setCommitMessage] = useState('');
  const [gitDiff, setGitDiff] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const handleCommit = () => act(async () => {
    if (!commitMessage.trim()) { toast('warning', 'Enter a commit message'); return; }
    const data = await api('/api/git/commit', { message: commitMessage });
    if (data.error) toast('error', data.error);
    else { toast('success', t.commitSuccess || 'Committed!'); setCommitMessage(''); onRefresh(); }
  });

  const push = () => act(async () => {
    const data = await api('/api/git/push', { remote: 'origin', branch: 'main' });
    if (data.error) toast('error', data.error);
    else { toast('success', t.pushSuccess); onRefresh(); }
  });

  const pull = () => act(async () => {
    const data = await api('/api/git/pull', { remote: 'origin', branch: 'main' });
    if (data.error) toast('error', data.error);
    else { toast('success', t.pullSuccess); onRefresh(); }
  });

  const fetchGit = () => act(async () => {
    const data = await api('/api/git/fetch', {});
    if (data.error) toast('error', data.error);
    else toast('success', t.fetchSuccess);
  });

  const cloneRepo = async () => {
    const url = await showPrompt(t.cloneRepo, 'Enter repository URL:');
    if (!url) return;
    act(async () => {
      const data = await api('/api/git/clone', { url });
      if (data.error) toast('error', data.error);
      else { toast('success', t.cloneSuccess); onRefresh(); }
    });
  };

  const createBranch = async () => {
    const name = await showPrompt(t.createBranch, t.enterName);
    if (!name) return;
    act(async () => {
      const data = await api('/api/git/branch/create', { name });
      if (data.error) toast('error', data.error);
      else { toast('success', `Branch "${name}" created`); onRefresh(); }
    });
  };

  const switchBranch = (branch: string) => act(async () => {
    const data = await api('/api/git/branch/switch', { branch });
    if (data.error) toast('error', data.error);
    else { toast('success', `Switched to ${branch}`); onRefresh(); }
  });

  const fetchDiff = async (filePath: string) => {
    setSelectedFile(filePath);
    const data = await api('/api/git/diff', { path: filePath });
    setGitDiff(data.diff || t.noDiff);
  };

  const stageFile = async (p: string) => {
    await api('/api/git/stage', { path: p });
    onRefresh();
  };

  const unstageFile = async (p: string) => {
    await api('/api/git/unstage', { path: p });
    onRefresh();
  };

  const addRemote = async () => {
    const name = await showPrompt(t.remotes, t.remoteName || 'Remote name (e.g. origin)');
    if (!name) return;
    const url = await showPrompt(t.remotes, t.remoteUrl || 'Remote URL');
    if (!url) return;
    const data = await api('/api/git/remote/add', { name, url });
    if (data.error) toast('error', data.error);
    else { toast('success', 'Remote added'); onRefresh(); }
  };

  const removeRemote = async (name: string) => {
    const ok = await showConfirm(t.delete, `Remove remote "${name}"?`);
    if (!ok) return;
    const data = await api('/api/git/remote/remove', { name });
    if (data.error) toast('error', data.error);
    else { toast('success', 'Remote removed'); onRefresh(); }
  };

  const connectGitHub = async () => {
    try {
      const r = await fetch('/api/auth/github/url');
      const d = await r.json();
      if (d.url) window.open(d.url, 'github_auth', 'width=600,height=700');
      else toast('error', d.error || 'GitHub not configured');
    } catch { toast('error', 'GitHub connection failed'); }
  };

  const spinner = busy || isLoading;

  if (gitDiff !== null) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setGitDiff(null)} className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-bold">
            <ChevronRight size={14} className={isRtl ? '' : 'rotate-180'} />
            {t.back}
          </button>
          <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{selectedFile}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/30 rounded border border-[#334155] p-3">
          <pre className="text-[11px] font-mono whitespace-pre-wrap text-gray-300 leading-relaxed">{gitDiff}</pre>
        </div>
      </div>
    );
  }

  const stagedFiles = gitStatus?.files?.filter((f: any) => f.index !== ' ' && f.index !== '?') || [];
  const unstagedFiles = gitStatus?.files?.filter((f: any) => f.working_dir !== ' ' || f.index === '?') || [];

  return (
    <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto custom-scrollbar">
      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button onClick={pull} disabled={spinner} className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-[#334155] py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50">
          <DownloadCloud size={13} /> {t.pull}
        </button>
        <button onClick={push} disabled={spinner} className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-[#334155] py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50">
          <UploadCloud size={13} /> {t.push}
        </button>
        <button onClick={fetchGit} disabled={spinner} className="p-1.5 bg-white/5 hover:bg-white/10 border border-[#334155] rounded-lg transition-colors disabled:opacity-50" title={t.fetch}>
          <RefreshCw size={13} className={spinner ? 'animate-spin' : ''} />
        </button>
        <button onClick={cloneRepo} disabled={spinner} className="p-1.5 bg-white/5 hover:bg-white/10 border border-[#334155] rounded-lg transition-colors disabled:opacity-50" title={t.cloneRepo}>
          <FolderPlus size={13} />
        </button>
      </div>

      {/* Commit */}
      <div className="flex flex-col gap-2">
        <textarea
          value={commitMessage}
          onChange={e => setCommitMessage(e.target.value)}
          placeholder={t.message}
          className="bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-[13px] focus:outline-none focus:border-blue-500 resize-none h-16 transition-colors"
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleCommit()}
        />
        <button onClick={handleCommit} disabled={spinner || !commitMessage.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-1.5 rounded-lg text-[12px] font-bold transition-all">
          {t.commit}
        </button>
      </div>

      {/* Staged */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between py-1 border-b border-[#334155]">
            <span className="text-[10px] text-gray-500 uppercase font-bold">{t.stagedChanges}</span>
            <span className="bg-white/10 px-1.5 rounded text-[10px]">{stagedFiles.length}</span>
          </div>
          {stagedFiles.map((f: any) => (
            <div key={`s-${f.path}`} onClick={() => fetchDiff(f.path)} className="flex items-center justify-between py-1 text-[12px] group cursor-pointer hover:bg-white/5 px-2 rounded">
              <div className="flex items-center gap-2 overflow-hidden text-gray-300">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.index === 'M' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                <span className="truncate">{f.path}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); unstageFile(f.path); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded" title="Unstage">
                <Minus size={12} className="text-gray-500 hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unstaged */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between py-1 border-b border-[#334155]">
          <span className="text-[10px] text-gray-500 uppercase font-bold">{t.changes}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => api('/api/git/stage', { path: '.' }).then(onRefresh)} className="text-[10px] text-blue-400 hover:underline px-1">{t.stageAll}</button>
            <span className="bg-white/10 px-1.5 rounded text-[10px]">{unstagedFiles.length}</span>
          </div>
        </div>
        {unstagedFiles.map((f: any) => (
          <div key={`u-${f.path}`} onClick={() => fetchDiff(f.path)} className="flex items-center justify-between py-1 text-[12px] group cursor-pointer hover:bg-white/5 px-2 rounded">
            <div className="flex items-center gap-2 overflow-hidden text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.working_dir === 'M' ? 'bg-yellow-400' : f.index === '?' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="truncate">{f.path}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); stageFile(f.path); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded" title="Stage">
              <Plus size={12} className="text-gray-500 hover:text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Branches */}
      <div className="flex flex-col gap-1 border-t border-[#334155] pt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 uppercase font-bold">{t.branches}</span>
          <button onClick={createBranch} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white"><Plus size={12} /></button>
        </div>
        {branches?.all?.map((b: string) => (
          <div key={b} onClick={() => switchBranch(b)} className={`flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded cursor-pointer ${branches.current === b ? 'bg-blue-900/20' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <GitBranch size={11} className={branches.current === b ? 'text-blue-400' : 'text-gray-600'} />
              <span className={`text-[11px] truncate ${branches.current === b ? 'font-bold text-white' : 'text-gray-400'}`}>{b}</span>
            </div>
            {branches.current === b && <CheckCircle2 size={11} className="text-blue-400 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Remotes */}
      <div className="flex flex-col gap-1 border-t border-[#334155] pt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 uppercase font-bold">{t.remotes}</span>
          <button onClick={addRemote} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white"><Plus size={12} /></button>
        </div>
        {remotes.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded group">
            <div className="flex items-center gap-2 overflow-hidden">
              <Globe size={11} className="text-gray-600 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-bold text-gray-300">{r.name}</span>
                <span className="text-[9px] text-gray-600 truncate">{r.refs?.fetch}</span>
              </div>
            </div>
            <button onClick={() => removeRemote(r.name)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* GitHub */}
      <div className="flex flex-col gap-2 border-t border-[#334155] pt-3">
        <button onClick={connectGitHub} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${isGitHubConnected ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-white text-black hover:bg-gray-200'}`}>
          <GitBranch size={13} />
          {isGitHubConnected ? '✓ Connected to GitHub' : t.connectGitHub}
        </button>
      </div>
    </div>
  );
}
