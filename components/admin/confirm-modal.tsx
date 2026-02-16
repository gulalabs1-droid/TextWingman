'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  requireSecret?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description,
  requireSecret = false, destructive = false, loading = false,
}: ConfirmModalProps) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireSecret) {
      const res = await fetch('/api/admin/verify-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setError('Invalid admin secret');
        return;
      }
    }
    setError('');
    await onConfirm();
    setSecret('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSecret(''); setError(''); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={destructive ? 'text-red-400' : 'text-white'}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireSecret && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Enter Admin Secret to confirm</label>
            <Input
              type="password"
              placeholder="ADMIN_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (requireSecret && !secret)}
            className={destructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
