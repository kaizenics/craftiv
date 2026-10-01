"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import {
  AI_PROVIDER_IDS,
  AI_PROVIDERS,
  MODEL_ID_PATTERN,
  findProviderModel,
  type AiProviderId,
} from "@/lib/ai-providers";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/root";

type OwnAiView = inferRouterOutputs<AppRouter>["ownAi"]["get"];

const CUSTOM_MODEL = "__custom__";

/**
 * Settings section for "bring your own AI": pick a provider, pick a model,
 * paste a key, and Craftiv's AI features run on that key instead of credits.
 *
 * Not a <form>: Save & test is one of several actions here, so Enter in the
 * key and model fields is wired to it explicitly.
 */
export function OwnAiSettings() {
  const utils = trpc.useUtils();
  const { data, isLoading, error: loadError } = trpc.ownAi.get.useQuery();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpdated = (next: OwnAiView) => {
    utils.ownAi.get.setData(undefined, next);
  };

  const setEnabled = trpc.ownAi.setEnabled.useMutation({
    onSuccess: (next) => {
      onUpdated(next);
      toast.success(
        next.connection?.enabled
          ? "Craftiv will use your own AI. AI actions no longer spend credits."
          : "Switched back to Craftiv credits.",
      );
    },
    onError: (err) => setError(err.message),
  });
  const test = trpc.ownAi.test.useMutation({
    onSuccess: () => {
      void utils.ownAi.get.invalidate();
      toast.success("Connection works.");
    },
    onError: (err) => setError(err.message),
  });
  const remove = trpc.ownAi.remove.useMutation({
    onSuccess: (next) => {
      onUpdated(next);
      setEditing(false);
      toast.success("Your key was removed. AI actions use credits again.");
    },
    onError: (err) => setError(err.message),
  });

  if (loadError) {
    return <ErrorNote message="Couldn't load your AI provider settings. Please refresh the page." />;
  }
  if (isLoading || !data) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const { unlocked, connection } = data;

  if (!unlocked) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Use your own AI</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your OpenAI, Claude, Gemini or OpenRouter API key and use every Craftiv
              AI feature without spending credits. Included with any credit pack.
            </p>
            {connection && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your saved {AI_PROVIDERS[connection.provider].label} key is paused until you
                buy a pack.
              </p>
            )}
            <Button asChild size="sm" className="mt-4">
              <Link href="/pricing">See credit packs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!connection || editing) {
    return (
      <ConnectForm
        initial={connection}
        onCancel={connection ? () => setEditing(false) : undefined}
        onSaved={(next) => {
          onUpdated(next);
          setEditing(false);
          setError(null);
          toast.success("Connected. Craftiv's AI features now use your key.");
        }}
      />
    );
  }

  const provider = AI_PROVIDERS[connection.provider];
  const modelLabel = findProviderModel(connection.provider, connection.model)?.label ?? connection.model;
  const busy = setEnabled.isPending || test.isPending || remove.isPending;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{provider.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {modelLabel} · key <span className="font-mono">{connection.keyHint}</span>
          </p>
          {connection.lastVerifiedAt && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success-surface-foreground" aria-hidden="true" />
              Verified {formatDistanceToNow(new Date(connection.lastVerifiedAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setError(null);
              test.mutate();
            }}
          >
            {test.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {test.isPending ? "Testing..." : "Test connection"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setError(null);
              setEditing(true);
            }}
          >
            Change
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm" disabled={busy}>
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove your {provider.label} key?</AlertDialogTitle>
                <AlertDialogDescription>
                  Craftiv deletes the saved key and AI actions go back to using your credits.
                  The key itself keeps working with {provider.label}; revoke it there if you no
                  longer need it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setError(null);
                    remove.mutate();
                  }}
                >
                  Remove key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="text-sm text-foreground">Use my own AI for Craftiv features</p>
          <p className="text-xs text-muted-foreground">
            {connection.enabled
              ? "On: AI actions run on your key and cost 0 credits."
              : "Off: AI actions use your Craftiv credits."}
          </p>
        </div>
        <Switch
          checked={connection.enabled}
          disabled={busy}
          aria-label="Use my own AI for Craftiv features"
          onCheckedChange={(enabled) => {
            setError(null);
            setEnabled.mutate({ enabled });
          }}
        />
      </div>

      {error && <ErrorNote message={error} />}
    </div>
  );
}

