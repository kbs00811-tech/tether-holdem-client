import { AlertCircle, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useNavigate } from "react-router";

interface InsufficientBalanceModalProps {
  open: boolean;
  onClose: () => void;
  required: number;
  current: number;
}

export function InsufficientBalanceModal({
  open,
  onClose,
  required,
  current,
}: InsufficientBalanceModalProps) {
  const navigate = useNavigate();
  const shortage = required - current;

  const handleTopUp = () => {
    navigate("/cashier");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center">잔액이 부족합니다</DialogTitle>
          <DialogDescription className="text-center">
            바이인 금액이 현재 잔액보다 많습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">필요 금액</span>
              <span className="font-mono font-bold text-destructive">
                {required.toLocaleString()} USDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 잔액</span>
              <span className="font-mono font-medium">
                {current.toLocaleString()} USDT
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">부족 금액</span>
                <span className="font-mono font-bold text-accent">
                  {shortage.toLocaleString()} USDT
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            캐셔에서 USDT를 충전하시겠습니까?
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={handleTopUp} className="flex-1 gap-2">
            <Wallet className="h-4 w-4" />
            충전하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
