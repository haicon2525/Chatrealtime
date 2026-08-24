import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestDialog from "./FriendRequestDialog";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { receivedList, getAllFriendRequests } = useFriendStore();

  useEffect(() => {
    getAllFriendRequests();
  }, [getAllFriendRequests]);

  const count = receivedList?.length || 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative hover:bg-background/20 text-white"
        title="Thông báo kết bạn"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      <FriendRequestDialog
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}
