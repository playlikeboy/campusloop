"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCollegeName: string;
  setNewCollegeName: (val: string) => void;
  newCollegeState: string;
  setNewCollegeState: (val: string) => void;
  newCollegeDistrict: string;
  setNewCollegeDistrict: (val: string) => void;
  newCollegeWebsite: string;
  setNewCollegeWebsite: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddCollegeModal({
  isOpen,
  onClose,
  newCollegeName,
  setNewCollegeName,
  newCollegeState,
  setNewCollegeState,
  newCollegeDistrict,
  setNewCollegeDistrict,
  newCollegeWebsite,
  setNewCollegeWebsite,
  submitting,
  onSubmit,
}: AddCollegeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add your college</DialogTitle>
          <DialogDescription>Can't find your college? Tell us and we'll add it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-college-name">College name</Label>
            <Input
              id="new-college-name"
              placeholder="St. Xavier's College, Mumbai"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-college-state">State</Label>
              <Input
                id="new-college-state"
                placeholder="Maharashtra"
                value={newCollegeState}
                onChange={(e) => setNewCollegeState(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-college-district">City</Label>
              <Input
                id="new-college-district"
                placeholder="Mumbai"
                value={newCollegeDistrict}
                onChange={(e) => setNewCollegeDistrict(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-college-website">Website (optional)</Label>
            <Input
              id="new-college-website"
              inputMode="url"
              placeholder="xaviers.edu"
              value={newCollegeWebsite}
              onChange={(e) => setNewCollegeWebsite(e.target.value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting || !newCollegeName.trim()}>
              Send request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
