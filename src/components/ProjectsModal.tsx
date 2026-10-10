'use client';

import React, { useEffect, useState } from 'react';
import { Copy, FolderOpen, Pencil, Trash2, X } from 'lucide-react';
import {
  deleteProject,
  duplicateProject,
  listProjects,
  MAX_PROJECTS,
  renameProject,
  type StudioProject,
} from '@/lib/studioDraft';

interface ProjectsModalProps {
  onClose: () => void;
  onOpen: (project: StudioProject) => void;
  /** Prévenir l'accueil quand la liste change (bannière « Reprendre ») */
  onChange?: (projects: StudioProject[]) => void;
}

/** « Mes projets » : l'historique des mockups enregistrés sur cet appareil. */
export const ProjectsModal: React.FC<ProjectsModalProps> = ({ onClose, onOpen, onChange }) => {
  const [projects, setProjects] = useState<StudioProject[] | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = async () => {
    const list = await listProjects();
    setProjects(list);
    onChange?.(list);
  };

  useEffect(() => {
    refresh();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitRename = async (id: string) => {
    await renameProject(id, renameValue);
    setRenamingId(null);
    refresh();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Mes projets"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0c0d14] border border-zinc-800 w-full sm:max-w-3xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col text-left">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-violet-400" />
              Mes projets
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Enregistrés automatiquement sur cet appareil (les {MAX_PROJECTS} plus récents).
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          {projects === null && <p className="text-xs text-zinc-500">Chargement…</p>}
          {projects?.length === 0 && (
            <p className="text-xs text-zinc-400 p-4 rounded-xl border border-dashed border-zinc-700">
              Aucun projet pour l&apos;instant. Collez l&apos;adresse d&apos;un site : chaque mockup est enregistré automatiquement ici.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects?.map((p) => (
              <div key={p.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden flex flex-col">
                <button type="button" onClick={() => onOpen(p)} className="block" aria-label={`Ouvrir ${p.name}`}>
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" className="w-full aspect-[16/10] object-cover object-top bg-zinc-800" />
                  ) : (
                    <div className="w-full aspect-[16/10] bg-zinc-800" />
                  )}
                </button>
                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  {renamingId === p.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitRename(p.id);
                      }}
                      className="flex gap-1.5"
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        maxLength={80}
                        aria-label="Nouveau nom du projet"
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                      <button type="submit" className="px-2 rounded-lg bg-violet-600 text-white text-[11px] font-bold">
                        OK
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs font-bold text-white truncate" title={p.name}>
                      {p.name}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500">
                    Modifié le {new Date(p.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <div className="flex items-center gap-1 mt-auto pt-1">
                    <button
                      type="button"
                      onClick={() => onOpen(p)}
                      className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold"
                    >
                      Ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await duplicateProject(p.id);
                        refresh();
                      }}
                      aria-label={`Dupliquer ${p.name}`}
                      title="Dupliquer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(p.id);
                        setRenameValue(p.name);
                      }}
                      aria-label={`Renommer ${p.name}`}
                      title="Renommer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteId === p.id ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteProject(p.id);
                          setConfirmDeleteId(null);
                          refresh();
                        }}
                        className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                      >
                        Confirmer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.id)}
                        aria-label={`Supprimer ${p.name}`}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
