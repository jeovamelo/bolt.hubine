import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import { Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

interface Finding {
  type: string;
  severity: 'high' | 'warning' | 'info' | 'medium';
  message: string;
  file?: string;
}

export default function SecurityTab() {
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const files = useStore(workbenchStore.files);

  const handleScan = async () => {
    setScanning(true);

    try {
      const response = await fetch('/api/security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });

      const result = (await response.json()) as { status: string; findings: Finding[]; timestamp: string };

      setFindings(result.findings || []);
      setLastScan(result.timestamp);

      if (result.status === 'ok') {
        toast.success('✓ No security issues found');
      } else {
        toast.warning(`Found ${result.findings?.length || 0} issue(s)`);
      }
    } catch (error) {
      toast.error('Security scan failed');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const severityColors: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400',
    medium: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="flex flex-col gap-1 border-b border-bolt-elements-borderColor pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">Security Scanner</h2>
        </div>
        <p className="text-sm text-bolt-elements-textSecondary font-light">
          Scan for hardcoded secrets and dependency vulnerabilities before deploy
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleScan}
          disabled={scanning}
          className={classNames(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all',
            scanning
              ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600',
          )}
        >
          {scanning ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            'Run Security Scan'
          )}
        </button>
        {lastScan && (
          <span className="text-xs text-bolt-elements-textSecondary self-center">
            Last: {new Date(lastScan).toLocaleString()}
          </span>
        )}
      </div>

      {findings.length === 0 && lastScan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-300">All clear</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              No secrets or critical vulnerabilities detected
            </p>
          </div>
        </motion.div>
      )}

      {findings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <div className="text-sm font-medium text-bolt-elements-textPrimary">
            Found {findings.length} issue{findings.length === 1 ? '' : 's'}
          </div>

          {findings.map((finding, i) => (
            <div
              key={i}
              className={classNames('p-3 rounded-lg border', severityColors[finding.severity] || severityColors.info)}
            >
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{finding.type}</p>
                  <p className="text-xs mt-1 opacity-90">{finding.message}</p>
                  {finding.file && <p className="text-xs mt-1 opacity-75 font-mono">{finding.file}</p>}
                </div>
                <span
                  className={classNames(
                    'text-xs font-semibold uppercase px-2 py-1 rounded whitespace-nowrap flex-shrink-0',
                    'bg-current/20',
                  )}
                >
                  {finding.severity}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div
        layout
        className="p-4 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">What we check:</h3>
        <ul className="text-xs text-bolt-elements-textSecondary space-y-1">
          <li>• Hardcoded API keys, passwords, tokens, secrets</li>
          <li>• AWS credentials and private keys</li>
          <li>• Dependency vulnerabilities (npm audit)</li>
          <li>• Excludes: node_modules, dist, build directories</li>
        </ul>
      </motion.div>
    </div>
  );
}
