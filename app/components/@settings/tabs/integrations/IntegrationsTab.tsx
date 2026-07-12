import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '~/components/ui/Switch';
import { toast } from 'react-toastify';
import { 
  Code, Cloud, Cpu, Mail, Palette, CreditCard, 
  ShoppingBag, Link2, Wrench, BarChart2, Shield, Rocket, Puzzle 
} from 'lucide-react';

interface Integration {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'configured' | 'setup';
  badge?: string;
  category: string;
  actionLabel?: string;
  actionUrl?: string;
}

const CATEGORIES = [
  { id: 'dev', name: '🏗️ Desenvolvimento & Código', icon: Code },
  { id: 'cloud', name: '☁️ Lovable Cloud', icon: Cloud },
  { id: 'ai', name: '🤖 Lovable AI Gateway', icon: Cpu },
  { id: 'email', name: '📧 Lovable Email', icon: Mail },
  { id: 'design', name: '🎨 Design & UI', icon: Palette },
  { id: 'payments', name: '💳 Pagamentos', icon: CreditCard },
  { id: 'ecommerce', name: '🛍️ E-commerce', icon: ShoppingBag },
  { id: 'connectors', name: '🔌 Conectores Standard', icon: Link2 },
  { id: 'mcp', name: '🧠 MCP Connectors', icon: Wrench },
  { id: 'seo', name: '📊 SEO & Analytics', icon: BarChart2 },
  { id: 'security', name: '🔒 Segurança', icon: Shield },
  { id: 'publish', name: '🚀 Publicação', icon: Rocket },
  { id: 'other', name: '🧩 Outros Recursos', icon: Puzzle },
];

