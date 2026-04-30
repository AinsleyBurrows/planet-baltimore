import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Upload, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import DocumentUploadModal from './DocumentUploadModal';

const docTypeLabels = {
  meeting_minutes: 'Meeting Minutes',
  budget_report: 'Budget Report',
  map: 'Map',
  handbook: 'Handbook',
  policy: 'Policy',
  other: 'Document',
};

const docTypeIcons = {
  meeting_minutes: '📋',
  budget_report: '📊',
  map: '🗺️',
  handbook: '📖',
  policy: '⚖️',
  other: '📄',
};

function DocumentViewer({ doc, onClose }) {
  const isPdf = doc.file_url?.toLowerCase().includes('.pdf') || doc.file_url?.toLowerCase().includes('pdf');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{docTypeIcons[doc.document_type]}</span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{doc.name}</p>
            {doc.created_date && (
              <p className="text-xs text-muted-foreground">{format(new Date(doc.created_date), 'MMM d, yyyy')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isPdf ? (
          <iframe
            src={`${doc.file_url}#view=FitH`}
            className="w-full h-full border-none"
            title={doc.name}
          />
        ) : (
          /* For non-PDF files, show a preview or fallback */
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <span className="text-6xl">{docTypeIcons[doc.document_type]}</span>
            <div>
              <p className="font-semibold text-foreground text-lg">{doc.name}</p>
              {doc.description && <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>}
            </div>
            <p className="text-sm text-muted-foreground">This file type cannot be previewed in-app.</p>
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download & Open
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc, isAdmin, onDelete, onView }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
      <button
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
        onClick={() => onView(doc)}
      >
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-lg">
          {docTypeIcons[doc.document_type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate hover:text-accent transition-colors">{doc.name}</p>
          {doc.description && <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <Badge variant="secondary" className="text-xs">{docTypeLabels[doc.document_type]}</Badge>
            {doc.uploaded_by_name && <span>{doc.uploaded_by_name}</span>}
            {doc.created_date && (
              <>
                <span>·</span>
                <span>{format(new Date(doc.created_date), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Download document"
          onClick={e => e.stopPropagation()}
        >
          <Download className="w-4 h-4" />
        </a>
        {isAdmin && (
          <button
            onClick={() => {
              if (window.confirm('Delete this document?')) {
                onDelete(doc.id);
              }
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            aria-label="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DocumentsTab({ associationId, isAdmin }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: documents = [] } = useQuery({
    queryKey: ['association-documents', associationId],
    queryFn: () => base44.entities.AssociationDocument.filter({ association_id: associationId }, '-created_date', 100),
    enabled: !!associationId,
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.AssociationDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association-documents', associationId] });
    },
  });

  const handleUploadSuccess = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({ queryKey: ['association-documents', associationId] });
  };

  // Group documents by type
  const docsByType = {};
  documents.forEach(doc => {
    if (!docsByType[doc.document_type]) {
      docsByType[doc.document_type] = [];
    }
    docsByType[doc.document_type].push(doc);
  });

  const typeOrder = ['meeting_minutes', 'budget_report', 'map', 'handbook', 'policy', 'other'];
  const sortedTypes = typeOrder.filter(type => docsByType[type]);

  return (
    <>
    {viewingDoc && <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    <div className="space-y-6">
      {isAdmin && (
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all w-full justify-center"
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Upload Document</span>
        </button>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">No documents yet.</p>
          {isAdmin && <p className="text-xs text-muted-foreground mt-1">Upload meeting minutes, budgets, maps, and more.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedTypes.map(type => (
            <div key={type}>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-lg">{docTypeIcons[type]}</span>
                {docTypeLabels[type]}
              </h3>
              <div className="space-y-2">
                {docsByType[type].map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isAdmin={isAdmin}
                    onDelete={deleteDocMutation.mutate}
                    onView={setViewingDoc}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && currentUser && (
        <DocumentUploadModal
          associationId={associationId}
          currentUser={currentUser}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
    </>
  );
}