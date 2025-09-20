import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Plugin } from "@/lib/plugin-store";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plugin: Plugin | null;
  action: "install" | "uninstall";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  plugin,
  action,
  isLoading = false,
}: ConfirmationModalProps) {
  if (!plugin) return null;

  const isUninstall = action === "uninstall";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isUninstall && (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <div>
              <DialogTitle>
                {isUninstall ? "Uninstall Plugin" : "Install Plugin"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <DialogDescription className="text-base">
            Are you sure you want to {action}{" "}
            <span className="font-semibold text-foreground">"{plugin.name}"</span>
            {isUninstall && (
              <>
                ?
                <br />
                <br />
                <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded text-sm">
                  This will remove the plugin and all its data from your DAO.
                </span>
              </>
            )}
            {!isUninstall && plugin.isPaid && (
              <>
                ?
                <br />
                <br />
                <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">
                  This plugin costs {plugin.pricing}. Payment will be processed immediately.
                </span>
              </>
            )}
          </DialogDescription>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={isUninstall ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUninstall ? "Uninstalling..." : "Installing..."}
              </>
            ) : (
              `${isUninstall ? "Uninstall" : "Install"} Plugin`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}