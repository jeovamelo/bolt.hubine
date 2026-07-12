import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';
import { WebSearch } from './WebSearch.client';
import { applyInlineTextEdit } from '~/utils/inlineTextEdit';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  onWebSearchResult?: (result: string) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [isEditingText, setIsEditingText] = React.useState(false);
  const [editedText, setEditedText] = React.useState('');

  const selectedText = props.selectedElement?.textContent?.trim() ?? '';
  const canInlineEdit = selectedText.length > 0 && (props.selectedElement?.textContent?.length ?? 0) < 100;

  React.useEffect(() => {
    setIsEditingText(false);
  }, [props.selectedElement]);

  const handleApplyInlineEdit = async () => {
    if (!editedText.trim() || editedText === selectedText) {
      setIsEditingText(false);
      return;
    }

    const result = await applyInlineTextEdit(selectedText, editedText);

    if (result.status === 'applied') {
      toast.success(`Text updated in ${result.filePath.split('/').pop()}`);
      props.setSelectedElement?.(null);
    } else if (result.status === 'not-found') {
      toast.warning('Text not found in project files — it may be dynamic. Ask the AI instead.');
    } else {
      toast.warning(`Text appears ${result.count} times in the project — too ambiguous. Ask the AI instead.`);
    }

    setIsEditingText(false);
  };

  return (
    <div
      className={classNames(
        'relative bg-bolt-elements-background-depth-2 backdrop-blur p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',

        /*
         * {
         *   'sticky bottom-2': chatStarted,
         * },
         */
      )}
    >
      <svg className={classNames(styles.PromptEffectContainer)}>
        <defs>
          <linearGradient
            id="line-gradient"
            x1="20%"
            y1="0%"
            x2="-14%"
            y2="10%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>
      <div>
        <ClientOnly>
          {() => (
            <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
              <ModelSelector
                key={props.provider?.name + ':' + props.modelList.length}
                model={props.model}
                setModel={props.setModel}
                modelList={props.modelList}
                provider={props.provider}
                setProvider={props.setProvider}
                providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                apiKeys={props.apiKeys}
                modelLoading={props.isModelLoading}
              />
              {(props.providerList || []).length > 0 &&
                props.provider &&
                !LOCAL_PROVIDERS.includes(props.provider.name) && (
                  <APIKeyManager
                    provider={props.provider}
                    apiKey={props.apiKeys[props.provider.name] || ''}
                    setApiKey={(key) => {
                      props.onApiKeysChange(props.provider.name, key);
                    }}
                  />
                )}
            </div>
          )}
        </ClientOnly>
      </div>
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
        }}
      />
      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>
      {props.selectedElement && (
        <div className="flex flex-col mx-1.5 rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              selected for inspection
            </div>
            <div className="flex gap-3 items-center">
              {canInlineEdit && !isEditingText && (
                <button
                  className="bg-transparent text-accent-500 pointer-auto"
                  onClick={() => {
                    setEditedText(selectedText);
                    setIsEditingText(true);
                  }}
                >
                  Edit text
                </button>
              )}
              <button
                className="bg-transparent text-accent-500 pointer-auto"
                onClick={() => props.setSelectedElement?.(null)}
              >
                Clear
              </button>
            </div>
          </div>
          {isEditingText && (
            <div className="flex gap-2 items-center mt-1.5 mb-1">
              <input
                autoFocus
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyInlineEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditingText(false);
                  }
                }}
                className="flex-1 px-2 py-1 rounded bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                placeholder="New text for this element"
              />
              <button className="bg-transparent text-accent-500 pointer-auto" onClick={handleApplyInlineEdit}>
                Apply
              </button>
              <button
                className="bg-transparent text-bolt-elements-textSecondary pointer-auto"
                onClick={() => setIsEditingText(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      <div
        className={classNames('relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg')}
      >
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
            'transition-all duration-200',
            'hover:border-bolt-elements-focus',
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={
            props.chatMode === 'build'
              ? 'Como o bolt.hubine pode ajudar hoje?'
              : 'Sobre o que você gostaria de conversar?'
          }
          translate="no"
        />
        <ClientOnly>
          {() => (
            <SendButton
              show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
              isStreaming={props.isStreaming}
              disabled={!props.providerList || props.providerList.length === 0}
              onClick={(event) => {
                if (props.isStreaming) {
                  props.handleStop?.();
                  return;
                }

                if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                  props.handleSendMessage?.(event);
                }
              }}
            />
          )}
        </ClientOnly>
        <div className="flex justify-between items-center text-sm p-4 pt-2">
          <div className="flex gap-1 items-center">
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
            <McpTools />
            <IconButton title="Upload file" className="transition-all" onClick={() => props.handleFileUpload()}>
              <div className="i-ph:paperclip text-xl"></div>
            </IconButton>
            <WebSearch onSearchResult={(result) => props.onWebSearchResult?.(result)} disabled={props.isStreaming} />
            <IconButton
              title="Enhance prompt"
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames('transition-all', props.enhancingPrompt ? 'opacity-100' : '')}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
              ) : (
                <div className="i-bolt:stars text-xl"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            {props.chatStarted && (
              <IconButton
                title="Discuss"
                className={classNames(
                  'transition-all flex items-center gap-1 px-1.5',
                  props.chatMode === 'discuss'
                    ? '!bg-bolt-elements-item-backgroundAccent !text-bolt-elements-item-contentAccent'
                    : 'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault',
                )}
                onClick={() => {
                  props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                }}
              >
                <div className={`i-ph:chats text-xl`} />
                {props.chatMode === 'discuss' ? <span>Discuss</span> : <span />}
              </IconButton>
            )}
            <IconButton
              title="Model Settings"
              className={classNames('transition-all flex items-center gap-1', {
                'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                  props.isModelSettingsCollapsed,
                'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                  !props.isModelSettingsCollapsed,
              })}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
            >
              <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
              {props.isModelSettingsCollapsed ? <span className="text-xs">{props.model}</span> : <span />}
            </IconButton>
          </div>
          {props.input.length > 3 ? (
            <div className="text-xs text-bolt-elements-textTertiary">
              Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> +{' '}
              <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd> a new line
            </div>
          ) : null}
          {props.isStreaming && (
            <button
              title="Parar geração"
              onClick={() => props.handleStop?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all animate-pulse"
            >
              <div className="i-ph:stop-circle-bold text-base" />
              <span>Parar</span>
            </button>
          )}
          <SupabaseConnection />
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};
