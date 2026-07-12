import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import {
  Github,
  Gitlab,
  Cloud,
  Triangle,
  Database,
  Wrench,
  Cpu,
  Laptop,
  Code,
  MessagesSquare,
  Eye,
  Terminal,
  MousePointerClick,
  GitCompare,
  History,
  Sparkles,
  Globe,
  Mic,
  ImagePlus,
  FolderInput,
  FileJson,
  Smartphone,
  Lock,
  Bot,
  CreditCard,
  Search,
  Paintbrush,
  type LucideIcon,
} from 'lucide-react';
import type { TabType } from '~/components/@settings/core/types';
import { isGitHubConnected } from '~/lib/stores/githubConnection';
import { isGitLabConnected } from '~/lib/stores/gitlabConnection';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { supabaseConnection } from '~/lib/stores/supabase';
import { useMCPStore } from '~/lib/stores/mcp';

interface IntegrationsTabProps {
  onNavigate?: (tab: TabType) => void;
}

interface ConnectionCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tab: TabType;
  connected: boolean;
  detail?: string;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const BUILT_IN_FEATURES: FeatureCard[] = [
  {
    id: 'ai-codegen',
    title: 'GeraÃ§Ã£o de CÃ³digo com IA',
    description: 'CriaÃ§Ã£o, ediÃ§Ã£o e refatoraÃ§Ã£o de projetos via chat com streaming em tempo real.',
    icon: Code,
  },
  {
    id: 'discuss-mode',
    title: 'Modo Build/Discuss',
    description: 'Alterne entre construir o projeto e discutir arquitetura sem alterar arquivos.',
    icon: MessagesSquare,
  },
  {
    id: 'realtime-preview',
    title: 'Preview em Tempo Real',
    description: 'ExecuÃ§Ã£o do projeto no navegador via WebContainer, sem servidor externo.',
    icon: Eye,
  },
  {
    id: 'terminal',
    title: 'Terminal Integrado',
    description: 'Terminal completo conectado ao ambiente WebContainer do projeto.',
    icon: Terminal,
  },
  {
    id: 'inspector',
    title: 'Inspector de Elementos',
    description: 'Selecione elementos no preview para enviar contexto visual preciso Ã  IA.',
    icon: MousePointerClick,
  },
  {
    id: 'diff-view',
    title: 'VisualizaÃ§Ã£o de Diff',
    description: 'Compare as alteraÃ§Ãµes feitas pela IA em cada arquivo antes de aceitar.',
    icon: GitCompare,
  },
  {
    id: 'snapshots',
    title: 'Snapshots & RestauraÃ§Ã£o',
    description: 'Estado do projeto salvo por conversa, com restauraÃ§Ã£o de versÃµes anteriores.',
    icon: History,
  },
  {
    id: 'prompt-enhancer',
    title: 'Prompt Enhancer',
    description: 'Reescrita automÃ¡tica do seu prompt para melhorar o resultado da geraÃ§Ã£o.',
    icon: Sparkles,
  },
  {
    id: 'web-search',
    title: 'Busca na Web & Leitor de URLs',
    description: 'Pesquisa na internet e extraÃ§Ã£o de conteÃºdo de URLs como contexto do chat.',
    icon: Globe,
  },
  {
    id: 'speech-to-text',
    title: 'Entrada por Voz',
    description: 'Dite prompts usando reconhecimento de fala do navegador.',
    icon: Mic,
  },
  {
    id: 'image-context',
    title: 'Imagens como Contexto',
    description: 'Anexe screenshots e imagens ao prompt para design e debugging visual.',
    icon: ImagePlus,
  },
  {
    id: 'import',
    title: 'ImportaÃ§Ã£o de Projetos',
    description: 'Clone repositÃ³rios Git, importe pastas locais ou comece de templates.',
    icon: FolderInput,
  },
  {
    id: 'export',
    title: 'ExportaÃ§Ã£o & Backup',
    description: 'Exporte e importe chats, configuraÃ§Ãµes e API keys em JSON.',
    icon: FileJson,
  },
  {
    id: 'expo-qr',
    title: 'Preview Mobile (Expo)',
    description: 'QR code para abrir projetos Expo diretamente no celular.',
    icon: Smartphone,
  },
  {
    id: 'file-lock',
    title: 'Bloqueio de Arquivos',
    description: 'Trave arquivos ou pastas para impedir alteraÃ§Ãµes pela IA.',
    icon: Lock,
  },
  {
    id: 'auto-fix',
    title: 'Auto-correÃ§Ã£o de Erros',
    description: 'Erros de preview/terminal sÃ£o enviados Ã  IA automaticamente (opt-in na aba Features).',
    icon: Bot,
  },
  {
    id: 'stripe',
    title: 'Pagamentos Stripe via Prompt',
    description:
      'PeÃ§a "adicione pagamentos" e o agente gera checkout, webhooks e tabelas (Edge Functions no Supabase).',
    icon: CreditCard,
  },
  {
    id: 'supabase-deep',
    title: 'Supabase: Migrations, RLS & Storage',
    description: 'Migrations versionadas, auth nativa, polÃ­ticas RLS e buckets de storage gerados pelo agente.',
    icon: Database,
  },
  {
    id: 'chat-search',
    title: 'Busca no HistÃ³rico de Chats',
    description: 'A busca do sidebar encontra conversas pelo tÃ­tulo e pelo conteÃºdo das mensagens.',
    icon: Search,
  },
  {
    id: 'inline-visual-edit',
    title: 'EdiÃ§Ã£o de Texto Inline',
    description: 'Selecione um elemento no preview e edite o texto direto no cÃ³digo, sem gastar tokens.',
    icon: Paintbrush,
  },
  {
    id: 'custom-instructions',
    title: 'Custom Instructions',
    description:
      'InstruÃ§Ãµes pessoais anexadas a todo chat (idioma, stack preferida, estilo de cÃ³digo) â€” aba Features.',
    icon: Sparkles,
  },
];

