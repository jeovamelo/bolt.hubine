import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { execSync } from 'child_process';

const SECRET_PATTERNS = [
  /api[_-]?key['\"]?\s*[:=]\s*['\"]?[a-zA-Z0-9]{10,}/gi,
  /password['\"]?\s*[:=]\s*['\"]?[^'"\s]{6,}/gi,
  /token['\"]?\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{15,}/gi,
  /secret['\"]?\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{10,}/gi,
  /AWS_SECRET_ACCESS_KEY/gi,
  /PRIVATE_KEY/gi,
];

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { files } = (await request.json()) as {
      files?: Record<string, { content: string; type: string }>;
    };

    const findings: Array<{
      type: string;
      message: string;
      file?: string;
      severity: 'high' | 'warning' | 'info' | 'medium';
    }> = [];

    // Scan for secrets in files
    if (files) {
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type !== 'file') {
          continue;
        }

        if (filePath.includes('node_modules') || filePath.includes('dist')) {
          continue;
        }

        const content = dirent.content;

        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            findings.push({
              type: 'secret',
              severity: 'high',
              file: filePath,
              message: `Potential secret detected (${pattern.source.slice(0, 20)}...)`,
            });
            pattern.lastIndex = 0;
          }
        }
      }
    }

    // Run npm audit (non-blocking, best effort)
    const auditFindings: Array<{ type: string; severity: 'high' | 'warning' | 'info' | 'medium'; message: string }> =
      [];

    try {
      const auditOutput = execSync('npm audit --json 2>&1', { encoding: 'utf-8', stdio: 'pipe' });

      const audit = JSON.parse(auditOutput);

      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vulns]: [string, any]) => {
          if (Array.isArray(vulns.via)) {
            vulns.via.forEach((vuln: any) => {
              auditFindings.push({
                type: 'vulnerability',
                severity: vuln.severity || 'medium',
                message: `${pkg}: ${vuln.title || 'Dependency vulnerability'}`,
              });
            });
          }
        });
      }
    } catch {
      // npm audit not available or failed silently
    }

    findings.push(...auditFindings);

    return json({
      status: findings.length === 0 ? 'ok' : 'found',
      findings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Security scan failed',
      },
      { status: 500 },
    );
  }
}