type ConnectionView = NonNullable<OwnAiView["connection"]>;

function ConnectForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: ConnectionView | null;
  onCancel?: () => void;
  onSaved: (next: OwnAiView) => void;
}) {
  const [provider, setProvider] = useState<AiProviderId | null>(initial?.provider ?? null);
  const initialIsSuggested =
    !!initial && !!findProviderModel(initial.provider, initial.model);
  const [modelChoice, setModelChoice] = useState<string>(
    initial ? (initialIsSuggested ? initial.model : CUSTOM_MODEL) : "",
  );
  const [customModel, setCustomModel] = useState(initialIsSuggested ? "" : initial?.model ?? "");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = trpc.ownAi.save.useMutation({
    onSuccess: (data) => {
      setApiKey("");
      onSaved(data);
    },
    onError: (err) => setError(err.message),
  });

  const info = provider ? AI_PROVIDERS[provider] : null;
  const model = modelChoice === CUSTOM_MODEL ? customModel.trim() : modelChoice;
  // Changing only the model keeps the stored key, but only for the provider
  // that issued it.
  const canReuseKey = !!initial && initial.provider === provider;
  const keyReady = apiKey.trim().length > 0 || canReuseKey;
  const modelValid = MODEL_ID_PATTERN.test(model);
  const canSave = !!provider && modelValid && keyReady && !save.isPending;

  const chooseProvider = (next: AiProviderId) => {
    setProvider(next);
    setModelChoice(AI_PROVIDERS[next].defaultModel);
    setCustomModel("");
    setError(null);
  };

  const submit = () => {
    if (!provider || !canSave) return;
    setError(null);
    save.mutate({
      provider,
      model,
      apiKey: apiKey.trim() || undefined,
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <fieldset>
        <legend className="text-sm font-medium text-foreground">1. Choose your AI provider</legend>
        <div role="radiogroup" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AI_PROVIDER_IDS.map((id) => {
            const selected = provider === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseProvider(id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {AI_PROVIDERS[id].label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {info && provider && (
        <>
          <div className="mt-5">
            <label htmlFor="own-ai-model" className="text-sm font-medium text-foreground">
              2. Choose a model
            </label>
            <Select value={modelChoice} onValueChange={setModelChoice}>
              <SelectTrigger id="own-ai-model" className="mt-2 h-10 w-full rounded-lg bg-background sm:w-80">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {info.models.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label} — {option.hint}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_MODEL}>Other model ID…</SelectItem>
              </SelectContent>
            </Select>
            {modelChoice === CUSTOM_MODEL && (
              <Input
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={info.defaultModel}
                aria-label="Model ID"
                className="mt-2 sm:w-80"
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="own-ai-key" className="text-sm font-medium text-foreground">
              3. Paste your {info.label} API key
            </label>
            <div className="mt-2 flex gap-2 sm:w-[28rem]">
              <Input
                id="own-ai-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={canReuseKey ? `Keep current key (${initial?.keyHint})` : info.keyPlaceholder}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowKey((value) => !value)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Get a {info.label} API key
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Your key is encrypted and never shown again. When this is on, the resume and job
              text you send to an AI feature goes to {info.label} under your own account, and
              usage is billed by {info.label}.
            </span>
          </p>
        </>
      )}

      {error && <ErrorNote message={error} />}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={!canSave}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {save.isPending ? "Testing your key..." : "Save & test"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-surface-foreground"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
