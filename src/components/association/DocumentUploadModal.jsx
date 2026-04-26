import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocumentUploadModal({ associationId, currentUser, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    document_type: 'other',
    year: new Date().getFullYear().toString(),
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !form.name) return;
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      return base44.entities.AssociationDocument.create({
        association_id: associationId,
        name: form.name,
        description: form.description,
        document_type: form.document_type,
        year: form.document_type === 'meeting_minutes' || form.document_type === 'budget_report' ? form.year : undefined,
        file_url,
        uploaded_by: currentUser.id,
        uploaded_by_name: currentUser.full_name,
        is_public: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association-documents', associationId] });
      onSuccess();
    },
  });

  const handleFile = (file) => {
    if (file) {
      setSelectedFile(file);
      if (!form.name) {
        const name = file.name.replace(/\.[^/.]+$/, '');
        setForm(f => ({ ...f, name }));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || !form.name.trim()) return;
    uploadMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground">Upload Document</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            } ${selectedFile ? 'bg-green-50/50' : ''}`}
          >
            <Upload className={`w-6 h-6 mx-auto mb-2 ${selectedFile ? 'text-green-600' : 'text-muted-foreground'}`} />
            <p className="font-medium text-foreground text-sm">
              {selectedFile ? selectedFile.name : 'Drop file or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images, etc.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />

          {/* Document Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Document Name *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="e.g., January 2026 Meeting Minutes"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
              placeholder="Add context or notes…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Document Type</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.document_type}
              onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}
            >
              <option value="other">Document</option>
              <option value="meeting_minutes">Meeting Minutes</option>
              <option value="budget_report">Budget Report</option>
              <option value="map">Map</option>
              <option value="handbook">Handbook</option>
              <option value="policy">Policy</option>
            </select>
          </div>

          {/* Year (for minutes/budget) */}
          {(form.document_type === 'meeting_minutes' || form.document_type === 'budget_report') && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Year</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="2026"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !form.name.trim() || uploadMutation.isPending}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}