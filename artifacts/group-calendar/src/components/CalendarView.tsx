import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAvailability,
  getGetAvailabilityQueryKey,
  useToggleAvailability,
  useGetAvailabilitySummary,
  getGetAvailabilitySummaryQueryKey,
} from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { clearIdentity } from "../lib/identity";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function shortName(nickname: string): string {
  return nickname.length > 3 ? nickname.slice(0, 3) : nickname;
}

export function CalendarView({ currentUser, onLogout }: { currentUser: User; onLogout: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: availability = [], isLoading } = useGetAvailability({
    query: { queryKey: getGetAvailabilityQueryKey() },
  });

  const { data: summary } = useGetAvailabilitySummary({
    query: { queryKey: getGetAvailabilitySummaryQueryKey() },
  });

  const toggleMutation = useToggleAvailability();

  const handleLogout = () => {
    clearIdentity();
    onLogout();
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  const toggleDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    toggleMutation.mutate(
      { data: { date: dateStr, userId: currentUser.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAvailabilityQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAvailabilitySummaryQueryKey() });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b-2 border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 rotate-3">
              <CalendarIcon className="w-6 h-6 -rotate-3" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground hidden sm:block">揪團日曆</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 bg-card hover:bg-muted border-2 border-border px-4 py-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
              title="切換身份"
            >
              <span className="font-bold text-foreground">{currentUser.nickname}</span>
              <LogOut className="w-4 h-4 text-muted-foreground ml-1" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Summary Banner */}
        {summary && summary.topDates.length > 0 && (
          <div className="bg-secondary rounded-3xl p-6 md:p-8 border-2 border-secondary-foreground/10 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary-foreground/5 rounded-full blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-background/40 rounded-full blur-2xl" />

            <div className="flex-1 text-center md:text-left relative z-10">
              <h2 className="text-3xl font-black text-secondary-foreground mb-2">大家最多人有空的日期</h2>
              <p className="text-secondary-foreground/80 font-bold text-lg">
                共 {summary.totalUsers} 人參與，已標記 {summary.totalDaysMarked} 天
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center relative z-10">
              {summary.topDates.slice(0, 3).map((date) => (
                <div
                  key={date.date}
                  className="bg-card rounded-2xl p-4 shadow-lg border-2 border-border text-center min-w-[110px] transform transition-transform hover:-translate-y-2"
                >
                  <div className="text-sm font-black text-primary mb-1 uppercase tracking-widest">
                    {format(new Date(date.date + "T00:00:00"), "M月d日", { locale: zhTW })}
                  </div>
                  <div className="text-3xl font-black text-foreground">{date.count}</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">人有空</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Controller */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <h2 className="text-4xl font-black text-foreground capitalize tracking-tight">
            {format(currentDate, "yyyy年 M月", { locale: zhTW })}
          </h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              className="rounded-2xl border-2 border-border hover:bg-muted hover:border-primary w-14 h-14 bg-card shadow-sm"
            >
              <ChevronLeft className="w-7 h-7 text-foreground" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="rounded-2xl border-2 border-border hover:bg-muted hover:border-primary w-14 h-14 bg-card shadow-sm"
            >
              <ChevronRight className="w-7 h-7 text-foreground" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-[2rem] border-4 border-border shadow-2xl p-4 sm:p-8">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-6">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-sm sm:text-base font-black text-muted-foreground uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full mb-4 flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-primary opacity-50" />
                </div>
                <div className="text-muted-foreground font-bold text-lg">載入中...</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
              {paddingDays.map((i) => (
                <div key={`pad-${i}`} className="aspect-square rounded-2xl bg-muted/30 opacity-50 border-2 border-transparent" />
              ))}

              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayData = availability.find((a) => a.date === dateStr);
                const users = dayData?.users || [];
                const isMarked = users.some((u) => u.id === currentUser.id);
                const isTodayDate = isToday(day);

                return (
                  <Popover key={dateStr}>
                    <PopoverTrigger asChild>
                      <button
                        onClick={() => toggleDay(day)}
                        disabled={toggleMutation.isPending}
                        className={`
                          relative aspect-square rounded-2xl p-1 sm:p-2 flex flex-col items-center justify-between transition-all duration-300 border-2
                          hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50
                          ${isMarked
                            ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                            : "bg-background border-border hover:border-primary/50"}
                          ${isTodayDate && !isMarked ? "bg-secondary/30 border-secondary-foreground/20" : ""}
                        `}
                      >
                        <span
                          className={`text-base sm:text-xl font-black leading-tight ${
                            isMarked ? "text-primary-foreground" : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {/* Nickname tags */}
                        <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                          {users.slice(0, 2).map((u) => (
                            <span
                              key={u.id}
                              className={`text-[9px] sm:text-[11px] font-bold leading-tight text-center truncate px-1 rounded-md ${
                                u.id === currentUser.id
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                              title={u.nickname}
                            >
                              {shortName(u.nickname)}
                            </span>
                          ))}
                          {users.length > 2 && (
                            <span
                              className={`text-[9px] sm:text-[11px] font-black text-center ${
                                isMarked ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              +{users.length - 2}
                            </span>
                          )}
                        </div>
                      </button>
                    </PopoverTrigger>

                    {users.length > 0 && (
                      <PopoverContent
                        className="w-72 p-0 rounded-[2rem] border-4 border-primary shadow-2xl animate-in zoom-in-95 overflow-hidden"
                        side="top"
                      >
                        <div className="bg-primary p-4 text-center">
                          <div className="font-black text-xl text-primary-foreground">
                            {format(day, "EEEE", { locale: zhTW })}
                          </div>
                          <div className="font-bold text-primary-foreground/80">
                            {format(day, "yyyy年M月d日", { locale: zhTW })}
                          </div>
                        </div>
                        <div className="p-4 bg-card max-h-[300px] overflow-y-auto">
                          <div className="text-sm font-bold text-muted-foreground mb-3">
                            {users.length} 人有空
                          </div>
                          <div className="space-y-2">
                            {users.map((u) => (
                              <div key={u.id} className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                                    u.id === currentUser.id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary text-secondary-foreground"
                                  }`}
                                >
                                  {u.nickname.slice(0, 1)}
                                </div>
                                <span className="font-bold text-base text-foreground">
                                  {u.nickname}
                                  {u.id === currentUser.id && (
                                    <span className="text-xs font-medium text-muted-foreground ml-2">（我）</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