const INITIAL_INTEGRATIONS: Integration[] = [
  // Dev
  { id: 'ai-editor', title: 'Editor de Código com IA', description: 'Geração, edição, refatoração e debugging via chat em linguagem natural.', enabled: true, status: 'active', category: 'dev' },
  { id: 'standard-stack', title: 'Stack Padrão (React 19 + TanStack Start)', description: 'Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui e Lucide Icons.', enabled: true, status: 'active', category: 'dev' },
  { id: 'realtime-preview', title: 'Preview em Tempo Real', description: 'Visualização instantânea das alterações direto no navegador.', enabled: true, status: 'active', category: 'dev' },
  { id: 'version-history', title: 'Histórico de Versões', description: 'Rollback e controle de versão para qualquer estado anterior do projeto.', enabled: true, status: 'active', category: 'dev' },
  { id: 'github-sync', title: 'Sincronização Bidirecional GitHub', description: 'Commits automáticos, gerenciamento de branches e Pull Requests.', enabled: false, status: 'setup', category: 'dev', actionLabel: 'Configurar GitHub' },
  { id: 'dev-chat-mode', title: 'Modo Dev/Chat', description: 'Alternar entre construir o projeto e discutir arquitetura e ideias.', enabled: true, status: 'active', category: 'dev' },
  { id: 'debug-tools', title: 'Ferramentas de Debug', description: 'Leitura de console logs, requisições de rede, erros em runtime e session replay.', enabled: true, status: 'active', category: 'dev' },

  // Cloud
  { id: 'supabase-db', title: 'PostgreSQL & Migrations', description: 'Banco de dados PostgreSQL com migrations versionadas gerenciado pelo Supabase.', enabled: false, status: 'setup', category: 'cloud', actionLabel: 'Configurar Supabase' },
  { id: 'rls-policies', title: 'Row-Level Security (RLS)', description: 'Políticas de segurança integradas direto no banco de dados.', enabled: false, status: 'setup', category: 'cloud' },
  { id: 'oauth-auth', title: 'Autenticação Avançada', description: 'E-mail/senha, Google, Apple, Microsoft, magic links e SAML SSO.', enabled: false, status: 'setup', category: 'cloud' },
  { id: 'storage-buckets', title: 'Buckets & Signed URLs', description: 'Armazenamento de arquivos públicos e privados com URLs assinadas temporárias.', enabled: false, status: 'setup', category: 'cloud' },
  { id: 'realtime-subscriptions', title: 'Realtime Subscriptions', description: 'Inscrições em tempo real para tabelas de dados.', enabled: false, status: 'setup', category: 'cloud' },

  // AI Gateway
  { id: 'gemini-models', title: 'Google Gemini 2.5/3.x', description: 'Modelos Pro, Flash e Flash-Lite integrados nativamente.', enabled: true, status: 'active', category: 'ai' },
  { id: 'openai-gpt5', title: 'OpenAI GPT-5/5.4/5.5', description: 'Inclusão de modelos mini/nano/pro no gateway central.', enabled: true, status: 'active', category: 'ai' },
  { id: 'computer-vision', title: 'Visão Computacional', description: 'Análise avançada de imagens e design multimodal.', enabled: true, status: 'active', category: 'ai' },
  { id: 'image-generation', title: 'Geração de Imagens', description: 'Criação de assets integrando Gemini Nano Banana e Gemini 3 Pro Image.', enabled: true, status: 'active', category: 'ai' },
  { id: 'stt-tts', title: 'Speech-to-Text & Text-to-Speech', description: 'Conversão de áudio para texto e voz de IA em tempo real.', enabled: true, status: 'active', category: 'ai' },
  { id: 'semantic-search', title: 'Embeddings & RAG', description: 'Busca semântica no código-fonte e documentos de suporte.', enabled: true, status: 'active', category: 'ai' },

  // Email
  { id: 'custom-email', title: 'Branding de E-mail', description: 'Templates transacionais e de autenticação com domínio customizado.', enabled: false, status: 'setup', category: 'email' },

  // Design
  { id: 'video-gen', title: 'Geração de Vídeos', description: 'Criação de vídeos promocionais ou assets dinâmicos via prompt.', enabled: false, status: 'setup', category: 'design', badge: 'Beta' },
  { id: 'design-directions', title: 'Design Directions', description: 'Exibição de protótipos visuais lado a lado para escolha de estilo.', enabled: true, status: 'active', category: 'design' },
  { id: 'shadcn-components', title: 'Componentes shadcn/ui', description: 'Biblioteca pré-instalada com temas dark/light inteligentes.', enabled: true, status: 'active', category: 'design' },
  { id: 'viewport-switcher', title: 'Preview Responsivo', description: 'Viewport switcher para testar visualizações mobile, tablet e desktop.', enabled: true, status: 'active', category: 'design' },

  // Payments
  { id: 'stripe-pay', title: 'Stripe Integration', description: 'Cobranças, checkout, assinaturas e pagamentos recorrentes nativos.', enabled: false, status: 'setup', category: 'payments' },
  { id: 'paddle-pay', title: 'Paddle Integration', description: 'Moeda local, impostos internacionais simplificados e pagamentos globais.', enabled: false, status: 'setup', category: 'payments' },

  // Ecommerce
  { id: 'shopify-store', title: 'Shopify Store Connector', description: 'Sincronização de catálogo, produtos, inventário e checkout nativo.', enabled: false, status: 'setup', category: 'ecommerce' },

  // Standard Connectors
  { id: 'gworkspace', title: 'Google Workspace', description: 'Integração de planilhas, documentos e drive.', enabled: false, status: 'setup', category: 'connectors' },
  { id: 'slack-notion', title: 'Slack & Notion Connectors', description: 'Notificações e documentação sincronizadas automaticamente.', enabled: false, status: 'setup', category: 'connectors' },

  // MCP
  { id: 'mcp-figma', title: 'Figma & Miro Context', description: 'Fornece contexto de design diretamente para o agente.', enabled: false, status: 'setup', category: 'mcp', actionLabel: 'Configurar MCP' },
  { id: 'mcp-sentry', title: 'Sentry & PostHog', description: 'Envio de logs de erro e analytics para o contexto da IA.', enabled: false, status: 'setup', category: 'mcp', actionLabel: 'Configurar MCP' },

  // SEO
  { id: 'semrush-seo', title: 'Semrush Integration', description: 'Pesquisa de palavras-chave, análise de competidores e ranking SERP.', enabled: false, status: 'setup', category: 'seo' },
  { id: 'seo-scanner', title: 'SEO Scanner Automático', description: 'Varredura automática e correção de tags, sitemaps e metadados.', enabled: true, status: 'active', category: 'seo' },

  // Security
  { id: 'security-scanner', title: 'Security Scanner', description: 'Detecção de brechas e políticas de CORS/Rate Limit automáticas.', enabled: true, status: 'active', category: 'security' },
  { id: 'dependency-scan', title: 'Dependency Scan', description: 'Busca ativa de vulnerabilidades em pacotes npm instalados.', enabled: true, status: 'active', category: 'security' },

  // Publish
  { id: 'one-click-deploy', title: 'Deploy em 1-Clique', description: 'Publicação imediata em domínio customizado com SSL automático.', enabled: true, status: 'active', category: 'publish' },

  // Other
  { id: 'doc-parsing', title: 'Parsing de Documentos', description: 'Extração inteligente de texto e tabelas de PDFs ou DOCs.', enabled: true, status: 'active', category: 'other' },
  { id: 'web-search', title: 'Busca na Web Integrada', description: 'Agente pesquisa fontes atualizadas na internet ao gerar respostas.', enabled: true, status: 'active', category: 'other' },
  { id: 'cross-project', title: 'Cópia Cross-Project', description: 'Cópia direta de componentes e assets entre projetos do workspace.', enabled: true, status: 'active', category: 'other' },
];

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hubine_integrations');
    if (saved) {
      try {
        setIntegrations(JSON.parse(saved));
      } catch {
        setIntegrations(INITIAL_INTEGRATIONS);
      }
    } else {
      setIntegrations(INITIAL_INTEGRATIONS);
    }
  }, []);

  const saveIntegrations = (updated: Integration[]) => {
    setIntegrations(updated);
    localStorage.setItem('hubine_integrations', JSON.stringify(updated));
  };

  const handleToggle = (id: string, enabled: boolean) => {
    const updated = integrations.map(item => {
      if (item.id === id) {
        const status: 'active' | 'setup' = enabled ? 'active' : 'setup';
        toast.success(`${item.title} ${enabled ? 'ativada' : 'desativada'} com sucesso!`);
        return { ...item, enabled, status };
      }
      return item;
    });
    saveIntegrations(updated);
  };

  return (
    <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-col gap-1 border-b border-bolt-elements-borderColor pb-4">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">Recursos & Integrações do Hubine</h2>
        <p className="text-sm text-bolt-elements-textSecondary font-light">
          Gerencie e ative conexões de e-commerce, gateway de IA, Supabase, Stripe, MCP e outros recursos avançados do ecossistema.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {CATEGORIES.map(category => {
          const categoryIntegrations = integrations.filter(i => i.category === category.id);
          if (categoryIntegrations.length === 0) return null;

          const IconComponent = category.icon;

          return (
            <div key={category.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-bolt-elements-borderColor/30 pb-2">
                <IconComponent className="w-5 h-5 text-purple-500" />
                <h3 className="text-md font-semibold text-bolt-elements-textPrimary">{category.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryIntegrations.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    className="relative group bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-all duration-200 rounded-lg border border-bolt-elements-borderColor/50 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-bolt-elements-textPrimary text-sm">{item.title}</h4>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 text-purple-500">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => handleToggle(item.id, checked)}
                        />
                      </div>
                      <p className="text-xs text-bolt-elements-textSecondary mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-bolt-elements-borderColor/20">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-green-500 animate-pulse' : 'bg-bolt-elements-textTertiary'}`} />
                        <span className="text-[10px] uppercase font-semibold text-bolt-elements-textSecondary">
                          {item.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {item.actionLabel && (
                        <button 
                          onClick={() => {
                            toast.info(`Configurando ${item.title}...`);
                          }}
                          className="text-[10px] font-semibold text-purple-500 hover:text-purple-600 hover:underline transition-colors"
                        >
                          {item.actionLabel}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
