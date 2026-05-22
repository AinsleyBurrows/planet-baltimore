import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, Users, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('email');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    // Handle quoted CSV values
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    // Try to auto-detect which column is name vs email
    let name = '', email = '';
    for (const col of cols) {
      if (col.includes('@')) email = col;
      else if (col && !name) name = col;
    }
    return { name, email };
  }).filter(r => r.email); // only keep rows with an email
}

export default function CSVFollowerImportModal({ association, onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length === 0) {
        setError('No valid rows found. Make sure the CSV has an "email" column.');
        setParsed(null);
      } else {
        setParsed(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    let added = 0;
    let skipped = 0;

    // Fetch existing Follow records targeting this association to avoid duplicates
    const existingFollows = await base44.entities.Follow.filter({
      target_type: 'community',
      target_id: association.id,
    });
    const existingFollowerIds = new Set(existingFollows.map(f => f.follower_id));

    // Also get existing members
    const existingMembers = await base44.entities.AssociationMember.filter({ association_id: association.id });
    const existingMemberEmails = new Set(existingMembers.map(m => m.user_email?.toLowerCase()));

    for (const row of parsed) {
      const emailLower = row.email.toLowerCase();
      // Add as AssociationMember if not already a member
      if (!existingMemberEmails.has(emailLower)) {
        await base44.entities.AssociationMember.create({
          association_id: association.id,
          user_id: row.email, // use email as fallback id for external imports
          user_name: row.name || row.email,
          user_email: row.email,
          joined_at: new Date().toISOString(),
          role: 'member',
        });
        added++;
      } else {
        skipped++;
      }
    }

    setResult({ added, skipped, total: parsed.length });
    setImporting(false);
    onImported?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Import Followers via CSV</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!result ? (
            <>
              {/* Instructions */}
              <div className="p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Expected CSV format:</p>
                <p>One row per person. Must include an <strong>email</strong> column. A <strong>name</strong> column is optional.</p>
                <code className="block bg-background border border-border rounded px-2 py-1 mt-1 text-xs">name,email<br />Jane Smith,jane@example.com</code>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors"
              >
                <FileText className="w-8 h-8 text-muted-foreground" />
                {fileName ? (
                  <div className="text-center">
                    <p className="font-medium text-sm text-foreground">{fileName}</p>
                    {parsed && <p className="text-xs text-green-600 mt-1">{parsed.length} valid rows detected</p>}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Drop a CSV file here, or <span className="text-primary font-medium">browse</span></p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              {/* Preview */}
              {parsed && parsed.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border text-sm">
                  {parsed.slice(0, 10).map((row, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                        {(row.name || row.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {row.name && <p className="font-medium text-foreground truncate">{row.name}</p>}
                        <p className="text-muted-foreground truncate text-xs">{row.email}</p>
                      </div>
                    </div>
                  ))}
                  {parsed.length > 10 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">+ {parsed.length - 10} more</div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button
                  disabled={!parsed || parsed.length === 0 || importing}
                  onClick={handleImport}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing...</> : <><Upload className="w-4 h-4" />Import {parsed?.length || 0} People</>}
                </Button>
              </div>
            </>
          ) : (
            /* Result */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Import Complete</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">{result.added}</strong> members added</p>
                  {result.skipped > 0 && <p><strong className="text-foreground">{result.skipped}</strong> already existed (skipped)</p>}
                  <p className="text-xs mt-1">Out of {result.total} rows in the CSV</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Done</Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}