const ROADMAP: FeatureCard[] = [];

export default function IntegrationsTab({ onNavigate }: IntegrationsTabProps) {
  const githubConnected = useStore(isGitHubConnected);
  const gitlabConnected = useStore(isGitLabConnected);
  const netlify = useStore(netlifyConnection);
  const vercel = useStore(vercelConnection);
  const supabase = useStore(supabaseConnection);
  const mcpServers = useMCPStore((state) => state.settings.mcpConfig.mcpServers);
  const [configuredProviderCount, setConfiguredProviderCount] = useState(0);

  useEffect(() => {
    localStorage.removeItem('hubine_integrations');
    useMCPStore.getState().initialize().catch(console.error);

    try {
      const apiKeys = JSON.parse(Cookies.get('apiKeys') || '{}') as Record<string, string>;
      setConfiguredProviderCount(Object.values(apiKeys).filter(Boolean).length);
    } catch {
      setConfiguredProviderCount(0);
    }
  }, []);

  const mcpServerCount = Object.keys(mcpServers).length;
  const supabaseConnected = Boolean(supabase.user || supabase.isConnected);

  const connections: ConnectionCard[] = [
    {
      id: 'github',
      title: 'GitHub',
      description: 'Push, clone e sincronizaÃ§Ã£o de repositÃ³rios com sua conta GitHub.',
      icon: Github,
      tab: 'github',
      connected: githubConnected,
    },
    {
      id: 'gitlab',
      title: 'GitLab',
      description: 'ConexÃ£o com projetos e repositÃ³rios GitLab.',
      icon: Gitlab,
      tab: 'gitlab',
      connected: gitlabConnected,
    },
    {
      id: 'netlify',
      title: 'Netlify',
      description: 'Deploy do projeto em 1 clique com URL pÃºblica.',
      icon: Cloud,
      tab: 'netlify',
      connected: Boolean(netlify.user),
      detail: netlify.user?.full_name || netlify.user?.email,
    },
    {
      id: 'vercel',
      title: 'Vercel',
      description: 'Deploy e gerenciamento de projetos na Vercel.',
      icon: Triangle,
      tab: 'vercel',
      connected: Boolean(vercel.user),
      detail: vercel.user?.username || vercel.user?.email,
    },
    {
      id: 'supabase',
      title: 'Supabase',
      description: 'Banco PostgreSQL, autenticaÃ§Ã£o e execuÃ§Ã£o de queries no projeto.',
      icon: Database,
      tab: 'supabase',
      connected: supabaseConnected,
      detail: supabase.project?.name,
    },
    {
      id: 'mcp',
      title: 'Servidores MCP',
      description: 'Ferramentas externas para o agente via Model Context Protocol.',
      icon: Wrench,
      tab: 'mcp',
      connected: mcpServerCount > 0,
      detail: mcpServerCount > 0 ? `${mcpServerCount} servidor${mcpServerCount === 1 ? '' : 'es'}` : undefined,
    },
    {
      id: 'cloud-providers',
      title: 'Provedores de IA (Cloud)',
      description: 'DeepSeek, OpenAI, Anthropic, Google e outros provedores de modelos.',
      icon: Cpu,
      tab: 'cloud-providers',
      connected: configuredProviderCount > 0,
      detail:
        configuredProviderCount > 0
          ? `${configuredProviderCount} provedor${configuredProviderCount === 1 ? '' : 'es'} com chave`
          : undefined,
    },
    {
      id: 'local-providers',
      title: 'Provedores Locais',
      description: 'Ollama, LM Studio e modelos rodando na sua mÃ¡quina.',
      icon: Laptop,
      tab: 'local-providers',
      connected: false,
      detail: 'status na aba dedicada',
    },
  ];

  const handleConfigure = (tab: TabType) => {
    onNavigate?.(tab);
  };

  return (
    <div className="flex flex-col gap-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-col gap-1 border-b border-bolt-elements-borderColor pb-4">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">Recursos & IntegraÃ§Ãµes do Hubine</h2>
        <p className="text-sm text-bolt-elements-textSecondary font-light">
          Status real das conexÃµes externas, recursos nativos da plataforma e o que vem a seguir.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-bolt-elements-borderColor/30 pb-2">
          <Cloud className="w-5 h-5 text-purple-500" />
          <h3 className="text-md font-semibold text-bolt-elements-textPrimary">ConexÃµes Externas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((item) => {
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.id}
                layout
                className="relative group bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-all duration-200 rounded-lg border border-bolt-elements-borderColor/50 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-purple-500" />
                    <h4 className="font-semibold text-bolt-elements-textPrimary text-sm">{item.title}</h4>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary mt-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-bolt-elements-borderColor/20">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${item.connected ? 'bg-green-500 animate-pulse' : 'bg-bolt-elements-textTertiary'}`}
                    />
                    <span className="text-[10px] uppercase font-semibold text-bolt-elements-textSecondary">
                      {item.connected ? item.detail || 'Conectado' : item.detail || 'NÃ£o configurado'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleConfigure(item.tab)}
                    className="text-[10px] font-semibold text-purple-500 hover:text-purple-600 hover:underline transition-colors"
                  >
                    {item.connected ? 'Gerenciar' : 'Configurar'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-bolt-elements-borderColor/30 pb-2">
          <Code className="w-5 h-5 text-purple-500" />
          <h3 className="text-md font-semibold text-bolt-elements-textPrimary">Recursos Nativos</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-500/10 text-green-500">
            Sempre ativos
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUILT_IN_FEATURES.map((item) => {
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-purple-500" />
                  <h4 className="font-semibold text-bolt-elements-textPrimary text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-bolt-elements-textSecondary mt-2 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-bolt-elements-borderColor/30 pb-2">
          <Bot className="w-5 h-5 text-purple-500" />
          <h3 className="text-md font-semibold text-bolt-elements-textPrimary">Roadmap</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 text-purple-500">
            Planejado â€” ainda nÃ£o disponÃ­vel
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROADMAP.map((item) => {
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className="bg-bolt-elements-background-depth-2 rounded-lg border border-dashed border-bolt-elements-borderColor/50 p-4 opacity-75"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-bolt-elements-textTertiary" />
                  <h4 className="font-semibold text-bolt-elements-textPrimary text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-bolt-elements-textSecondary mt-2 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
