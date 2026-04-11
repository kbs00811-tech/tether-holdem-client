import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useNavigate } from "react-router";

interface KickedModalProps {
  open: boolean;
  reason: "insufficient-stack" | "timeout" | "kicked";
  minStack?: number;
}

export function KickedModal({ open, reason, minStack }: KickedModalProps) {
  const navigate = useNavigate();

  const messages = {
    "insufficient-stack": {
      title: "최소 스택 미달",
      description: `스택이 최소 금액(${minStack?.toLocaleString()} USDT) 미만입니다. 테이블에서 자동으로 퇴장됩니다.`,
    },
    timeout: {
      title: "연결 시간 초과",
      description: "장시간 응답이 없어 테이블에서 자동으로 퇴장되었습니다.",
    },
    kicked: {
      title: "테이블 퇴장",
      description: "비정상적인 행위로 인해 테이블에서 퇴장되었습니다.",
    },
  };

  const config = messages[reason];

  const handleReturn = () => {
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px]" hideClose>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          <Button onClick={handleReturn} className="w-full">
            로비로 돌아가기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
