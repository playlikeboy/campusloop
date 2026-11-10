"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CommunityRule {
  title: string;
  description: string;
}

export const MAX_COMMUNITY_RULES = 6;

interface CommunityRulesEditorProps {
  rules: CommunityRule[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof CommunityRule, value: string) => void;
}

export function CommunityRulesEditor({ rules, onAdd, onRemove, onChange }: CommunityRulesEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>Up to {MAX_COMMUNITY_RULES}. Empty rules are skipped.</CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAdd}
            disabled={rules.length >= MAX_COMMUNITY_RULES}
          >
            <Plus />
            Add rule
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {rules.map((rule, idx) => {
            const titleId = `rule-${idx}-title`;
            const descId = `rule-${idx}-desc`;
            return (
              <li key={idx} className="space-y-2 border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={titleId}>Rule {idx + 1}</Label>
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(idx)}
                      aria-label={`Remove rule ${idx + 1}`}
                      className="hover:bg-danger-subtle hover:text-danger"
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                <Input
                  id={titleId}
                  placeholder="No spam"
                  value={rule.title}
                  maxLength={80}
                  onChange={(e) => onChange(idx, "title", e.target.value)}
                />
                <Input
                  id={descId}
                  aria-label={`Rule ${idx + 1} details (optional)`}
                  placeholder="Details (optional)"
                  value={rule.description}
                  maxLength={200}
                  onChange={(e) => onChange(idx, "description", e.target.value)}
                />
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
